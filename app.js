const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('./config');
const cors = require('./routes/cors'); // make sure cors.js exports corsWithOptions

// Routers
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const campsiteRouter = require('./routes/campsiteRouter');
const promotionRouter = require('./routes/promotionRouter');
const partnerRouter = require('./routes/partnerRouter');
const uploadRouter = require('./routes/uploadRouter');
const favoriteRouter = require('./routes/favoriteRouter');

const app = express();

// MongoDB connection
const url = config.mongoUrl;
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected correctly to server'))
    .catch(err => console.log(err));

// Secure traffic only
app.all('*', (req, res, next) => {
    if (req.secure) return next();
    console.log(`Redirecting to: https://${req.hostname}:${app.get('secPort')}${req.url}`);
    res.redirect(301, `https://${req.hostname}:${app.get('secPort')}${req.url}`);
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for whitelist
app.use(cors.corsWithOptions);

// Initialize Passport
app.use(passport.initialize());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routers
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/campsites', campsiteRouter);
app.use('/promotions', promotionRouter);
app.use('/partners', partnerRouter);
app.use('/imageUpload', uploadRouter);
app.use('/favorites', favoriteRouter);

// Catch 404
app.use((req, res, next) => next(createError(404)));

// Error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);

    // If request expects HTML, render error page
    if (req.accepts('html')) {
        res.render('error');
    } else {
        // Otherwise send JSON (useful for API testing)
        res.json({ error: err.message });
    }
});

module.exports = app;
