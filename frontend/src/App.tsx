import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import StockInfo from "./pages/StockInfo";
import VirtualTrading from "./pages/VirtualTrading";
import Portfolio from "./pages/Portfolio";
import News from "./pages/News";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Intraday from "./pages/Intraday";
import Wishlist from "./pages/Wishlist";
import Transactions from "./pages/Transactions";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/explore" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/dashboard" element={<Navigate to="/explore" replace />} />
      <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path="/stock/:symbol" element={<PrivateRoute><StockInfo /></PrivateRoute>} />
      <Route path="/virtual-trading" element={<PrivateRoute><VirtualTrading /></PrivateRoute>} />
      <Route path="/portfolio" element={<PrivateRoute><Portfolio /></PrivateRoute>} />
      <Route path="/news" element={<PrivateRoute><News /></PrivateRoute>} />
      <Route path="/intraday"      element={<PrivateRoute><Intraday /></PrivateRoute>} />
      <Route path="/wishlist"      element={<PrivateRoute><Wishlist /></PrivateRoute>} />
      <Route path="/transactions"  element={<PrivateRoute><Transactions /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
