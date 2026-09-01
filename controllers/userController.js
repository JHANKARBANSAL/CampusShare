const User = require("../models/User");
const uploadBuffer = require("../utils/uploadBuffer");
const Transaction = require("../models/Transaction");
const NeedPost = require("../models/NeedPost");
const Dispute = require("../models/Dispute");


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




// ========================================
// GET MY STATS + TRUST SCORE
// Kuch bhi User me save nahi karte, har baar gin lete hain.
// ========================================

// Ye teen status matlab "abhi chal raha hai"
const ACTIVE = ["accepted", "borrowed", "return_pending"];


const getMyStats = async (req, res) => {

  try {

    const me = req.user.id;


    // ---- 4 cards ----

    const peopleHelped = await Transaction.countDocuments({
      lender: me,
      status: "completed"
    });

    const askedForHelp = await NeedPost.countDocuments({
      requestedBy: me
    });

    const activeHelps = await Transaction.countDocuments({
      lender: me,
      status: { $in: ACTIVE }
    });

    const activeBorrows = await Transaction.countDocuments({
      borrower: me,
      status: { $in: ACTIVE }
    });


    // ---- Trust score (borrower wala record) ----

    // total = jitni cheezein mere haath me aayi
    const total = await Transaction.countDocuments({
      borrower: me,
      status: { $in: ["borrowed", "return_pending", "completed"] }
    });

    const successful = await Transaction.countDocuments({
      borrower: me,
      status: "completed"
    });

    const onTime = await Transaction.countDocuments({
      borrower: me,
      status: "completed",
      returnedOnTime: true
    });

    const late = await Transaction.countDocuments({
      borrower: me,
      status: "completed",
      returnedOnTime: false
    });

    // Pehle ye Transaction se ginte the ({ borrower: me, hasIssue: true }),
    // matlab penalty hamesha borrower pe lagti thi - chahe shikayat usne
    // khud ki ho. Ab Dispute se ginte hain, taaki penalty us bande pe lage
    // JISKI GALTI HAI (reportedAgainst), chahe wo lender ho ya borrower.
    const issues = await Dispute.countDocuments({
      reportedAgainst: me
    });


    // Formula easy hai:
    // time par wapas kiya = 70 marks, wapas to kiya = 30 marks,
    // har issue pe -5. Aakhir me 0 se 100 ke beech rakh dete hain.

    let score = 0;

    if (total > 0) {

      score =
        (onTime / total) * 70 +
        (successful / total) * 30 -
        (issues * 5);

      score = Math.round(score);

      if (score < 0) {
        score = 0;
      }

      if (score > 100) {
        score = 100;
      }
    }


    return res.status(200).json({

      stats: {
        peopleHelped: peopleHelped,
        askedForHelp: askedForHelp,
        activeHelps: activeHelps,
        activeBorrows: activeBorrows
      },

      trust: {
        score: score,
        total: total,
        successful: successful,
        onTime: onTime,
        late: late,
        issues: issues
      }

    });

  }

  catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Unable to load stats"
    });

  }

};



module.exports = {
  getMyProfile,
  uploadProfilePhoto,
  getMyStats
};
