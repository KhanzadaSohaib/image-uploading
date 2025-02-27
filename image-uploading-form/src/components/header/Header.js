import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../CartContext"; // Import Cart Context
import "./Header.css"; // Import CSS for styling

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart(); // Get cart data

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <header className="header">
      <div className="nav-links">
        <button
          className={location.pathname === "/home" ? "active" : ""}
          onClick={() => handleNavigation("/home")}
        >
          Home
        </button>
        <button
          className={location.pathname === "/register" ? "active" : ""}
          onClick={() => handleNavigation("/register")}
        >
          Register
        </button>
        <button
          className={location.pathname === "/dashboard" ? "active" : ""}
          onClick={() => handleNavigation("/dashboard")}
        >
          Dashboard
        </button>
      </div>

      {/* 🛒 Cart Button with Count */}
      <button className="cart-button" onClick={() => handleNavigation("/cart")}>
        🛒 Cart ({cart.length}) {/* Show cart count */}
      </button>

      {/* 🔴 Logout Button */}
      <button className="logout-button" onClick={() => handleNavigation("/")}>
        Logout
      </button>
    </header>
  );
};

export default Header;
