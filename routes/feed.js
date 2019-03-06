const { Router } = require('express'),
  { body } = require('express-validator/check'),
  router = Router();

const feedController = require('../controllers/feed'),
  { isLoggedIn } = require('../middleware');

const postValidator = [
  body('title').trim().isLength({ min: 5 }),
  body('content').trim().isLength({ min: 5 })
];

router.get('/posts', isLoggedIn, feedController.getPosts);

router.get('/post/:postId', isLoggedIn, feedController.getPost);

router.post('/post', isLoggedIn, postValidator, feedController.createPost);

router.put('/post/:postId', isLoggedIn, postValidator, feedController.updatePost);

router.delete('/post/:postId', isLoggedIn, feedController.deletePost);

router.get('/status', isLoggedIn, feedController.getStatus);

router.put('/status', isLoggedIn, feedController.setStatus);

module.exports = router;