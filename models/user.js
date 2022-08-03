const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {ObjectId} = require('mongodb');
const Schema = mongoose.Schema;


const userSchema = new Schema(
    {
        firstName: {type: String, required: [true,"firstName is a required Field"]},
        lastName: {type: String, required: [true,"lastName is a required Field"]},
        email: {type: String, required: [true,"email is a required Field"], unique: [true, 'this email address has been used']},
        password: {type: String, required: [true, 'password is required']},
        isSellerFor: {type: [Schema.Types.ObjectId], ref:'User'}
    }
);

userSchema.pre('save', function(next){
    let user = this;
    if (!user.isModified('password'))
        return next();
    bcrypt.hash(user.password, 10)
    .then(hash => {
      user.password = hash;
      next();
    })
    .catch(err => next(error));
  });
  
  
userSchema.methods.comparePassword = function(inputPassword) {
    let user = this;
    return bcrypt.compare(inputPassword, user.password);
}

module.exports = mongoose.model('User', userSchema);