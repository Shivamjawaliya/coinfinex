import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Auth
export const getMe = () => api.get("/auth/me");
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });
export const signup = (name: string, email: string, password: string, confirmPassword: string) =>
  api.post("/auth/signup", { name, email, password, confirmPassword });
export const logout = () => api.get("/auth/logout");

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
export const sellStock = (stockname: string, stockquantity: number) =>
  api.post("/trading/sell", { stockname, stockquantity });
export const resetPortfolio = () => api.post("/trading/reset");

// News
export const getNews = (page = 1) => api.get(`/news?page=${page}`);

// Categories
export const getCategories = () => api.get("/categories");

export default api;
