// src/components/ClassList.js
import React, { useState, useEffect } from 'react';
import api from '../api';

const ClassList = () => {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const response = await api.get('/classes');
      setClasses(response.data);
    };

    fetchClasses();
  }, []);

  return (
    <div>
      
      <h1>Approved Classes</h1>
      <ul>
        {classes.map((cls) => (
          <li key={cls._id}>
            <h2>{cls.name}</h2>
            <p>{cls.description}</p>
            <a href={`/class/${cls._id}`}>View Details</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassList;

