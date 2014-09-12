var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    db = require('./db'),
    App = require('./models/App'),
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
    var app = res.locals.app = req.get('X-App-Name'),
        ip = req.get('X-Real-IP') || req.get('X-Forwarded-For') || req.ip || req.connection.remoteAdress;

    // Check the app name
    if (!app)
        return res.status(417).end();

    // Get the app
    App.findOne({name: app}, function(err, data) {
        if (err)
            return res.status(500).end();

        // Is request ip allowed?
        if (data && ((data.ips || []).indexOf(ip) > -1))
            next();
        else 
            res.status(401).end();
    });
};

// Routes
app.get('/', function(req, res) { res.json({}); });
app.put('/user/:userId', authenticationMiddleware, UserController.upsert);
app.delete('/user/:userId/device', authenticationMiddleware, UserController.deleteDevice);
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
