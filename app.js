const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const { errorHandler } = require('./controllers/errorController');

const app = express();
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Chain of middleware
app.use('/api', helmet());
//* Only works with endpoints include /api
app.use('/api', limiter);
app.use(express.json());
//* Sanitize the body to prevent NOSQL injection
app.use(mongoSanitize());
app.use(xssClean());
//* Clean up duplicated query parameters
//* Able to add parameters whitelist
app.use(hpp());
app.use(express.static(`${__dirname}/public`));

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//* Middleware for 404
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//* A global error handler
app.use(errorHandler);

module.exports = app;
