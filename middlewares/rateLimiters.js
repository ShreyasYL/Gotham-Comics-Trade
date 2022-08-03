const rateLimit = require('express-rate-limit');

exports.logInLimiter = rateLimit(
    {
        windowsMs: 60 * 1000,
        max: 5,
        handler: (req, res, next) => {
            let err = new Error('Too many login requests. Please try again some time later');
            err.status = 429;
            return next(err);
        }
    }
);