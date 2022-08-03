const Comic = require('../models/comic');
const User = require('../models/user');
const Offer = require('../models/offer');

//check if user is a guest
exports.isGuest = (req, res, next) => {
    if(!req.session.user)
    {
        return next();
    }
    else
    {
        req.flash('error','You are already logged in');
        return res.redirect('/users/profile');
    }
};

//check if user is authenticated
exports.isLoggedIn = (req, res, next) => {
    if(req.session.user)
    {
        return next();
    }
    else
    {
        req.flash('error','You are not logged in');
        return res.redirect('/users/login');
    }
};

exports.isTradePoster = (req, res, next) => {
    let id = req.params.id;
    Comic.findById(id)
    .then(comic => {
        if(comic)
        {
            if(comic.postedBy == req.session.user)
            {
                return next();
            }
            else
            {
                let err = new Error('Unauthorized to access the requested resource');
                err.status = 401;
                return next(err);
            }
        }
        else
        {
            let err = new Error('Comic id not found '+id);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => {
        next(err);
    });
};

exports.isLockedForTrade = (req, res, next) => {
    let id = req.params.id;
    let field;
    Comic.findById(id).lean()
    .then(result => {
        for(var i = 0; i<result.length; i++)
        {
            console.log(result.length);
            field = result[0].offerStatus;
        }
        if(field == 'Offer Pending' || field == 'Traded')
        {
            req.flash('error','This item is not available for trade');
            return res.redirect('/users/profile');
        }
        else
        {
            return next();
        }
    })
    .catch(err => {
        next(err);
    });
};

exports.hasOneAvailableTrade = (req, res, next) => {
    let user = req.session.user;
    Comic.find({$and:[{postedBy: user},{offerStatus:'Available'}]}).lean()
    .then(result => {
        if(result.length >= 1)
        {
            return next();
        }
        else
        {
            req.flash('error','You need to create a trade Item first. Click on Trade Comics');
            return res.redirect('/trades/newTrade');
        }
    })
    .catch(err => {
        next(err);
    });
};

exports.authorizeTradeParams = (req, res, next) => {
    let user = req.session.user;
    let id1 = req.params.id1;
    let id2 = req.params.id2;
    let offerId, seller;
    Offer.find({$or:[{$and:[{buyer:user},{sellerItem:id1}]},{$and:[{buyer:user},{sellerItem:id2}]}]}).lean()
    .then(result => {
        if(result.length > 0)
        {
            result.forEach(item => {
                offerId = item._id;
                seller = item.seller;
            });
            console.log(id1+ " " + id2);
            Comic.countDocuments({$and:[{_id: id1},{offerStatus: 'Offer Pending'}]})
            .then(count => {
                if(!(count >= 1))
                {
                    req.flash('error','Item can not be found');
                    //req.flash('User not authorized to perform this operation');
                    let err = new Error('Item not found');
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => {
                next(err);
            });

            Comic.countDocuments({$and:[{_id: id2},{offerStatus: 'Offer Pending'}]})
            .then(count => {
                if(!(count >= 1))
                {
                    req.flash('error','Item can not be found');
                    //req.flash('User not authorized to perform this operation');
                    let err = new Error('Item not found');
                    err.status = 404;
                    return next(err);
                }
                else
                {
                    next();
                }
            })
            .catch(err => {
                next(err);
            });
        }
        else
        {
            req.flash('User not authorized to perform this operation');
            let err = new Error('Unauthorized operation');
            err.status = 401;
            return next(err);
        }
    })
    .catch(err => {
        next(err);
    });
};