const router = require("express").Router();
const {
  createPost,
  deletePost,
  updatePost,
  getSinglePost,
  getFeaturedPost,
  getPosts,
  searchPost,
  getRelatedPosts,
  uploadImage,
} = require("../controller/post.controller");
const upload = require("../middleware/multer");
const { postValidator, validate } = require("../middleware/post.validator");
const { parseData } = require("../middleware");

router.post(
  "/create",
  upload.single("thumbnail"),
  parseData,
  postValidator,
  validate,
  createPost
);

router.put(
  "/:postId",
  upload.single("thumbnail"),
  parseData,
  postValidator,
  validate,
  updatePost
);

router.delete("/:postId", deletePost);
router.get("/details/:slug", getSinglePost);
router.get("/featured-posts", getFeaturedPost);
router.get("/posts", getPosts);
router.get("/related-posts/:postId", getRelatedPosts);
router.get("/search", searchPost);

router.post("/upload-image", upload.single("image"), uploadImage);

module.exports = router;
