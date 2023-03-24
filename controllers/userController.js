const status = require('http-status');
const multer = require('multer');

const User = require('../models/userModel');
const { catchAsync } = require('../utils/catchAsync');
const { deleteOne } = require('./handlerFactory');
const { getAllowedInfo } = require('../utils/appHelper');

const multerStorage = multer({
  destination: (req, res, cb) => {
    cb(null, 'public/image/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
  },
});

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  res.status(status.OK).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.createUser = (req, res) => {};

exports.getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  res.status(status.OK).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateUser = catchAsync(async (req, res, next) => {
  const allowedInfo = getAllowedInfo(req.body, ['name']);

  const savedUser = await User.findByIdAndUpdate(req.params.id, allowedInfo, {
    new: true,
    runValidators: true,
  });

  res.status(status.CREATED).json({
    status: 'success',
    data: {
      user: savedUser,
    },
  });
});

exports.deleteUser = deleteOne(User);
