//* exports.catchAsync = (fn) => {
//*    return (req, res, next) => {
//*     fn(req, res, next).catch(next);
//* }
//* equal to
//* A wrapper method to reduce try catch block for async functions
exports.catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
