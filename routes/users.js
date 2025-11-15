const express = require('express');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');
const cors = require('./cors');

const router = express.Router();

router.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
        User.find()
        .then(users => res.status(200).json(users))
        .catch(err => next(err));
    }
);

router.route('/signup')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.post(cors.corsWithOptions, (req, res) => {
    const user = new User({ username: req.body.username });

    User.register(user, req.body.password)
        .then(registeredUser => {
            if (req.body.firstname) registeredUser.firstname = req.body.firstname;
            if (req.body.lastname) registeredUser.lastname = req.body.lastname;
            return registeredUser.save();
        })
        .then(() => {
            passport.authenticate('local')(req, res, () => {
                res.status(200).json({
                    success: true,
                    status: 'Registration Successful!'
                });
            });
        })
        .catch(err => {
            res.status(500).json({ err: err });
        });
});

router.route('/login')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.post(cors.corsWithOptions, passport.authenticate('local', { session: false }),
    (req, res) => {
        const token = authenticate.getToken({ _id: req.user._id });
        res.status(200).json({
            success: true,
            token: token,
            status: 'You are successfully logged in!'
        });
    }
);

router.route('/logout')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, (req, res, next) => {
    if (req.user) {
        req.logout(err => {
            if (err) return next(err);
            req.session.destroy(err => {
                if (err) return next(err);
                res.clearCookie('session-id');
                res.redirect('/');
            });
        });
    } else {
        const err = new Error('You are not logged in!');
        err.status = 401;
        return next(err);
    }
});

module.exports = router;
