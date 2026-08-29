const mongoose=require("mongoose");

const needPostSchema = new mongoose.Schema({

    //kis student ne request ki hia 
    requestedBy:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true

    },

    itemName:
    {
        type:String,
        required:true,
        trim:true
    },

    description:
    {
        type:String,
         required:true,
         trim:true
    },

    neededBy:
    {
        type:Date,
        required:true
    },

    durationValue:
    {
        type:Number,
        required: true
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

const NeedPost = mongoose.model("NeedPost", needPostSchema);
module.exports = NeedPost;