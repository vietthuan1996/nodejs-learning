const status = require('http-status');

const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError('No document found with that ID', status.NOT_FOUND)
      );
    }
    res.status(status.NO_CONTENT).json({
      status: 'success',
      data: null,
    });
  });
