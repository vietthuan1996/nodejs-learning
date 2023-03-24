const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'The related tour need to be defined'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'The related user need to be defined'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//* [Note] Using index to create a constraint to prevent duplicated value.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calculateAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numberOfRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numberOfRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//* [Note] Update stats for Tour model in create query
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.tour);
});

//* Update stats for Tour model in update and delete query
reviewSchema.pre(/findOneAnd/, async function (next) {
  this.reviewObject = await this.findOne();
  next();
});

reviewSchema.post(/findOneAnd/, async function () {
  await this.reviewObject.constructor.calculateAverageRating(
    this.reviewObject.tour
  );
});
//* ---------------------------------

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
