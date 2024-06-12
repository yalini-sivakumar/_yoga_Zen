// src/components/PaymentHistory.js
import React, { useState, useEffect } from 'react';
import api from '../api';

const PaymentHistory = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const userMail = "user@example.com"; // Replace with actual user email

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      const response = await api.get(`/payment-history/${userMail}`);
      setPaymentHistory(response.data);
    };

    fetchPaymentHistory();
  }, [userMail]);

  return (
    <div>
      <h1>Payment History</h1>
      <ul>
        {paymentHistory.map(payment => (
          <li key={payment._id}>
            <p>Amount: ${payment.amount}</p>
            <p>Date: {new Date(payment.date).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentHistory;
