const multer = require("multer");

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.includes("image")) {
    return cb("Invalid image format!", false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });
module.exports = upload;
