const jwt = require('jsonwebtoken');
const status = require('http-status');
const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const sendMail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRES_IN,
  });

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  newUser.password = null;

  const token = signToken(newUser._id);

  res.status(status.CREATED).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError('Please provide email and password', status.BAD_REQUEST)
    );
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError('Email or password were not correct', status.BAD_REQUEST)
    );
  }

  const token = signToken(user._id);

  res.status(status.OK).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  const { authorization } = req.headers;
  let token;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in, please login to get access',
        status.UNAUTHORIZED
      )
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError(
        'The user belongs to token is no longer exist',
        status.UNAUTHORIZED
      )
    );
  }

  if (user.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        'User has changed the password, please login again',
        status.UNAUTHORIZED
      )
    );
  }
  req.user = user;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //* roles is an array ['admin', 'user']
    if (!roles.includes(req.user.role)) {
      next(new AppError('No permission for this action', status.FORBIDDEN));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordLink = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Go to this link ${resetPasswordLink} to reset your password`;

    await sendMail({
      email: user.email,
      subject: 'Thuan App - Reset your password',
      message,
    });
  }

  res.status(status.OK).json({
    status: 'success',
    message:
      'If the email exist, the reset password link will be sent to your email.',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha512')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    next(new AppError('The link is no longer valid', status.BAD_REQUEST));
  }

  user.setPassword(req.body.password, req.body.passwordConfirm);
  await user.save();

  const token = signToken(user._id);

  res.status(status.OK).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(
      new AppError('The current password is not correct', status.BAD_REQUEST)
    );
  }

  user.setPassword(password, passwordConfirm);
  await user.save();

  const token = signToken(user._id);

  res.status(status.OK).json({
    status: 'success',
    token,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  res.status(status.OK);
});
