const Post = require("../models/post.model");
const FeaturedPost = require("../models/featuredPost.model");
const cloudinary = require("../cloud");
const { isValidObjectId } = require("mongoose");
const { post } = require("../routers/post.route");

const FEATURED_POST_COUNT = 4;

// create featured post
const addToFeaturedPost = async (postId) => {
  const ifAlreadyExitSlog = await FeaturedPost.findOne({ post: postId });

  if (ifAlreadyExitSlog) return;
  const featuredPost = new FeaturedPost({ post: postId });
  await featuredPost.save();

  const featuredPosts = await FeaturedPost.find({}).sort({ createdAt: -1 });

  if (featuredPosts) {
    featuredPosts.forEach(async (post, index) => {
      if (index >= FEATURED_POST_COUNT)
        await FeaturedPost.findByIdAndDelete(post._id);
    });
  }
};

const removeFromFeaturedPost = async (postId) => {
  await FeaturedPost.findOneAndDelete({ post: postId });
};

const isFeaturedPost = async (postId) => {
  const post = await FeaturedPost.findOne({ post: postId });
  return post ? true : false;
};

// create post
exports.createPost = async (req, res) => {
  const { title, meta, content, slug, author, tags, featured } = req.body;
  const { file } = req;
  const ifAlreadyExitSlog = await Post.findOne({ slug });

  if (ifAlreadyExitSlog) {
    return res.status(401).json({ error: "This slug already exist!" });
  }

  const newPost = new Post({ title, meta, content, slug, author, tags });

  if (file) {
    try {
      const { secure_url: url, public_id } = await cloudinary.uploader.upload(
        file.path
      );
      newPost.thumbnail = { url, public_id };
    } catch (err) {
      console.log("Image Upload Error: ", err);
    }
  }

  if (featured) await addToFeaturedPost(newPost._id);

  await newPost.save();

  // arraged post
  const sendingPost = {
    title,
    meta,
    content,
    slug,
    author,
    tags,
    thumbnail: newPost.thumbnail?.url,
    date: newPost.createdAt,
    featured,
  };
  res.status(200).json({ sendingPost });
};

// update post
exports.updatePost = async (req, res) => {
  const { title, meta, content, slug, author, tags, featured } = req.body;
  const { file } = req;
  const { postId } = req.params;

  if (!isValidObjectId(postId)) {
    return res.status(401).json({ error: "Invaid request!" });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  // remove image
  const public_id = post.thumbnail?.public_id;

  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok")
      return res.status(404).json({ error: "Thumbnai could not remove." });
  }

  if (file) {
    try {
      const { secure_url: url, public_id } = await cloudinary.uploader.upload(
        file.path
      );
      post.thumbnail = { url, public_id };
    } catch (err) {
      console.log("Image Upload Error: ", err);
    }
  }

  post.title = title;
  post.meta = meta;
  post.content = content;
  post.slug = slug;
  post.author = author;
  post.tags = tags;

  if (featured) await addToFeaturedPost(post._id);
  else await removeFromFeaturedPost(post._id);

  // arraged post
  const sendingPost = {
    title,
    meta,
    content,
    slug,
    author,
    tags,
    thumbnail: post.thumbnail?.url,
    featured,
  };

  await post.save();
  res.status(200).json({ sendingPost });
};

// delete post
exports.deletePost = async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    return res.status(401).json({ error: "Invaid request!" });
  }
  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  let message = "";

  // remove contents
  try {
    const res = await Post.findByIdAndDelete(postId);
    if (res) {
      message += "Post remove successfully!";
    }
  } catch (err) {
    return res.status(500).json({ error: "Could not remove post!" + err });
  }

  // remove image
  const public_id = post.thumbnail?.public_id;

  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") message += " - But, thumbnail could not remove!";
  }

  // remove unnecessaty posts from feature posts
  await removeFromFeaturedPost(postId);

  res.status(200).json({ message });
};

// get single post
exports.getSinglePost = async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.status(401).json({ error: "Invaid request!" });
  }

  const post = await Post.findOne({ slug });
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  const featured = await isFeaturedPost(post._id);

  const { title, meta, content, author, tags, thumbnail, createdAt } = post;

  // arraged post
  const sendingPost = {
    title,
    meta,
    content,
    slug,
    author,
    tags,
    thumbnail: post.thumbnail?.url,
    featured,
    createdAt,
  };

  res.status(200).json(sendingPost);
};

// get featured post
exports.getFeaturedPost = async (req, res) => {
  const featuredPosts = await FeaturedPost.find({})
    .sort({ createdAt: -1 })
    .limit(4)
    .populate("post");

  res.status(200).json({
    posts: featuredPosts.map(({ post }) => ({
      id: post._id,
      title: post.title,
      thumbnail: post.thumbnail?.url,
      slug: post.slug,
      author: post.author,
      date: post.createdAt,
    })),
  });
};

// pagination posts
exports.getPosts = async (req, res) => {
  const { pageNo = 0, limit = 10 } = req.query;
  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  res.status(200).json({
    posts: posts.map((post) => ({
      id: post._id,
      title: post.title,
      thumbnail: post.thumbnail?.url,
      slug: post.slug,
      author: post.author,
      date: post.createdAt,
    })),
  });
};

// search posts
exports.searchPost = async (req, res) => {
  const { title } = req.query;
  if (!title.trim())
    return res.status(401).json({ error: "Search query can't be empty!" });

  const posts = await Post.find({ title: { $regex: title, $options: "i" } });
  res.status(200).json({
    posts: posts.map((post) => ({
      id: post._id,
      title: post.title,
      thumbnail: post.thumbnail?.url,
      slug: post.slug,
      author: post.author,
      date: post.createdAt,
    })),
  });
};

// realated posts
exports.getRelatedPosts = async (req, res) => {
  const { postId } = req.params;

  if (!isValidObjectId(postId)) {
    return res.status(401).json({ error: "Invaid request!" });
  }

  const post = await Post.findById(postId);

  if (!post) {
    return res.status(401).json({ error: "Post not found!" });
  }

  const reapatedPosts = await Post.find({
    tags: { $in: [...post.tags] },
    _id: { $ne: post._id },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    posts: reapatedPosts.map((post) => ({
      id: post._id,
      title: post.title,
      thumbnail: post.thumbnail?.url,
      slug: post.slug,
      author: post.author,
      date: post.createdAt,
    })),
  });
};

// upload single image
exports.uploadImage = async (req, res) => {
  const { file } = req;
  if (!file) {
    return res.status(401).json({ error: "No file found!" });
  }

  const { secure_url: url } = await cloudinary.uploader.upload(file.path);

  res.status(201).json({ image: url });
};
