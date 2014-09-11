var async = require('async'),
    _ = require('lodash'),
    App = require('../models/App'),
    User = require('../models/User'),
    PushServiceManager = require('../models/PushServiceManager'),
    PushController = {};


/**
 * 
 * @param {Object} req
 * @param {Object} res
 */
PushController.send = function(req, res) {
    if (!req.body.message || typeof req.body.message != 'object')
        return res.status(400).end();

    var matchQuery = {app: res.locals.app};
    if (!!req.body.userIds && _.isArray(req.body.userIds))
        matchQuery = { userId: {$in: req.body.userIds}, app: res.locals.app };

    User.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$locale', devices: {$push: '$devices'}}}],
      function (err, response) {

        var tasks = response.map(function(item) {
            return function(callback) {

                var locale = item._id;
                var devices = [];
                
                item.devices.forEach(function(device) {
                    devices = devices.concat(device);
                });

                //send devices
                PushServiceManager.get(res.locals.app, function(err, pushService) {
                    if (err) {
                        return callback(err);
                    }

                    if (req.body.message[locale])
                        pushService.send(devices, req.body.message[locale]);

                    callback();
                });
            }
        });

        async.series(tasks, function(err, resp) {
            res.status(err ? 500 : 200).end();  
        });
    });
};


module.exports = PushController;
