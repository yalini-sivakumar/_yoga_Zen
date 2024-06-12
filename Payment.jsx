// src/components/Payment.js
import React, { useState } from 'react';
import api from './api';

const Payment = () => {
  const [price, setPrice] = useState(0);

  const handlePayment = async () => {
    const response = await api.post('/create-payment-intent', { price });
    const { clientSecret } = response.data;
    // Use clientSecret with Stripe.js or a Stripe component
  };

  return (
    <div>
      <h1>Payment</h1>
      <input 
        type="number" 
        value={price} 
        onChange={(e) => setPrice(e.target.value)} 
        placeholder="Enter amount" 
      />
      <button onClick={handlePayment}>Pay</button>
    </div>
  );
};

export default Payment;
