const { validationResult } = require('express-validator/check'),
  bcrypt = require('bcryptjs'),
  jwt = require('jsonwebtoken');

import User = require('../models/user');

export const signupUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      const error = new Error('Invalid input');
      error['statusCode'] = 422;
      error['data'] = errors.array();
      throw error;
    }
    const { email, name, password } = req.body,
      user = new User({
        email,
        name,
        password: await bcrypt.hash(password, 12)
      }),
      { _id } = await user.save();
      res.status(201).json({ message: 'Account created', userId: _id });
  } catch(err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body,
      user = await User.findOne({ email });
    if(!user) {
      const error = new Error('User not found');
      error['statusCode'] = 401;
      throw error;
    }
    if(!await bcrypt.compare(password, user.password)) {
      const error = new Error('Wrong password');
      error['statusCode'] = 401;
      throw error;
    }
    const token = jwt.sign({
      email: user.email,
      userId: user._id.toString()
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, userId: user._id.toString() });
  } catch(err) {
    next(err);
  }
};