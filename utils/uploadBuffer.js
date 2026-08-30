const cloudinary = require("../config/cloudinary");

const uploadBuffer = (buffer, folder) => {

    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: "image"
            },

            (error, result) => {

                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        stream.end(buffer);
    });
};

module.exports = uploadBuffer;