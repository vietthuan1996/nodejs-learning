const express = require('express');
const multer = require('multer');

const upload = multer({ dest: 'public/image/users' });

const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getMe,
} = require('../controllers/userController');

const {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  updateMe,
  restrictTo,
} = require('../controllers/authController');

const router = express.Router();

router.route('/signup').post(signUp);
router.route('/login').post(login);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').patch(resetPassword);

//* All of routes below are covered by protect middleware.
router.use(protect);

router.route('/updatePassword').patch(updatePassword);
router.route('/updateMe').patch(upload.single('photo'), updateMe);
router.route('/me').get(getMe, getUser);

//* All of routes below are covered by restrictTo middleware.
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
