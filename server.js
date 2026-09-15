const dotenv=require("dotenv");

// .env sabse pehle load karo.
// Warna config/cloudinary.js import hote hi process.env padh leta hai
// aur us waqt tak keys aayi hi nahi hoti ("Must supply api_key").
dotenv.config();

const app=require("./app");
const connectDB=require("./config/db")

const PORT = process.env.PORT || process.env.port || 3000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

startServer();