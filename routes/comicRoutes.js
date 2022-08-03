const express = require('express');
const router = express.Router();
const controller = require('../controllers/comicController');
const {isLoggedIn, isTradePoster} = require('../middlewares/auth');
const {validateId, validateResult, validateTrade} = require('../middlewares/validator');

router.get('/',controller.trades);


router.get('/newTrade', isLoggedIn, controller.newTrade);


router.post('/', isLoggedIn, validateTrade, validateResult,  controller.createTrade);


router.get('/:id', validateId, controller.trade);


router.get('/:id/editTrade', isLoggedIn, validateId, isTradePoster, controller.editTrade);


router.put('/:id', isLoggedIn, validateId, validateTrade, validateResult, isTradePoster, controller.update);


router.delete('/:id', isLoggedIn, validateId, isTradePoster, controller.delete);

router.put('/:id/watch', isLoggedIn, validateId, controller.watch);

router.put('/:id/unwatch', isLoggedIn, validateId, controller.unwatch);


module.exports =  router;