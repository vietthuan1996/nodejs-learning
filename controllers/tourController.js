const status = require('http-status');

const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const { deleteOne } = require('./handlerFactory');

/**
 * An alias middleware to add specific query params for a certain endpoint.
 */
exports.aliasTopCheap = (req, res, next) => {
  req.query.limit = 5;
  req.query.fields = 'name,price,ratingsAverage';
  req.query.sort = 'price,-ratingsAverage';
  next();
};

exports.getTours = catchAsync(async (req, res) => {
  const apiFeatures = new APIFeatures(Tour.find(), req.query);
  apiFeatures.filter().sort().select().limit();
  const tours = await apiFeatures.query;

  res.status(status.OK).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id)
    .populate({
      path: 'guides',
      select: '-__v -passwordChangedAt',
    })
    .populate('reviews');

  if (!tour) {
    return next(new AppError('No tour found with that ID', status.NOT_FOUND));
  }

  res.status(status.OK).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res) => {
  const newTour = await Tour.create(req.body);

  res.status(status.CREATED).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    //* Enable validator for built-in validator
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', status.NOT_FOUND));
  }

  res.status(status.OK).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    // Stage 1
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    // Stage 2
    {
      $group: {
        _id: '$difficulty',
        tourNum: { $sum: 1 },
        averageRating: { $avg: '$ratingsAverage' },
        ratingQuantity: { $sum: '$ratingsQuantity' },
        averagePrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' },
      },
    },
    // Stage 3
    {
      $sort: { averagePrice: 1 },
    },
  ]);

  res.status(status.OK).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;

  const result = await Tour.aggregate([
    // split tours by startDates
    // Before: {_id: 1, startDates: ['2021-12-01', '2021-11-01', '2021-10-01']}
    // After: {_id: 1, startDates: '2021-12-01'}, {_id: 1, startDates: '2021-11-01'}, {_id: 1, startDates: '2021-10-01'}
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        tourNum: { $sum: 1 },
        tourNames: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        tourNum: -1,
      },
    },
  ]);

  res.status(status.OK).json({
    status: 'success',
    data: {
      result,
    },
  });
});
