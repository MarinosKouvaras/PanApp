require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const hash = require('pbkdf2-password')();

const drawingsRouter = require('./routes/drawings');
const shapeRoutes = require('./routes/shapes');
const fireRouter = require('./routes/fireRouter');
const flightRouter = require('./routes/flightRouter');
const adsbRouter = require('./routes/openSky');

const app = express();

// Set up middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session setup
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || 'shhhh, very secret',
  cookie: { secure: false } // Set to true if using HTTPS
}));

const corsOptions = {
  origin: ['http://localhost:5500', 'http://localhost:3000', 'http://10.100.54.33:3000', 'http://192.168.1.19:5500', 'http://192.168.2.5:3000'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use('/assets', express.static(path.join(__dirname, 'assets')));
// Dummy database
const users = {
  panorama: { name: 'panorama' }
};

// Generate a salt and hash the password for the user
hash({ password: '12345' }, function (err, pass, salt, hash) {
  if (err) throw err;
  users.panorama.salt = salt;
  users.panorama.hash = hash;
});

// Authentication function
function authenticate(name, pass, fn) {
  const user = users[name];
  if (!user) return fn(null, null);
  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user);
    fn(null, null);
  });
}
function authCheck(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Middleware to restrict access to authenticated users
function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied!', redirect: '/login' });
  }
}
app.use((req, res, next) => {
  if (req.path === '/login') {
    return next();
  }
  authCheck(req, res, next);
});
// Routes
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res, next) => {
  authenticate(req.body.username, req.body.password, function (err, user) {
    if (err) return next(err);
    if (user) {
      req.session.regenerate(function () {
        req.session.user = user;
        res.redirect('/');
      });
    } else {
      const errorMessage = 'Authentication failed, please check your username and password.';
      res.redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
    }
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(function () {
    res.redirect('/login');
  });
});
app.get('/', restrict, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Protected routes (example: for drawings)
app.use('/drawings', restrict, drawingsRouter);
app.use('/shapes', restrict, shapeRoutes);
app.use('/fires', restrict, fireRouter);
app.use('/flights', restrict, flightRouter);
app.use('/adsb', restrict, adsbRouter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
//app.use('/assets', express.static(path.join(__dirname, 'assets')));


// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
