const status = require('http-status');

const Review = require('../models/reviewModel');
const { catchAsync } = require('../utils/catchAsync');
const { getAllowedInfo } = require('../utils/appHelper');
const AppError = require('../utils/appError');

exports.getReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) {
    filter = {
      tour: req.params.tourId,
    };
  }
  const reviews = await Review.find(filter).populate({
    path: 'user',
    select: 'name -_id',
  });

  res.status(status.OK).json({
    status: 'success',
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tourId) {
    req.body.tourId = req.params.tourId;
  }

  if (!req.body.userId) {
    req.body.userId = req.user._id;
  }
  const review = await Review.create({
    review: req.body.review,
    rating: req.body.rating,
    tour: req.body.tourId,
    user: req.body.userId,
  });

  res.status(status.CREATED).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const allowedInfo = getAllowedInfo(req.body, ['review', 'rating']);
  const review = await Review.findById(req.params.id);

  if (!review.user.equals(req.user._id)) {
    return next(
      new AppError(
        'Can not edit reviews which does not belong to',
        status.FORBIDDEN
      )
    );
  }

  const updatedReview = await Review.findByIdAndUpdate(
    req.params.id,
    allowedInfo,
    {
      new: true,
      //* Enable validator for built-in validator
      runValidators: true,
    }
  );

  res.status(status.OK).json({
    status: 'success',
    data: {
      review: updatedReview,
    },
  });
});
