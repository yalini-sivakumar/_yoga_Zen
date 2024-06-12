// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ClassList from './components/ClassList';
import ClassDetails from './components/ClassDetails';
import Cart from './components/Cart';
import Payment from './components/Payment';
import PaymentHistory from './components/PaymentHistory';

const App = () => {
  return (
    <Router>
      <div>
        <Switch>
          <Route exact path="/" component={ClassList} />
          <Route path="/class/:id" component={ClassDetails} />
          <Route path="/cart" component={Cart} />
          <Route path="/payment" component={Payment} />
          <Route path="/payment-history" component={PaymentHistory} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;
