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

    User.upsertDevice({
        app: res.locals.app,
        userId: req.params.userId,
        locale: req.body.locale
    }, req.body.device, function(err) {
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
    if (!req.params.userId || !req.params.token)
        return res.status(400).end();

    User.deleteToken({
        userId: req.params.userId,
        app: res.locals.app
    }, req.params.token, function(err, response) {
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
