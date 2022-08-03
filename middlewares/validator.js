const {body} = require('express-validator');
const {validationResult} = require('express-validator');

exports.validateSignUp = [body('firstName','First Name can not be empty').notEmpty().trim().escape(),
body('lastName', 'Last Name can not be empty').notEmpty().trim().escape(),
body('email','Email must be a valid email address').isEmail().trim().escape().normalizeEmail(),
body('password', 'Password must be atleast 8 characters and at most 64 characters').isLength({min:8, max:64})];

exports.validateLogIn = [body('email','Email must be a valid email address').isEmail().trim().escape().normalizeEmail(),
body('password', 'Password must be atleast 8 characters and at most 64 characters').isLength({min:8, max:64})];

exports.validateTrade = [body('publicationCompany','Publication Company can not be empty').notEmpty().trim().escape(),
body('comicName', 'Comic Name can not be empty').notEmpty().trim().escape(),
body('storyPlot','The story plot needs to be 10 characters at least').isLength({min:10}).trim().escape()]

exports.validateId = (req, res, next) => {
    let id = req.params.id;
    if(!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid story id');
        err.status = 400;
        return next(err);
    }
    else
    {
        return next();
    }
};



exports.validateResult = (req, res, next) => {
    let errors = validationResult(req);
    if(!errors.isEmpty())
    {
        errors.array().forEach(error => {
            req.flash('error',error.msg);
        });
        return res.redirect('back');
    }
    else
    {
        return next();
    }
};