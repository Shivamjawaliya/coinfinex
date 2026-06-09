import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE = VITE_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

// Auth
export const getMe = () => api.get("/auth/me");
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });
export const signup = (name: string, email: string, password: string, confirmPassword: string) =>
  api.post("/auth/signup", { name, email, password, confirmPassword });
export const logout = () => api.get("/auth/logout");
export const sendOtp = (email: string) => api.post("/auth/send-otp", { email });
export const verifyOtp = (email: string, otp: string) => api.post("/auth/verify-otp", { email, otp });
export const forgotPassword = (email: string) => api.post("/auth/forgot-password", { email });
export const resetPassword = (token: string, email: string, password: string, confirmPassword: string) =>
  api.post("/auth/reset-password", { token, email, password, confirmPassword });

// Dashboard
export const getDashboard = () => api.get("/dashboard");

// Stocks
export const getStock = (symbol: string) => api.get(`/stocks/${symbol}`);
export const getStockPrice = (symbol: string) => api.get(`/stocks/${symbol}/price`);

// Portfolio
export const getPortfolio = () => api.get("/portfolio");

// Virtual Trading
export const getTrading = () => api.get("/trading");
export const buyStock = (stockname: string, stockquantity: number, stockbuyprice: number) =>
  api.post("/trading/buy", { stockname, stockquantity, stockbuyprice });
export const sellStock = (stockname: string, stockquantity: number, stocksellprice?: number) =>
  api.post("/trading/sell", { stockname, stockquantity, stocksellprice });
export const resetPortfolio = () => api.post("/trading/reset");

// News
export const getNews = (page = 1) => api.get(`/news?page=${page}`);

// Categories
export const getCategories = () => api.get("/categories");

// Wishlist
export const getWishlist    = ()             => api.get("/wishlist/my");
export const addWishlist    = (stockname: string) => api.post("/wishlist/add", { stockname });
export const removeWishlist = (symbol: string)    => api.delete(`/wishlist/remove/${symbol}`);

// Transactions
export const getTransactions = () => api.get("/transactions");

export default api;
