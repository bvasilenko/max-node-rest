const fs = require('fs'),
  path = require('path');

const { validationResult } = require('express-validator/check');

const io = require('../socket');
const Post = require('../models/post'),
  User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  try {
    const page = req.query.page || 1,
      perPage = 2,
      totalItems = await Post.find().countDocuments(),
      posts = await Post.find().populate('creator').sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage);
      res.status(200).json({ posts, totalItems });
  } catch(err) {
    next(err);
  }
};

exports.getPost = (req, res, next) => {
  Post.findById(req.params.postId).populate('creator')
    .then(post => {
      if(!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ post });
    })
    .catch(next);
};

exports.createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      const error = new Error('Invalid input');
      error.statusCode = 422;
      throw error;
    }
    if(!req.file) {
      const error = new Error('No image provided');
      error.statusCode = 422;
      throw error;
    }
    const { title, content } = req.body,
      post = new Post({
        title,
        content,
        imageUrl: req.file.path.replace("\\" ,"/"),
        creator: req.userId
      });
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit('posts', { action: 'create', post: {
      ...post._doc,
      creator: { _id: req.userId, name: user.name }
    }});
    res.status(201).json({
      post,
      creator: {
        _id: user._id.toString(),
        name: user.name
      }
    });
  } catch(err) {
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      const error = new Error('Invalid input');
      error.statusCode = 422;
      throw error;
    }
    const imageUrl = req.file ? req.file.path.replace("\\","/") : req.body.image;
    if(!imageUrl) {
      const error = new Error('No image provided');
      error.statusCode = 422;
      throw error;
    }
    const { title, content } = req.body,
      post = await Post.findById(req.params.postId).populate('creator');
    if(!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    if(post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Permission denied');
      error.statusCode = 403;
      throw error;
    }
    if(imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    await post.save();
    io.getIO().emit('posts', { action: 'update', post })
    res.status(200).json({ post });
  } catch(err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId,
      post = await Post.findById(postId);
    if(!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    if(post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Permission denied');
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    await User.findByIdAndUpdate(req.userId, { $pull: { posts: postId } });
    io.getIO().emit('posts', { action: 'delete', post: postId });
    res.status(200).json({ message: 'Post deleted' })
  } catch(err) {
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try{
    const { status } = await User.findById(req.userId);
    if(!status) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ status });
  } catch(err) {
    next(err);
  }
};

exports.setStatus = async (req, res, next) => {
  try{
    const user = await User.findById(req.userId);
    if(!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    user.status = req.body.status;
    await user.save();
    res.status(200).json({ status: user.status });
  } catch(err) {
    next(err);
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => err && console.log(err));
};