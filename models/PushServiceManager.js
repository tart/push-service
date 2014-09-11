var App = require('./App'),
    PushService = require('../services/PushService'),
    PushServiceManager = {
        services: {}
    };


/**
 * 
 * @param {string} app
 * @param {Function} callback
 */
PushServiceManager.get = function(app, callback) {
    if (PushServiceManager.services[app])
        return callback(null, PushServiceManager.services[app]);

    App.findOne({name: app}, function(err, data) {
        if (err)
            return callback(err);

        var pushService = new PushService({
            gcm: {
                apiKey: data.gcmApiKey
            },
            apn: {
                'gateway': data.apnGateway,
                'cert': global.config.certificateRoot + '/' + data.name + '/cert.pem',
                'key': global.config.certificateRoot + '/' + data.name + '/key.pem',
                'passphrase': data.apnPassphrase
            }
        });

        PushServiceManager.services[app] = pushService;
        callback(null, pushService);
    });
};


module.exports = PushServiceManager;
