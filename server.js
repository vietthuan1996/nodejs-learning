const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('Done connection');
  });

const app = require('./app');

const server = app.listen(process.env.PORT, () => {
  console.log(`App running on port 3000`);
});

//* Catch Unhandled Rejection errors.
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.errmsg);
  console.log('UNHANDLED REJECTION!, SHUTTING DOWN...');
  server.close(() => {
    process.exit(1);
  });
});
