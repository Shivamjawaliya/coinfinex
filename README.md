# Coinfinex — Virtual Stock Trading Platform

A full-stack virtual trading platform with real-time market data, portfolio analytics, AI-powered news sentiment, and deep stock research. Built with a React frontend and Express REST API backend.

---

## Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- React Router v6
- Chart.js + react-chartjs-2 (Doughnut, Line charts)
- Axios (proxied through Vite to backend)
- Glassmorphism dark UI with CSS animations

**Backend**
- Node.js + Express 5 + TypeScript
- MongoDB + Mongoose
- JWT authentication (httpOnly cookies)
- Yahoo Finance 2 (live stock/crypto prices)
- bcryptjs, cookie-parser, cors

---

## Project Structure

```
coinfinex/
├── backend/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── db.ts
│   │   └── keys.ts
│   ├── controllers/
│   ├── middleware/
│   │   └── auth.ts
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── components/
        │   └── Sidebar.tsx
        ├── context/
        │   └── AuthContext.tsx
        ├── pages/
        │   ├── Home.tsx
        │   ├── Login.tsx
        │   ├── Signup.tsx
        │   ├── Dashboard.tsx      ← /explore
        │   ├── StockInfo.tsx
        │   ├── VirtualTrading.tsx
        │   ├── Portfolio.tsx
        │   ├── News.tsx
        │   └── Categories.tsx
        ├── services/
        │   └── api.ts
        └── types/
            └── index.ts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`)

---

### 1. Clone the repository

```bash
git clone https://github.com/Shivamjawaliya/coinfinex.git
cd coinfinex
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/coinfinex
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5001`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` (or next available port).

All `/api/*` requests are proxied to `http://localhost:5001`.

---

## Features

| Feature | Description |
|---|---|
| Authentication | JWT auth with httpOnly cookies — signup, login, logout |
| Stock Explorer | Browse 50+ stocks & 8 crypto across Technology, Finance, Healthcare, Energy, Consumer, and more |
| Virtual Trading | Buy/sell stocks with a simulated ₹1,00,000 balance using live Yahoo Finance prices |
| Portfolio | P&L tracking, asset allocation doughnut chart, breakdown bars, holdings table |
| Stock Info | Price history charts (1D–1Y), 52-week range, key metrics, company info, news with sentiment |
| Market News | Curated financial news with AI sentiment tags (Positive / Neutral / Negative) |
| Categories | Browse stocks by sector |

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT cookie |
| POST | `/api/auth/logout` | Clear JWT cookie |
| GET | `/api/auth/me` | Get current authenticated user |

### Stocks & Trading

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Stock universe with live prices |
| GET | `/api/stocks/:symbol` | Single stock detail + history |
| GET | `/api/stocks/:symbol/price` | Live price for a symbol |
| GET | `/api/portfolio` | User's portfolio |
| GET | `/api/trading` | Virtual trading data + holdings |
| POST | `/api/trading/buy` | Buy shares |
| POST | `/api/trading/sell` | Sell shares |
| POST | `/api/trading/reset` | Reset portfolio to default balance |
| GET | `/api/news` | Market news |
| GET | `/api/categories` | Sector categories |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5001) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `NODE_ENV` | `development` or `production` |

---

## Scripts

### Backend

```bash
npm run dev      # Start with ts-node-dev (hot reload)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled dist/server.js
```

### Frontend

```bash
npm run dev      # Vite dev server with HMR
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## Notes

- **macOS port 5000 conflict:** AirPlay Receiver uses port 5000. The backend runs on port 5001 to avoid this.
- **No real money:** All trading is simulated. No financial transactions occur.
- **Live prices:** Powered by Yahoo Finance — requires internet connection for real-time data.

---

## License

MIT
