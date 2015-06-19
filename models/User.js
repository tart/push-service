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
 * @param {string} userId
 * @param {string} app
 * @param {Function} cb
 */
userSchema.statics.getByTokenAndApp = function(token, app, cb) {
    this.findOne({
        devices: {$elemMatch: {token: token}},
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


userSchema.statics.deleteToken = function(search, token, callback) {
    this.update(search, {
        $pull: {
            devices: {
                token: token
            }
        }
    }, {
        multi: true
    }, callback);
};


userSchema.statics.upsertDevice = function(search, device, callback) {
    var searchQuery = {app: search.app}, updateId = null;
    if (search.userId) {
        searchQuery.userId = search.userId;
        updateId = search.userId;
    } else {
        searchQuery.devices = {$elemMatch: {token: device.token}};
        updateId = 'anonymous' + new Date().getTime();
    }

    User.findOneAndUpdate(searchQuery, {
            userId: updateId,
            app: search.app,
            locale: search.locale,
            $addToSet: {
                devices: {
                    type: device.type,
                    token: device.token
                }
            }
        }, {
            upsert: true
        }, callback);
};



var User = mongoose.model('User', userSchema);


// Export the user model.
module.exports = User;
