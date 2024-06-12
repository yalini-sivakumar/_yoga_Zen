// src/components/ClassDetails.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const ClassDetails = () => {
  const { id } = useParams();
  const [classDetails, setClassDetails] = useState(null);

  useEffect(() => {
    const fetchClassDetails = async () => {
      const response = await api.get(`/class/${id}`);
      setClassDetails(response.data);
    };

    fetchClassDetails();
  }, [id]);

  if (!classDetails) return <div>Loading...</div>;

  return (
    <div>
      <h1>{classDetails.name}</h1>
      <p>{classDetails.description}</p>
      <p>Price: ${classDetails.price}</p>
      <p>Available Seats: {classDetails.availableSeats}</p>
      <button onClick={() => addToCart(classDetails._id)}>Add to Cart</button>
    </div>
  );

  function addToCart(classId) {
    const userMail = "user@example.com"; // Replace with actual user email
    api.post('/add-to-cart', { classId, userMail })
      .then(response => {
        console.log("Added to cart", response.data);
      })
      .catch(error => {
        console.error("Error adding to cart", error);
      });
  }
};

export default ClassDetails;
