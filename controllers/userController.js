const model = require('../models/user');
const Comic = require('../models/comic');
const Offer = require('../models/offer');
const {ObjectId} = require('mongodb');

exports.new = (req, res) => {
    res.render('./user/new');
};

exports.create = (req, res, next) => {
    let user = new model(req.body);
    user.save()
    .then(instanceUser => res.redirect('/users/login'))
    .catch(err => {
        if(err.name === 'ValidationError')
        {
            console.log('Error in validation -- Redirecting to new user page');
            req.flash('error',err.message);
            return res.redirect('/users/new');
        }
        if(err.code === 11000)
        {
            req.flash('error','Email id is already in use');
            return res.redirect('/users/new');
        }
        next(err);
    });
};

exports.getUserLogin = (req, res, next) => {
     res.render('./user/login');
};

exports.login = (req, res, next) => {
    let emailId = req.body.email;
    let password = req.body.password;
    model.findOne({email: emailId})
    .then(user => {
        if(!user)
        {
            req.flash('error','Wrong Email Id');
            return res.redirect('/users/login');
        }
        else
        {
            user.comparePassword(password)
            .then(result => {
                if(result)
                {
                    req.session.user = user._id;
                    req.flash('success','You have successfully logged in');
                    return res.redirect('/users/profile');
                }
                else
                {
                    req.flash('error','Wrong Password');
                    return res.redirect('/users/login');
                }
            });
        }
    })
    .catch(err => {
        next(err);
    });
};

exports.profile = (req, res, next) => {
    let id = req.session.user;
    req.session.prevurl = 1;
    var user,trades,watchList,userOffers;
    const ss = [];
    // Promise.all([model.findById(id),Comic.find({postedBy:id}),Comic.find({onWatchList: id})])
    // .then(results => {
    //     const [user,trades, watchList] = results;
    //     res.render('./user/profile',{user, trades, watchList});
    // })
    // .catch(err => {
    //     next(err);
    // });
    model.findById(id)
    .then(result => {
        user = result;
        //console.log(user);
        return Comic.find({postedBy:id});
    })
    .then(result => {
        trades = result;
        return Comic.find({onWatchList: id});
    })
    .then(result => {
        watchList = result;
        //console.log(typeof(result));
        // return Comic.find({_id: {$in: user.offerDetails.map(offer => offer.tradeItem)}});
        return Offer.find({seller: user}).select('sellerItem').lean();
    })
    .then(result => {
        result.forEach(item => {
            ss.push(item.sellerItem);
        });
        return Comic.find({_id:{$in:ss}});
    })
    .then(result => {
        //for(var i = 0;i<result.length;i++)
        //console.log(result[0].sellerItem);
        userOffers = result;
        res.render('./user/profile',{user,trades,watchList,userOffers});
    })
    .catch(err => {
        next(err);
    });


};

exports.initiateOffer = (req, res, next) => {
    let user = req.session.user;
    let id = req.params.id;
    let upForSale;
    Comic.find({postedBy:user, offerStatus:'Available'})
    .then(result => {
        upForSale = result;
        res.render('./user/trade',{upForSale, id});
    })
    .catch(err => {
        next(err);
    });
};

exports.finalizeOffer = (req, res, next) => {
    let user = req.session.user;
    let id = req.params.id;
    let barter = req.body.tradeItem;
    console.log("User="+user+" id="+id+" barter="+barter);
    var party;
    Comic.findById(id)
    .then(result => {
        console.log("Finalize offer - result from comic.findbyid() "+ result);
        party = result.postedBy;
        console.log("party="+party);
        let offerEntry = new Offer();
        offerEntry.sellerItem = id;
        offerEntry.buyerItem = barter;
        offerEntry.seller = user;
        offerEntry.buyer = party;
        offerEntry.offerStatus = 'Offer Pending';
        return offerEntry.save();
    })
    .then(result => {
        return Comic.findByIdAndUpdate(barter,{$set:{offerStatus:'Offer Pending'}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        return Comic.findByIdAndUpdate(id,{$set:{offerStatus:'Offer Pending'}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        return model.findByIdAndUpdate(user,{$push:{isSellerFor:barter}});
    })
    .then(result => {
        console.log("Finalize offer - Result from user.findByIdAndUpdate " + result);
        return res.redirect('/users/profile');
    })
    .catch(err => {
        next(err);
    })

};

exports.cancelOffer = (req, res, next) => {
    let user = req.session.user;
    let id = req.params.id;
    let btItem, offerId, slItem, buyerFl = false, sellerFl = false;
    Offer.find({$or:[{$and:[{seller: user},{sellerItem: id}]},{$and:[{seller: user},{buyerItem: id}]}]}).lean()
    .then(result => {
        result.forEach(item => {
            btItem = item.buyerItem;
            offerId = item._id;
            slItem = item.sellerItem;
        });
        console.log(result);
        //return Comic.findByIdAndUpdate(btItem,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true});
        if(btItem == id)
        {
            buyerFl = true;
            sellerFl = false;
        }
        if(slItem == id)
        {
            buyerFl = false;
            sellerFl = true;
        }
        if(buyerFl)
        {
            Comic.findByIdAndUpdate(btItem,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true})
            .then(result => {
                return Comic.findByIdAndUpdate(slItem,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true});
            })
            .then(result => {
                return Offer.findByIdAndDelete(offerId,{useFindAndModify: false});
            })
            .then(result => {
                return model.findByIdAndUpdate(user,{$pull:{isSellerFor:btItem}},{useFindAndModify: false, runValidators: true});
            })
            .then(result => {
                return res.redirect('/users/profile');
            })
            .catch(err => {
                next(err);
            })
        }
        if(sellerFl)
        {
            Comic.findByIdAndUpdate(slItem,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true})
            .then(result => {
                return Comic.findByIdAndUpdate(btItem,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true});
            })
            .then(result => {
                return Offer.findByIdAndDelete(offerId,{useFindAndModify: false});
            })
            .then(result => {
                return model.findByIdAndUpdate(user,{$pull:{isSellerFor:btItem}},{useFindAndModify: false, runValidators: true});
            })
            .then(result => {
                return res.redirect('/users/profile');
            })
            .catch(err => {
                next(err);
            })
        }
    })
    .catch(err => {
        next(err);
    })
    // })
    // .then(result => {
    //     //console.log(result);
    //     return Comic.findByIdAndUpdate(id,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true});
    // })
    // .then(result => {
    //     return Offer.findByIdAndDelete(offerId,{useFindAndModify: false});
    // })
    // .then(result =>{
    //     return model.findByIdAndUpdate(user,{$pull:{isSellerFor:btItem}},{useFindAndModify: false, runValidators: true});
    // })
    // .then(result => {
    //     return res.redirect('/users/profile');
    // })
    // .catch(err => {
    //     next(err);
    // });
};


exports.manageOffer = (req, res, next) => {
    let user = req.session.user;
    let item = req.params.id;
    let sellerFlag = false, buyerFlag = false, comicId1, comicId2, item1, item2;
    var arr = [];
    model.find({$and:[{_id:user},{isSellerFor: item}]})
    .then(result => {
        if(result.length > 0)
        {
            console.log(result);
            sellerFlag = true;
            buyerFlag = false;
            console.log("sellerFlag = "+sellerFlag+" buyerFlag = "+buyerFlag);
            return Offer.find({$and:[{seller:user},{buyerItem:item}]}).lean();
        }
        else
        {
            sellerFlag = false;
            buyerFlag = true;
            console.log("sellerFlag = "+sellerFlag+" buyerFlag = "+buyerFlag);
            return Offer.find({$and:[{buyer:user},{sellerItem:item}]}).lean();
        }
    })
    .then(result => {
        result.forEach(item => {
            comicId1 = item.sellerItem;
            comicId2 = item.buyerItem;
        });
        return Comic.find({$or:[{_id:comicId1},{_id:comicId2}]}).lean();
    })
    .then(result => {
        for(var i = 0;i<result.length;i++)
        {
            arr.push(result[i]);
        }
        item1 = arr[0];
        item2 = arr[1];
        res.render('./user/manageOffer',{sellerFlag, buyerFlag, item1, item2});
    })
    .catch(err => {
        next(err);
    });
};

exports.acceptOffer = (req, res, next) => {
    let user = req.session.user;
    let id1 = req.params.id1;
    let id2 = req.params.id2;
    let seller,offerId;
    Offer.find({$or:[{$and:[{buyer: user},{sellerItem:id1}]},{$and:[{buyer: user},{sellerItem:id2}]}]}).lean()
    .then(result => {
        result.forEach(item => {
            seller = item.seller;
            offerId = item._id;
        });
        console.log("Result from offer.find() " + result);
        return Comic.findByIdAndUpdate(id1,{$set:{offerStatus:'Traded'}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        console.log("Result from comic.findByIdAndUpdate() " + result);
        return Comic.findByIdAndUpdate(id2,{$set:{offerStatus:'Traded'}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        console.log("Result from comic.findByIdAndUpdate() 2 " + result);
        return model.findByIdAndUpdate(seller,{$pull:{isSellerFor:id2}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        return model.findByIdAndUpdate(seller,{$pull:{isSellerFor:id1}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        console.log("Result from user.findByIdAndUpdate() " + result);
        return Offer.findByIdAndDelete(offerId,{useFindAndModify: false});
    })
    .then(result => {
        console.log("Result from offer.findByIdAndDelete() " + result);
        return res.redirect('/users/profile');
    })
    .catch(err => {
        next(err);
    });
};

exports.rejectOffer = (req, res, next) => {
    let user = req.session.user;
    let id1 = req.params.id1;
    let id2 = req.params.id2;
    console.log(user+" "+id1+" "+id2);
    let seller,offerId;
    Offer.find({$or:[{$and:[{buyer: user},{sellerItem:id1}]},{$and:[{buyer: user},{sellerItem:id2}]}]}).lean()
    .then(result => {
        result.forEach(item => {
            seller = item.seller;
            offerId = item._id;
        });
        console.log("Result from offer.find() " + result);
        return Comic.findByIdAndUpdate(id1,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        console.log("Result from comic.findByIdAndUpdate() " + result);
        return Comic.findByIdAndUpdate(id2,{$set:{offerStatus:'Available'}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        console.log("Result from comic.findByIdAndUpdate() 2 " + result);
        return model.findByIdAndUpdate(seller,{$pull:{isSellerFor:id2}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        return model.findByIdAndUpdate(seller,{$pull:{isSellerFor:id1}},{useFindAndModify: false, runValidators: true});
    })
    .then(result => {
        console.log("Result from user.findByIdAndUpdate() " + result);
        return Offer.findByIdAndDelete(offerId,{useFindAndModify: false});
    })
    .then(result => {
        console.log("Result from offer.findByIdAndDelete() " + result);
        return res.redirect('/users/profile');
    })
    .catch(err => {
        next(err);
    });
};

exports.logout = (req, res, next)=>{
    req.session.destroy(err=>{
        if(err) 
           return next(err);
       else
            res.redirect('/');  
    });
   
 };