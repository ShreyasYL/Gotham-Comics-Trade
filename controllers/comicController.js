const model = require('../models/comic');
const Offer = require('../models/offer');
const User = require('../models/user');
const {ObjectId} = require('mongodb');
const comic = require('../models/comic');

exports.trades = (req, res, next) => {
    
    model.find()
    .then(comics => {
        let categs = uniqueCategories(comics);
        res.render('./comic/trades',{comics,categs})
    })
    .catch(err => {
        next(err);
    });
};

exports.trade = (req, res, next) => {
    let id = req.params.id;
    req.session.prevurl = 2;
    model.findById(id).populate('postedBy','firstName lastName')
    .then(comic => {
        if(comic)
        {
            console.log(comic);
            res.render('./comic/trade',{comic});
        }
        else
        {
            let err = new Error('Can not find comic with id ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => {
        next(err);
    });
};

exports.editTrade = (req,res,next) => {
    let id = req.params.id;
    model.findById(id)
    .then(comic => {
        if(comic)
        {
            return res.render('./comic/editTrade',{comic});
        }
        else
        {
            let err = new Error("Can not find a story with id " + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => {
        next(err);
    });
};

exports.newTrade = (req, res) => {
    res.render('./comic/newTrade');
};

exports.createTrade = (req, res, next) => {
    let comic = new model(req.body);
    comic.postedBy = req.session.user;
    //comic.onWatchList = {};
    console.log(comic);
    comic.save()
    .then(comic => {
        res.redirect('/trades/');
    })
    .catch(err => {
        if(err.name === "ValidationError")
        {
            req.flash('error',err.message);
            return res.redirect('back');
        }
    });
};

exports.update = (req,res,next) => {
    let id = req.params.id;
    let comic = req.body;
    model.findByIdAndUpdate(id,comic,{useFindAndModify: false, runValidators: true})
    .then(comic => {
        if(comic)
        {
            res.redirect('/trades/'+id);
        }
        else
        {
            let err = new Error('Cannot find a comic with id ' + id);
            err.status = 404;
            next(err);   
        }
    })
    .catch(err => {
        if(err.name === 'ValidationError'){
            req.flash('error','This is an invalid operation.');
            return res.redirect('back');
        }
    });

};

exports.delete = (req,res,next) => {
    let id = req.params.id;
    let user = req.session.user;
    let offerId, sellItem;
    let deletedwithOffer = false;
    console.log(id);
    //model.findByIdAndDelete(id, {useFindAndModify: false})
    User.find({$and:[{_id: user},{isSellerFor: id}]}).lean()
    .then(result => {
        if(result.length > 0)
        {
            deletedWithOffer = true;
            Offer.find({$and:[{seller:user},{buyerItem:id}]}).lean()
            .then(result => {
                if(result.length > 0)
                {
                    result.forEach(item => {
                        sellItem = item.sellerItem;
                        offerId = item._id;
                    });
                    return model.findByIdAndUpdate(sellItem,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true});
                }
                else
                {
                    console.log('Offer.find() within delete method not executed.');
                    return;
                }
            })
            .then(result => {
                return User.findByIdAndUpdate(user,{$pull:{isSellerFor: id}});
            })
            .then(result => {
                return Offer.findByIdAndDelete(offerId,{useFindAndModify: false});
            })
            .then(result => {
                 model.findByIdAndDelete(id, {useFindAndModify: false})
                 .then(comic => {
                     if(comic)
                     {
                         return res.redirect('/trades/');
                     }
                     else
                     {
                        let err = new Error('Cannot find a comic with id ' + id);
                        err.status = 404;
                        return next(err);
                     }
                 })
            })
            
            .catch(err => {
                next(err);
            })
        }
        else
        {
            return model.findByIdAndDelete(id, {useFindAndModify: false})
            .then(comic => {
                if(comic)
                {
                    return res.redirect('/trades/');
                }
                else
                {
                    let err = new Error('Cannot find a comic with id ' + id);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => {
                next(err);
            }); 
        }
    })
    .catch(err => {
        next(err);
    })
    
     
};

exports.watch = (req, res, next) => {
    let user = req.session.user;
    let id = req.params.id;
    model.findOne({_id:ObjectId(id), onWatchList: user})
    .then(result => {
        if(!result)
        {
            return model.updateOne({_id:ObjectId(id)},{$push:{onWatchList: user}});   
        }
    })
    .then(innerRes => {
        if(innerRes)
        {
            req.flash('success','WatchList updated');
            return res.redirect('/users/profile');
        }
        else
        {
            req.flash('error','Could not update WatchList');
            return res.redirect('/users/profile');
        }
    })
    .catch(err => {
        next(err);
    });
};

exports.unwatch = (req, res, next) => {
    let user = req.session.user;
    let id = req.params.id;
    model.findOne({_id:ObjectId(id), onWatchList: user})
    .then(result => {
        if(result)
        {
            return model.updateOne({_id:ObjectId(id)},{$pull:{onWatchList: user}});   
        }
    })
    .then(innerRes => {
        if(innerRes)
        {
            req.flash('success','Item removed from WatchList');
            return res.redirect('/users/profile');
        }
        else
        {
            req.flash('error','Could not update WatchList');
            return res.redirect('/users/profile');
        }
    })
    .catch(err => {
        next(err);
    });
};


let uniqueCategories = function(trades) {
    const category = [];
    trades.forEach(trade=>{
        if(!category.includes(trade.publicationCompany)){
            category.push(trade.publicationCompany);
        }
    });
    return category;
}
