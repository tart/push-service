var apn = require('apn'),
    gcm = require('node-gcm'),
    _ = require('lodash');


var PushService = function(data) {
    this.gcm = data.gcm;
    this.apn = data.apn;
    this.gcmSender = new gcm.Sender(this.gcm.apiKey);
    this.apnSender = new apn.Connection(this.apn);
};


/**
 * 
 * @param {Array.<{token, type}>} devices
 * @param {string} text
 */
PushService.prototype.send = function(devices, text) {
    var groupedDevices = _.groupBy(devices, function(device) {
            return device.type;
        });

    if (!!groupedDevices.ios) {
        var apnDevices = groupedDevices.ios.map(function(device) {
                return new apn.Device(device.token);
            }),
            apnNotification = new apn.Notification();

        // Send APN Notification
        apnNotification.expiry = Math.floor(Date.now() / 1000) + 3600 * 24; // Expires 1 hour from now.
        apnNotification.sound = "ping.aiff";
        apnNotification.alert = text || '';
        // apnNotification.badge = 0;
        this.apnSender.pushNotification(apnNotification, apnDevices);
    }

    if (!!groupedDevices.android) {
        var gcmMessage = new gcm.Message();
        // Send GCM Notification
        gcmMessage.addData('title', 'title');
        gcmMessage.addData('message', text || '');
        var androidDeviceTokens = groupedDevices.android.map(function(device) {
            return device.token;
        });

        this.gcmSender.send(gcmMessage, androidDeviceTokens, 4, function (err, result) {
            // Do nothing.
            // console.log(result);
        });
    }

     
};

module.exports = PushService;