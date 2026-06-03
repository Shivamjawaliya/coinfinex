# 🚀 CoinFinex

A full-stack cryptocurrency platform built with the MERN stack that allows users to track market data, manage portfolios, and stay updated with real-time crypto information.

## 📌 Features

- User Authentication & Authorization
- Real-Time Cryptocurrency Data
- Portfolio Management
- Responsive UI
- Secure API Integration
- Search & Filter Cryptocurrencies
- Watchlist Functionality
- Dashboard Analytics

## 🛠️ Tech Stack

### Frontend
- React.js
- Redux / Context API
- Tailwind CSS / CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Mongoose

## 📂 Project Structure

```
coinfinex/
├── client/
│   ├── src/
│   └── public/
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   └── middleware/
├── package.json
└── README.md
```

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Shivamjawaliya/coinfinex.git
cd coinfinex
```

### Install Dependencies

```bash
npm install
```

For frontend:

```bash
cd client
npm install
```

For backend:

```bash
cd server
npm install
```

### Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Run Application

Backend:

```bash
npm run server
```

Frontend:

```bash
npm start
```

Or:

```bash
npm run dev
```

## 📸 Screenshots

Add your application screenshots here.

## API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Users

```http
GET /api/users/profile
```

### Crypto

```http
GET /api/coins
GET /api/coins/:id
```

## Future Improvements

- Crypto Trading Integration
- Price Alerts
- AI-Based Market Analysis
- Multi-Currency Support
- Advanced Portfolio Insights

## 👨‍💻 Author

**Shivam Jawaliya**

- GitHub: https://github.com/Shivamjawaliya
- LinkedIn: Add your LinkedIn profile

## 📄 License

This project is licensed under the MIT License.
