
const dotenv = require("dotenv");

// .env sabse pehle load karo.
// Warna config/cloudinary.js import hote hi process.env padh leta hai
// aur us waqt tak keys aayi hi nahi hoti ("Must supply api_key").
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const initChatSocket = require("./sockets/chatSocket");

const PORT = process.env.PORT || 7000;


// Raw HTTP server create karo taaki Socket.IO attach ho sake
const server = http.createServer(app);

// Socket.IO isi HTTP server se attach hoga
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Ab app.listen() nahi, server.listen() use karo


// Chat socket events setup
initChatSocket(io);

const startServer = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

startServer();