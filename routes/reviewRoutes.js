const express = require('express');

const {
  getReviews,
  createReview,
  updateReview,
} = require('../controllers/reviewController');
const { protect } = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.route('/').get(protect, getReviews).post(protect, createReview);
router.route('/:id').patch(protect, updateReview);

module.exports = router;
