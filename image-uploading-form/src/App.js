import { Routes, Route, useLocation } from "react-router-dom";
import Signup from "./components/signup/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/home/Home";
import Register from "./components/register/Register";
import Cart from "./components/cart/Cart";
import Header from "./components/header/Header";
import Checkout from "./components/Checkout";
import Success from "./components/pages/Success";
import Cancel from "./components/pages/Cancel";
import Chat from "./components/chat/Chat"; // ✅ Chat Component

function App() {
  const location = useLocation();

  // Define pages where the header should be hidden
  const hideHeaderRoutes = ["/", "/signup"];

  return (
    <>
      {/* Show Header only if current path is not in hideHeaderRoutes */}
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />

        {/* ✅ Checkout Routes */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />

        {/* ✅ Real-time Chat Route */}
        <Route path="/chat" element={<Chat />} />

        {/* ✅ Protected Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
