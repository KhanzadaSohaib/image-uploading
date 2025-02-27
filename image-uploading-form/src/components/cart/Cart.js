import React from "react";
import { useCart } from "../CartContext";
import { useNavigate } from "react-router-dom";
import "./Cart.css"; // Updated CSS

const Cart = () => {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } =
    useCart();
  const navigate = useNavigate();

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-container">
      <h2>🛒 Your Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img
                src={item.image}
                alt={item.title}
                className="cart-item-image"
              />
              <div className="cart-item-details">
                <h4>{item.title}</h4>
                <p>${item.price.toFixed(2)}</p>

                <div className="cart-actions">
                  <button
                    className="quantity-btn"
                    onClick={() => decreaseQuantity(item.id)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => increaseQuantity(item.id)}
                  >
                    +
                  </button>
                </div>

                <p>Total: ${(item.price * item.quantity).toFixed(2)}</p>

                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Subtotal Section */}
      {cart.length > 0 && (
        <div className="cart-footer">
          <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
          <button
            className="checkout-btn"
            onClick={() => navigate("/checkout")}
          >
            💳 Proceed to Checkout
          </button>
        </div>
      )}

      {/* ✅ Back to Home Button */}
      <button className="back-to-home-btn" onClick={() => navigate("/home")}>
        🔙 Back to Home
      </button>
    </div>
  );
};

export default Cart;
