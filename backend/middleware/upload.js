const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "mern_blog_platform",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // Automatically optimize images on upload
    transformation: [{ width: 1200, height: 630, crop: "limit" }],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
