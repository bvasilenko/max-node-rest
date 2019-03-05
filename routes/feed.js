const { Router } = require('express'),
  { body } = require('express-validator/check'),
  router = Router();

const feedController = require('../controllers/feed');

const postValidator = [
  body('title').trim().isLength({ min: 5 }),
  body('content').trim().isLength({ min: 5 })
];

router.get('/posts', feedController.getPosts);

router.get('/post/:postId', feedController.getPost);

router.post('/post', postValidator, feedController.createPost);

router.put('/post/:postId', postValidator, feedController.updatePost);

router.delete('/post/:postId', feedController.deletePost);

module.exports = router;