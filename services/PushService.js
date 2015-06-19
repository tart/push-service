var apn = require('apn'),
    gcm = require('node-gcm'),
    _ = require('lodash'),
    User = require('./../models/User'),
    async = require('async');


var PushService = function(data) {
    this.name = data.name;
    this.displayName = data.displayName;
    this.ips = data.ips;
    this.gcm = data.gcm;
    this.apn = data.apn;
    this.gcmSender = new gcm.Sender(this.gcm.apiKey);
    this.apnSender = new apn.Connection(this.apn);
};


/**
 *
 * @param {Array.<{token, type}>} devices
 * @param {string} text
 * @param {(Object|string)=} opt_payload
 */
PushService.prototype.send = function(devices, text, opt_payload) {
    var groupedDevices = _.groupBy(devices, function(device) {
            return device.type;
        });

    if (!!groupedDevices.ios) {
        var apnDevices = groupedDevices.ios.map(function(device) {
                return new apn.Device(device.token);
            }),
            apnNotification = new apn.Notification();

        console.log('Apple device count: ' + apnDevices.length);

        // Send APN Notification
        apnNotification.expiry = Math.floor(Date.now() / 1000) + 3600 * 24; // Expires 1 hour from now.
        apnNotification.sound = "ping.aiff";
        apnNotification.alert = text || '';

        if (!!opt_payload)
            apnNotification.payload = opt_payload;

        // apnNotification.badge = 0;
        this.apnSender.pushNotification(apnNotification, apnDevices);
    }

    if (!!groupedDevices.android) {
        var gcmMessage = new gcm.Message();
        // Send GCM Notification
        gcmMessage.addData('title', this.gcm.messageTitle);
        gcmMessage.addData('message', text || '');

        if (!!opt_payload)
            gcmMessage.addData('payload', JSON.stringify(opt_payload));

        var androidDeviceTokens = groupedDevices.android.map(function(device) {
            return device.token;
        });

        console.log('Android device count: ' + androidDeviceTokens.length);

        /*
        * GCM has a cap of 1000 registration ids at a time. We split 1k ids.
        */
        var that = this;
        async.whilst(
            function () {
                return (regIds = androidDeviceTokens.splice(0, 1000)).length;
            },
            function (callback) {
                that.gcmSender.send(gcmMessage, regIds, 4, that.gcmResponseHandler.bind(that, callback, regIds));
            },
            function (err) {
                if (err)
                    return console.log('Err: There was an error while using GCM', err);

                console.log('GCM done :)');
                that.removeEmptyUsers();
            }
        );
    }
};


PushService.prototype.gcmResponseHandler = function(callback, regIds, err, response) {
    console.log('GCM', err, response);
    var results = response.results,
        that = this;

    if (!results) return callback(err);

    var operations = results.map(function(item, index) {
        if (item.error && item.error === 'NotRegistered')
            return {
                type: 'notRegistered',
                oldToken: regIds[index]
            };

        if (item.message_id && item.registration_id)
            return {
                type: 'redirect',
                newToken: item.registration_id,
                oldToken: regIds[index]
            };
    }).filter(function(item) {
        return item;
    });

    var errors = 0;
    async.each(operations, function(item, done) {
        // Callback wrapper to eliminate stop in execution of async.
        var itemDone = function(err) {
            if (err) {
                errors++;
                console.log('Err when processing gcm operation', err);
            }
            done();
        };

        if (item.type === 'redirect')
            that.organizeRedirect(item.oldToken, item.newToken, itemDone);
        else if (item.type === 'notRegistered')
            that.removeToken(item.oldToken, itemDone);
        else
            itemDone();
    }, function(err) {
        if (err) console.log('Err: Could not interprete GCM response.', err);
        console.log('GCM response processed.');
        console.log('Success: ' + (operations.length - errors));
        console.log('Errors: ' + errors);
        callback();
    });
};


PushService.prototype.removeToken = function(token, callback) {
    User.deleteToken({
        app: this.name,
        devices: {$elemMatch: {token: token}}
    }, token, callback);
};


PushService.prototype.addToken = function(user, token, callback) {
    if (!user) return callback('Err: User not found.');
    if (!token) return callback('Err: Token is undefined.');

    User.upsertDevice({app: this.name, userId: user.userId, locale: user.locale},
        {type: 'android', token: token},
        callback);
};


PushService.prototype.organizeRedirect = function(oldToken, newToken, callback) {
    User.getByTokenAndApp(oldToken, this.name, function(err, user) {
        if (err) {
            console.log('Err: Could not find the owner of the token ' + token, err);
            return callback(err);
        }

        async.series(
            [
                this.removeToken.bind(this, oldToken),
                this.addToken.bind(this, user, newToken)
            ],
            callback);
    }.bind(this));
};


PushService.prototype.removeEmptyUsers = function() {
    User.remove({devices: {$size: 0}}).exec(function(err) {
        if (err)
            return console.log('Err: Could not remove empty user documents.', err);
        console.log('Empty users were removed.');
    });
};


module.exports = PushService;
