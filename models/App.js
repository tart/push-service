var mongoose = require('mongoose'),
    appSchema = mongoose.Schema({
        name: {
            type: String,
            unique: true
        },
        displayName: String,
        apnPassphrase: String,
        apnGateway: String,
        gcmApiKey: String,
        ips: [String]
    }),
    App = mongoose.model('App', appSchema);

module.exports = App;
