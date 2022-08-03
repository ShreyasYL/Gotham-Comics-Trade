const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {ObjectId} = require('mongodb');

const comicSchema = new Schema(
    {
        publicationCompany: {type: String, required: [true,"Publication Company is a required Field"]},
        issueId: {type: Number, required: [true,"Publication Company is a required Field"]},
        comicName: {type: String, required: [true,"comicName is a required field"], minlength: [5,"The comic name must be atleast 5 charcaters in length"]},
        author: {type: String, required: [true,"author name is a required field"]},
        storyPlot: {type: String, required: [true,"story Plot is a required field"], minlength: [10,"The story plot must be atleast 10 charcaters in length"]},
        onWatchList: {type: [Schema.Types.ObjectId], ref:'User'},
        comicImageURL: {type: String, required: [true,"author name is a required field"]},
        postedBy: {type: Schema.Types.ObjectId, ref:'User'},
        offerStatus: {type: String, required: [true,'Offer Status is a required field'],default:'Available'}
    },
    {timestamps: true}
);

module.exports = mongoose.model('Comic',comicSchema);