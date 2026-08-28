// db.js sirf MongoDB connection handle kare:

const mongose=require("mongoose");
const connectDB= async ()=>
{
    try{
        await mongose.connect(process.env.MONGO_URI);
        console.log("databse connectcd");
    }
    catch(err)
    {
        console.log("MongoDb connection failed",error);
        process.exit(1);
    }
    };
module.exports=connectDB;