const mongoose = require('mongoose');
const {ObjectId} = require('mongodb');
const Schema = mongoose.Schema;

//sellerItem: Item that seller is obtaining from the trade
//buyerItem: Item that seller is forgoing for the sake of the trade/buyer is obtaining from the trade
const offerSchema = new Schema(
    {
        sellerItem: {type:Schema.Types.ObjectId, ref:"Comic"},
        buyerItem: {type:Schema.Types.ObjectId, ref:'Comic'},
        seller: {type:Schema.Types.ObjectId, ref:'User'},
        buyer: {type:Schema.Types.ObjectId, ref:'User'},
        offerStatus: {type:String, default:'Available'}
    }
);

module.exports = mongoose.model('Offer',offerSchema);