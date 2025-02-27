import { Routes, Route } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/home/Home";
import Register from "./components/register/Register";
import Cart from "./components/cart/Cart";
import Header from "./components/header/Header";
import Checkout from "./components/Checkout";
import Success from "./components/pages/Success"; // ✅ Success Page
import Cancel from "./components/pages/Cancel"; // ✅ Cancel Page

function App() {
  return (
    <>
      <Header /> {/* Header will be visible on all pages */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />

        {/* ✅ Added Checkout Route */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />

        {/* ✅ Protected Dashboard Route */}
        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route path="" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
