const express = require('express');
const controller = require('../controllers/userController');
const {isGuest, isLoggedIn, isLockedForTrade, hasOneAvailableTrade, authorizeTradeParams} = require('../middlewares/auth');
const {logInLimiter} = require('../middlewares/rateLimiters');
const {validateSignUp, validateLogIn, validateResult} = require('../middlewares/validator');

const router = express.Router();

//GET /users/new: send html form for creating a new user account

router.get('/new',isGuest, controller.new);

//POST /users: create a new user account

router.post('/', isGuest, validateSignUp, validateResult, controller.create);

//GET /users/login: send html for logging in
router.get('/login', isGuest, controller.getUserLogin);

//POST /users/login: authenticate user's login
router.post('/login', logInLimiter, isGuest, validateLogIn, validateResult, controller.login);

//GET /users/profile: send user's profile page
router.get('/profile', isLoggedIn, controller.profile);

router.get('/:id/trade',isLoggedIn, hasOneAvailableTrade, controller.initiateOffer);

router.put('/:id',isLoggedIn, hasOneAvailableTrade, isLockedForTrade, controller.finalizeOffer);

router.put('/cancel/:id', isLoggedIn, controller.cancelOffer);

router.get('/:id/manageOffer', isLoggedIn, controller.manageOffer);

router.put('/:id1/:id2/accept', isLoggedIn, authorizeTradeParams, controller.acceptOffer);

router.put('/:id1/:id2/reject', isLoggedIn, authorizeTradeParams, controller.rejectOffer);

//POST /users/logout: logout a user
router.get('/logout', isLoggedIn, controller.logout);

module.exports = router;