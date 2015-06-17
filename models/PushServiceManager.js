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

        if (!data)
            return callback('Err: App not found.');

        var pushService = new PushService({
            name: data.name,
            displayName: data.displayName,
            ips: data.ips || [],
            gcm: {
                apiKey: data.gcmApiKey,
                messageTitle: data.displayName
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
