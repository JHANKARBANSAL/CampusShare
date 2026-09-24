const NeedPost = require("../models/NeedPost");
const Transaction = require("../models/Transaction");

const createNeed = async (req, res) => {
    try {
        const {
            itemName,
            description,
            neededBy,
            durationValue,
            durationUnit
        } = req.body;

        // Check if user has helped anyone before -> gets Priority Bump!
        const helpCount = await Transaction.countDocuments({
            lender: req.user.id,
            status: "completed"
        });

        const need = await NeedPost.create({
            requestedBy: req.user.id,
            itemName,
            description,
            neededBy,
            durationValue,
            durationUnit,
            isPriority: helpCount > 0
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
        // Priority requests first, then newest
        const needs = await NeedPost.find({ status: "open" })
            .populate("requestedBy", "name branch batch profileImage")
            .sort({ isPriority: -1, createdAt: -1 });

        return res.status(200).json({ needs });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

// Sirf logged-in user ke apne posted needs dena (Profile page ke liye)
const getMyNeeds = async (req, res) => {
    try {
        const needs = await NeedPost.find({ requestedBy: req.user.id })
            .sort({ createdAt: -1 });

        return res.status(200).json({ needs });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


const deleteNeed = async (req, res) => {
    try {
        const need = await NeedPost.findById(req.params.id);

        if (!need) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (need.requestedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own requests" });
        }

        if (need.status !== "open") {
            return res.status(400).json({ message: "Cannot delete a matched request" });
        }

        await NeedPost.findByIdAndDelete(req.params.id);

        return res.status(200).json({ message: "Request deleted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    createNeed, getAllNeeds, getMyNeeds, deleteNeed
};