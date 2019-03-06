const jwt = require('jsonwebtoken');

exports.isLoggedIn = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if(!authHeader) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  let token;
  try {
    token = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
  } catch(err) {
    next(err);
  }
  if(!token) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  req.userId = token.userId;
  next();
};