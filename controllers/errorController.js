const mongoose = require('mongoose');
const status = require('http-status');
const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');

const handTokenExpiredError = () =>
  new AppError('Token expired, please login again', status.UNAUTHORIZED);

const handleJsonWebTokenError = () =>
  new AppError('Invalid token, please try again', status.UNAUTHORIZED);

const handleValidatorError = (err) => {
  const errorObj = {};
  Object.keys(err.errors).forEach((key) => {
    errorObj[key] = err.errors[key].properties.message;
  });
  return new AppError(
    `Validation errors: ${JSON.stringify(errorObj)}`,
    status.BAD_REQUEST
  );
};

const handleCaseErrorDb = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, status.BAD_REQUEST);
};

const handleDuplicatedFieldsError = (err) =>
  new AppError(
    `Duplicate fields for ${JSON.stringify(err.keyValue)}`,
    status.BAD_REQUEST
  );

const sendErrDev = (error, res) => {
  res.status(error.statusCode).json({
    status: error.status,
    error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrProd = (error, res) => {
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }
  console.error('Error', error);
  return res.status(status.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: 'Something went wrong',
  });
};

/**
 * Receive all of thrown errors and send back the res to the client.
 */
exports.errorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || status.INTERNAL_SERVER_ERROR;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(error, res);
  } else if (process.env.NODE_ENV === 'production') {
    let err = { ...error };

    if (error instanceof mongoose.Error.CastError) {
      err = handleCaseErrorDb(err);
    } else if (error.code === 11000) {
      err = handleDuplicatedFieldsError(err);
    } else if (error instanceof mongoose.Error.ValidationError) {
      err = handleValidatorError(err);
    } else if (error instanceof jwt.JsonWebTokenError) {
      err = handleJsonWebTokenError();
    } else if (error instanceof jwt.TokenExpiredError) {
      err = handTokenExpiredError();
    }
    sendErrProd(err, res);
  }
};
