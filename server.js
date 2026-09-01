const dotenv=require("dotenv");

// .env sabse pehle load karo.
// Warna config/cloudinary.js import hote hi process.env padh leta hai
// aur us waqt tak keys aayi hi nahi hoti ("Must supply api_key").
dotenv.config();

const app=require("./app");
const connectDB=require("./config/db")

const PORT= process.env.port ||4000;

const startServer= async()=>
{
    await connectDB();
    app.listen(PORT, ()=>
{
    console.log(`server i sruunig on ${PORT}`);
});
};

startServer();