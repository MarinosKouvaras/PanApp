require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const drawingsRouter = require('./routes/drawings');
const shapeRoutes = require('./routes/shapes');
const fireRouter = require('./routes/fireRouter');
const flightRouter = require('./routes/flightRouter');
const adsbRouter = require('./routes/openSky');


const app = express();
const corsOptions = {
  origin: ['http://localhost:5500', 'http://localhost:3000', 'http://192.168.1.19:3000', 'http://192.168.1.19:5500'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));


app.use('/drawings', drawingsRouter);
app.use('/shapes', shapeRoutes);
app.use('/fires', fireRouter);
app.use('/flights', flightRouter);
app.use('/adsb', adsbRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // send the error response
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;