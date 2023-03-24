const express = require('express');

const {
  getTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopCheap,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');

const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

//* Using mergeParams to reroute the endpoint to review router
router.use('/:tourId/reviews', reviewRouter);
router.route('/top-5-cheap').get(aliasTopCheap, getTours);
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);
router
  .route('/')
  .get(protect, getTours)
  .post(protect, restrictTo('admin'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(protect, restrictTo('admin'), updateTour)
  .delete(protect, restrictTo('admin'), deleteTour);

module.exports = router;
