import React, { useState } from "react";
import { useCart } from "./CartContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ""
);

const CheckoutForm = () => {
  const { cart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ✅ Calculate total amount in cents (Stripe expects cents, not dollars)
  const totalAmount = Math.round(
    cart.reduce((total, item) => total + item.price * item.quantity, 0) * 100
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Payment method not available.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Step 1: Create Payment Method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log("🚀 Sending Payment:", {
        amount: totalAmount,
        paymentMethodId: paymentMethod.id,
      });

      // ✅ Step 2: Send Payment Intent Request to Backend
      const response = await fetch("http://localhost:8005/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount, // ✅ Send amount in cents
          paymentMethodId: paymentMethod.id, // ✅ Correct field name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      console.log("✅ Payment Successful:", data);
      setSuccess(true);
      setTimeout(() => navigate("/success"), 2000);
    } catch (err) {
      console.error("❌ Payment Error:", err.message);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="checkout-container">
      <form onSubmit={handleSubmit} className="checkout-form">
        <h2>💳 Secure Payment</h2>
        <p className="amount">
          Total: <strong>${(totalAmount / 100).toFixed(2)}</strong>
        </p>
        <CardElement className="card-element" />
        {error && <p className="error-message">❌ {error}</p>}
        {success && <p className="success-message">✅ Payment Successful!</p>}
        <button
          type="submit"
          className="checkout-btn"
          disabled={!stripe || loading}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
};

const Checkout = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout;
