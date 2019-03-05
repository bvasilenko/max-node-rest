const fs = require('fs'),
  path = require('path');

const { validationResult } = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  Post.find()
    .then(posts => res.status(200).json({ posts }))
    .catch(next);
};

exports.getPost = (req, res, next) => {
  Post.findById(req.params.postId)
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

exports.createPost = (req, res, next) => {
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
      creator: { name: 'User' }
    });
  post.save()
    .then(post => res.status(201)
      .json({ post })
    )
    .catch(next);
};

exports.updatePost = (req, res, next) => {
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
  const { title, content } = req.body;
  Post.findById(req.params.postId)
    .then(post => {
      if(!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }
      if(imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then(post => res.status(200).json({ post }))
    .catch(next);
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if(!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(() => res.status(200).json({ message: 'Post deleted' }))
    .catch(next)
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => err && console.log(err));
};