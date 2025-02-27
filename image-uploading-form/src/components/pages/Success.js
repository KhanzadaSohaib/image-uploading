import React from "react";
import { useNavigate } from "react-router-dom";

const Success = () => {
  const navigate = useNavigate(); // Initialize navigation

  return (
    <div className="success-container">
      <h1>🎉 Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
      <button onClick={() => navigate("/home")}>Back To Home</button>
    </div>
  );
};

export default Success;
