export interface User {
  name: string;
  username: string;
  role: string;
  initials: string;
}

export interface StockQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestDay: string;
  prevClose: number;
  change: number;
  changePct: string;
}

export interface StockOverview {
  name: string;
  description: string;
  exchange: string;
  currency: string;
  country: string;
  sector: string;
  industry: string;
  marketCap: number | string;
  pe: number | string;
  eps: number | string;
  beta: number | string;
  week52High: number | string;
  week52Low: number | string;
  divYield: number | string;
  profitMargin: number | string;
  revenuePerShare: number | string;
  analystTarget: number | string;
  sharesOutstanding: number | string;
}

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  published: string;
  thumbnail: string;
  summary: string;
  sentiment: string;
}

export interface PortfolioItem {
  stockname: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  profit: number;
  profitPercent: string;
}

export interface AssetDistribution {
  name: string;
  value: number;
  percent?: string;
}

export interface PortfolioData {
  portfolio: PortfolioItem[];
  totalPortfolioValue: number;
  totalProfit: number;
  totalProfitPercent: string;
  assetDistribution: AssetDistribution[];
  recentActivities: object[];
}

export interface CategoryStock {
  sym: string;
  name: string;
  emoji: string;
  desc: string;
  exchange: string;
  cap: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  stocks: CategoryStock[];
}
