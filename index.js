const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const stripe = require("stripe")(process.env.PAYMENT_SECRET);
const { MongoClient, ServerApiVersion, ObjectId, Transaction } = require('mongodb');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga-master.yj5h1ct.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// Define verifyJWT middleware
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Define verifyAdmin middleware
const verifyAdmin = (req, res, next) => {
  // Your logic to verify if the user is an admin goes here
  // For example, check if the user role is 'admin'
  if (req.user && req.user.role === 'admin') {
    // User is an admin, proceed to the next middleware/route handler
    next();
  } else {
    // User is not an admin, send a 403 Forbidden response
    res.status(403).send('Access forbidden');
  }
};

async function run() {
  try {
    await client.connect();

    const database = client.db("yoga-master");
    const classesCollection = database.collection("classes");
    const cartCollection = database.collection("cart");
    const paymentCollection = database.collection("payments");
    const enrolledCollection = database.collection("enrolled");
    const appliedCollection = database.collection("applied");

    app.post('/new-class', async (req, res) =>{
      try {
        const newClass = req.body;
        const result = await classesCollection.insertOne(newClass);
        res.send(result);
      } catch (error) {
        console.error("Error inserting new class:", error);
        res.status(500).send("Failed to insert new class");
      }
    });

    app.get('/classes', async (req, res) => {
      const query = { status: "approved" };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/classes/:email', async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/classes-manage', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    app.patch('/change-status/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const reason = req.body.reason;
      const filter = { _id: new ObjectId(id) };
      const options = { upset: true };
      const updateDoc = {
        $set: {
          status: status,
          reason: reason,
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    app.get('/approved-classes', async (req, res) => {
      const query = { status: "approved" };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });
    
    //get single class details
    app.get('/class/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    });
    //update class details
app.put('/update-class/:id', async (req,res)=>{
  try {
    const id = req.params.id;
    const updateclass = req.body;
    const filter ={_id: new ObjectId(id)};
    const options = { upsert: true }; // Corrected the option name
    const updateDoc={
      $set: {
        name: updateclass.name,
        description: updateclass.description,
        price: updateclass.price,
        availableSeats: parseInt(updateclass.availableSeats),
        videoLink: updateclass.videoLink,
        status: 'pending',
      }
    }
    const result = await classesCollection.updateOne(filter,updateDoc,options);
    res.send(result);
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).send("Failed to update class");
  }
});

//carts routes
app.post('/add-to-cart', async (req,res)=>{
  const newCartItem = req.body;
  const result = await cartCollection.insertOne(newCartItem);
  res.send(result);
})
//get cart item
app.get('/cart-item/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.body.email;
    const query = {
      classId: id,
      userMail: email
    };
    const projection = { classId: 1 }; // Define the projection object
    const result = await cartCollection.findOne(query, { projection: projection });
    res.send(result);
  } catch (error) {
    console.error("Error finding cart item:", error);
    res.status(500).send("Failed to find cart item");
  }
});
//cart info by user mail
app.get('/cart/:email', async(req,res)=>{
  const email = req.params.email;
  const query = {userMail: email};
  const projection= {classId:1};
  const carts = await cartCollection.find(query,{projection:projection});
  const classIds = carts.map((cart) => new ObjectId(cart.classId));
  const query2 = {_id:{$in: classIds}};
  const result = await classesCollection.find(query2).toArray();
  res.send(result);
})
//delete cart item
app.delete('/delete-cart-item/:id', async (req,res)=>{
  const id = req.params.id;
  const query ={classId: id};
  const result = await cartCollection.deleteOne(query);
  res.send(result);
})
//payments 
app.post('/create-payment-intent', async (req,res)=>{
  const  {price} = req.body;
  const amount = parseInt(price)*100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount:amount,
    currency: "usd",
    payment_method_types: [
      "card"
    ],

  })
  res.send({
    clientSecret: paymentIntent.client_secret,
  })
})
//post payment
app.post('/payment-info', async(req,res)=>{
  const payemntInfo = req.body;
  const classesId = payemntInfo.classId;
  const userEmail = payemntInfo.userEmail;
  const singleClassId = req.query.classId;
   let query;
   if(singleClassId){
    query = { classId: singleClassId, userEmail: userEmail};
   }else{
    query = {
      classesId:{$in: classesId}
    };
   }
   const classesQuery = {_id:{$in: classesId.map(id=>new ObjectId(id))}};
   const classes = await classesCollection.find(classesQuery).toArray();
   const newEnrolledData ={
    userEmail: userEmail,
    classId: singleClassId.map(id=> new ObjectId(id)),
    TransactionId:payementInfo.transactionId
   };
   const updateDoc ={
    $set: {
      totalEnrolled: classes.reduce((total,current)=> total + current.totalEnrolled,0)+1 || 0,
      availableSeats: classes.reduce((total,current)=>total + current.availableSeats,0)-1 || 0
    }
   }
   const updatedResult= await classesCollection.updateMany(classesQuery,updatedDoc,{upsert: true});
   const enrolledResult = await enrolledCollection.insertOne(newEnrolledData);
   const deletedResult= await cartCollection.deleteMany(query);
   const payementResult= await paymentCollection.insertOne(payemntInfo);

   res.send({payementResult,deletedResult,enrolledResult,updatedResult})
})
//payment histroy
app.get("/payment-history/:email", async (req,res)=>{
  const email = req.params.email;
  const query = { userEmail: email};
  const result = await paymentCollection.find(query).sort({date: -1}).toArray();
  res.send(result);
})
//payment-histroy-length
app.get("/payment-history-length/:email", async(req,res)=>{
  const email = req.params.email;
  const query = { userEmail: email};
  const total = await paymentCollection.countDocuments(query);
  res.send({total});
})
//enrooledment
app.get('/popular-instructors', async (req, res) => {
  const pipeline = [
      {
          $group: {
              _id: "$instructorEmail",
              totalEnrolled: { $sum: "$totalEnrolled" },
          }
      },
      {
          $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "email",
              as: "instructor"
          }
      },
      {
          $project: {
              _id: 0,
              instructor: {
                  $arrayElemAt: ["$instructor", 0]
              },
              totalEnrolled: 1
          }
      },
      {
          $sort: {
              totalEnrolled: -1
          }
      },
      {
          $limit: 6
      }
  ]
  const result = await classesCollection.aggregate(pipeline).toArray();
  res.send(result);

})
//admin statrs
app.get('/admin-stats', verifyJWT, verifyAdmin, async (req, res) => {
  // Get approved classes and pending classes and instructors 
  const approvedClasses = (await classesCollection.find({ status: 'approved' }).toArray()).length;
  const pendingClasses = (await classesCollection.find({ status: 'pending' }).toArray()).length;
  const instructors = (await userCollection.find({ role: 'instructor' }).toArray()).length;
  const totalClasses = (await classesCollection.find().toArray()).length;
  const totalEnrolled = (await enrolledCollection.find().toArray()).length;
  // const totalRevenue = await paymentCollection.find().toArray();
  // const totalRevenueAmount = totalRevenue.reduce((total, current) => total + parseInt(current.price), 0);
  const result = {
      approvedClasses,
      pendingClasses,
      instructors,
      totalClasses,
      totalEnrolled,
      // totalRevenueAmount
  }
  res.send(result);

})
//get all instructor
app.get('/instructors', async (req, res) => {
  const result = await userCollection.find({ role: 'instructor' }).toArray();
  res.send(result);
})

app.get('/enrolled-classes/:email', verifyJWT, async (req, res) => {
  const email = req.params.email;
  const query = { userEmail: email };
  const pipeline = [
      {
          $match: query
      },
      {
          $lookup: {
              from: "classes",
              localField: "classesId",
              foreignField: "_id",
              as: "classes"
          }
      },
      {
          $unwind: "$classes"
      },
      {
          $lookup: {
              from: "users",
              localField: "classes.instructorEmail",
              foreignField: "email",
              as: "instructor"
          }
      },
      {
          $project: {
              _id: 0,
              classes: 1,
              instructor: {
                  $arrayElemAt: ["$instructor", 0]
              }
          }
      }

  ]
  const result = await enrolledCollection.aggregate(pipeline).toArray();
  // const result = await enrolledCollection.find(query).toArray();
  res.send(result);
})
//appilied for instrustor
app.post('/as-instructor', async (req, res) => {
  const data = req.body;
  const result = await appliedCollection.insertOne(data);
  res.send(result);
})
app.get('/applied-instructors/:email',   async (req, res) => {
  const email = req.params.email;
  const result = await appliedCollection.findOne({email});
  res.send(result);
});
// Send a ping to confirm a successful connection
// await client.db("admin").command({ ping: 1 });
console.log("Pinged your deployment. You successfully connected to MongoDB!");
} finally {
// Ensures that the client will close when you finish/error
}
}
run().catch(console.dir);


app.get('/', (req, res) => {
res.send('Yoga Master Server is running!');
})


// Listen
app.listen(port, () => {
console.log(`SERVER IS RUNNING ON PORT ${port}`);
})
 



    