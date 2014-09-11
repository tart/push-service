var mongoose = require('mongoose');
mongoose.connect(global.config.mongoConnectionString);

// On error
mongoose.connection.on('error', function(err) {
    console.log('Mongo Connection - Error:', err);
});

// On success
mongoose.connection.once('open', function() {
    console.log('Mongo Connection OK');
});
