const User = require("../models/User");
const uploadBuffer = require("../utils/uploadBuffer");


// ========================================
// GET MY PROFILE
// ========================================

const getMyProfile = async (req, res) => {

  try {

    const user = await User
      .findById(req.user.id)
      .select("-password");

    if (!user) {

      return res.status(404).json({
        message: "User not found"
      });

    }

    return res.status(200).json({
      user: user
    });

  }

  catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Unable to load profile"
    });

  }

};



// ========================================
// UPLOAD PROFILE PHOTO
// ========================================

const uploadProfilePhoto = async (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({
        message: "Please select an image"
      });

    }


    // Upload image to Cloudinary

    const result = await uploadBuffer(
      req.file.buffer,
      "campusshare/profile-images"
    );


    // Save Cloudinary URL in MongoDB

    const user = await User.findByIdAndUpdate(

      req.user.id,

      {
        profileImage: result.secure_url
      },

      {
        new: true
      }

    ).select("-password");


    return res.status(200).json({

      message: "Profile photo updated",

      profileImage: user.profileImage

    });

  }

  catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Unable to upload profile photo"
    });

  }

};



module.exports = {
  getMyProfile,
  uploadProfilePhoto
};
