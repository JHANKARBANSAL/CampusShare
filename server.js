const dotenv=require("dotenv");
const app=require("./app");
const connectDB=require("./config/db")

dotenv.config();

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