var mongoose = require('mongoose');


/**
 * Device Schema.
 */
var deviceSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ['ios', 'android']
    },
    token: String
}, { _id: false});


/**
 * User Schema
 */
var userSchema = mongoose.Schema({
    userId: String,
    app: String,
    devices: [deviceSchema],
    locale: String
});


/**
 * 
 * @param {string} userId
 * @param {string} app
 * @param {Function} cb
 */
userSchema.statics.getByUserIdAndApp = function(userId, app, cb) {
    this.find({
        userId: userId,
        app: app
    }, cb);
};


/**
 * 
 * @param {string} app
 * @param {Function} cb
 */
userSchema.statics.getByApp = function(app, cb) {
    this.find({ app: app }, cb);
};



var User = mongoose.model('User', userSchema);


// Export the user model.
module.exports = User;
