const mongoose=require("mongoose");

const NeedPost=new mongoose.Schema({

    //kis student ne request ki hia 
    requestedBy:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:True

    },

    itemName:
    {
        type:String,
        required:True,
        trim:true
    },

    itemDescription:
    {
        type:String,
         required:True,
         trim:true
    },

    whenNeeded:
    {
        type:Date,
        required:True
    },

    Duration:
    {
        type:Number,
        required: True
    },

     durationUnit: {
            type: String,
            enum: ["hours", "days", "weeks"],
            required: true
        },

        // Current request state
        status: {
            type: String,
            enum: ["open", "matched", "closed"],
            default: "open"
        }
    },

    {
        timestamps:true
    }
);

const needpost= mongoose.model(NeedPost,"needpostschema");
module.exports=NeedPost;