import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./components/CartContext"; // Import CartProvider
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <CartProvider>
    {" "}
    {/* Wrap with CartProvider for global state */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </CartProvider>
);
