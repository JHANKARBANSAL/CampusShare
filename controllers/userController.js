const User = require("../models/User");
const NeedPost = require("../models/NeedPost");
const Offer = require("../models/Offer");

// Logged-in user ki profile + stats bhejo
const getMyProfile = async (req, res) => {
    try {
        // Password chhod ke baaki saari details
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Stats - sab database se count karke nikale hain, koi fake number nahi
        const myRequestsCount = await NeedPost.countDocuments({
            requestedBy: user._id
        });

        const completedCount = await NeedPost.countDocuments({
            requestedBy: user._id,
            status: "closed"
        });

        const ongoingCount = await NeedPost.countDocuments({
            requestedBy: user._id,
            status: "matched"
        });

        const peopleHelpedCount = await Offer.countDocuments({
            offeredBy: user._id,
            status: "accepted"
        });

        return res.status(200).json({
            user,
            stats: {
                myRequestsCount,
                completedCount,
                ongoingCount,
                peopleHelpedCount
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


// Profile photo change karo
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Browser mein image dikhane ke liye path (public folder already serve ho raha hai)
        const imagePath = "/images/" + req.file.filename;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImage: imagePath },
            { new: true }
        );

        return res.status(200).json({
            message: "Profile photo updated",
            profileImage: user.profileImage
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


// ID card upload hote hi seedha verified kar do (koi admin review nahi rakha, simple rakha hai)
const uploadIdCard = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const imagePath = "/images/" + req.file.filename;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                idCardImage: imagePath,
                verificationStatus: "verified"
            },
            { new: true }
        );

        return res.status(200).json({
            message: "You are now verified!",
            verificationStatus: user.verificationStatus
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


module.exports = {
    getMyProfile,
    uploadProfilePhoto,
    uploadIdCard
};
