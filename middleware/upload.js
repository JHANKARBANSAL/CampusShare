const multer = require("multer");
const path = require("path");

// Batao file kaha save karni hai aur kis naam se
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "public/images");
    },

    filename: function (req, file, cb) {
        // Naam unique rakhne ke liye current time + original extension (.jpg, .png, etc.)
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }

});

const upload = multer({ storage: storage });

module.exports = upload;
