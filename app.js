var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    db = require('./db'),
    App = require('./models/App'),
    PushServiceManager = require('./models/PushServiceManager'),
    UserController = require('./controllers/UserController'),
    PushController = require('./controllers/PushController'),
    app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var authenticationMiddleware = function(req, res, next) {
    var appName = res.locals.app = req.get('X-App-Name'),
        ip = req.get('X-Real-IP') || req.get('X-Forwarded-For') || req.ip || req.connection.remoteAdress;

    // Check the app name
    if (!appName)
        return res.status(417).end();

    PushServiceManager.get(appName, function(err, app) {
        if (err)
            return res.status(500).end();
        console.log(appName, app.name);
        // Is request ip allowed?
        if (app && (appName == app.name) && (app.ips.indexOf(ip) > -1))
            next();
        else
            res.status(401).end();
    });
};

// Routes
app.get('/', authenticationMiddleware, function(req, res) {
    res.json({
        app: res.locals.app,
        authenticated: true
    });
});
app.put('/user/:userId', authenticationMiddleware, UserController.upsert);
app.post('/user', authenticationMiddleware, UserController.upsert);
app.delete('/user/:userId/device/:token', authenticationMiddleware, UserController.deleteDevice);
app.delete('/user/:userId', authenticationMiddleware, UserController.delete);
app.post('/message', authenticationMiddleware, PushController.send);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handler
// No stacktraces leaked to user, just log the error.
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(err.status || 500).end();
});


module.exports = app;
