var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var server = restify.createServer();
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());
var bot = new builder.UniversalBot(connector);
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('listening to %s', server.url);
});
// Send welcome when conversation with bot is started, by initiating the root dialog
