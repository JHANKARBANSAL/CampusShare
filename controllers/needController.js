const NeedPost = require("../models/NeedPost");

const createNeed = async (req, res) => {
    try {
        const {
            itemName,
            description,
            neededBy,
            durationValue,
            durationUnit
        } = req.body;

        const need = await NeedPost.create({
            requestedBy: req.user.id,
            itemName,
            description,
            neededBy,
            durationValue,
            durationUnit
        });

        return res.status(201).json({
            message: "Need posted successfully",
            need
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const getAllNeeds = async (req, res) => {
    try {
        const needs = await NeedPost.find()
            .populate("requestedBy", "name branch batch")
            .sort({ createdAt: -1 });

        return res.status(200).json({ needs });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    createNeed, getAllNeeds
};