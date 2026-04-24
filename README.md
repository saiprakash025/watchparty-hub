# watchparty-hub

A real-time watch party application that lets users create and join watch sessions together. Built with a React frontend and a Node.js/Express backend, communicating over WebSockets via Socket.IO.

## 🌐 Live Demo

| | Link |
|---|---|
| **Frontend** | [watchparty-hub.vercel.app](https://watchparty-hub.vercel.app/login) |
| **Backend** | [watchparty-hub.onrender.com](https://watchparty-hub.onrender.com) |

---

## 🚀 Tech Stack

### Frontend
- **React 19** with React Router DOM v7
- **Vite** – fast development build tool
- **Socket.IO Client** – real-time communication
- **Axios** – HTTP requests

### Backend
- **Node.js** with **Express 5**
- **Socket.IO** – WebSocket server
- **MongoDB** via **Mongoose**
- **JWT** – authentication
- **bcryptjs** – password hashing
- **express-rate-limit** – rate limiting
- **dotenv** – environment variable management

---

## 📁 Project Structure

```
watchparty-hub/
├── backend/
│   ├── server.js         # Express + Socket.IO server entry point
│   ├── src/              # Routes, controllers, models, middleware
│   └── package.json
└── frontend/
    └── watchparty-frontend/
        ├── src/          # React components, pages, hooks
        ├── public/
        ├── index.html
        └── package.json
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)

---

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

### Frontend Setup

```bash
cd frontend/watchparty-frontend
npm install
```

Create a `.env` file in the `frontend/watchparty-frontend/` directory (refer to `.env.example`):

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend dev server:

```bash
npm run dev
```

---

## 🛠️ Available Scripts

### Backend
| Script | Description |
|--------|-------------|
| `npm start` | Start server with Node |
| `npm run dev` | Start server with Nodemon (auto-reload) |

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🔐 Authentication

Authentication is handled using **JWT tokens** with **bcryptjs** for password hashing. Tokens are stored in cookies via `cookie-parser`.

---

## 🌐 Deployment

- **Frontend** is deployed on **Vercel**: [watchparty-hub.vercel.app](https://watchparty-hub.vercel.app/login)
- **Backend** is deployed on **Render**: [watchparty-hub.onrender.com](https://watchparty-hub.onrender.com)

---

## 📄 License

ISC
