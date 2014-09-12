var User = require('../models/User'),
    UserController = {};


/**
 * Create a new user if user is not exists on db. If exists, updates user locale and adds new device to
 * current devices.
 * @param {Object} req
 * @param {Object} res
 */
UserController.upsert = function(req, res) {
    if (!req.body.locale || !req.body.device)
        return res.status(400).end();

    var searchQuery = {app: res.locals.app}, updateId = null;
    if (!!req.params.userId) {
        searchQuery.userId = req.params.userId;
        updateId = req.params.userId;
    } else {
        searchQuery.devices = {$elemMatch: {token: req.body.device.token}};
        updateId = 'anonymous' + new Date().getTime();
    }

    User.findOneAndUpdate(searchQuery, {
            userId: updateId,
            app: res.locals.app,
            locale: req.body.locale,
            $addToSet: {
                devices: {
                    type: req.body.device.type,
                    token: req.body.device.token
                }
            }
        }, {
            upsert: true
        }, function(err) {
            console.log(err);
            res.status(err ? 500 : 200).end();
        });
};


/**
 * Deletes a spesific device from user.
 * @param {Object} req
 * @param {Object} res
 */
UserController.deleteDevice = function(req, res) {
    if (!req.params.userId || !req.body.token)
        return res.status(400).end();

    User.update({ 
        userId: req.params.userId,
        app: res.locals.app
    }, { 
        $pull: {
            devices: {
                token: req.body.token
            }
        }
    }, { 
        multi: true 
    }, function(err, response) {
      res.status(err ? 500 : 200).end();  
    });
};


/**
 * Deletes a user and its devices completely.
 * @param {Object} req
 * @param {Object} res
 */
UserController.delete = function(req, res) {
    if (!req.params.userId)
        return res.status(400).end();

    User.remove({
        userId: req.params.userId,
        app: res.locals.app
    }, function(err, response) {
      res.status(err ? 500 : 200).end();  
    });
};


module.exports = UserController;
