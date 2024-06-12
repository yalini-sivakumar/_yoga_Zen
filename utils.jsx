// src/utils.js
export const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  };
  
  export const getAuthToken = () => {
    return localStorage.getItem('token');
  };
  