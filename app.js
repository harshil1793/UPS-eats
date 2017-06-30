var restify = require('restify');
var builder = require('botbuilder');
var prompts = require('./prompts');
var Client = require('node-rest-client').Client;
var needle = require('needle'),
    url = require('url'),
    validUrl = require('valid-url'),
    captionService = require('./caption-service');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
   
});
  
// Create chat bot
var connector = new builder.ChatConnector({
     appId: process.env.MICROSOFT_APP_ID,
     appPassword: process.env.MICROSOFT_APP_PASSWORD
    //appId: prompts.appId,
    //appPassword: prompts.appPass
});
var bot = new builder.UniversalBot(connector, function (session) {
    session.beginDialog('rootMenu');
});
server.post('/api/messages', connector.listen());


var model = process.env.model;
var LocationKey = "DefaultLocation";
var ShippingStyleKey = "Shipping Style";
var async = require("async");
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/7ee7c6ce-cfe4-401c-817e-76fb4543c85c?subscription-key=b789414cba8441b89347e424899fa70f');

var entityID = 0;
var ientityID = 0;
var restaurantID = 0;

bot.recognizer(recognizer);
// bot.library(locationDialog.createLibrary("Ak2VZoOri8R263-z_IAqqGRcG55S3S5q71H9lSkCsU-1gjnHD1KRUkbeI-zLPp5O"));

//root dialog
bot.dialog('start', function(session){
    session.send("Hey! How may I help you today?");
    session.beginDialog('rootMenu');
}).triggerAction({matches: "Greetings"});

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message()
                    .address(message.address)
                    .text(prompts.welcomeMessage);
                bot.send(reply);
                // var reply = new builder.Message()
                //     .address(message.address)
                //     .text('I also help to find trending restaurants and cafes.');
                // bot.send(reply);
                var reply = new builder.Message()
                    .address(message.address)
                    .text('Type \'help\' to know how bot can help you.');
                bot.send(reply);
            }
        });
    }
});

// Add root menu dialog
bot.dialog('rootMenu', [
    function (session) {
        builder.Prompts.choice(session, "Hey! How may I help you today?", 'Search|Quit',{listStyle:3});
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('search');
                break;
            case 1:
                session.beginDialog('Quit');
                break;
            default:
                session.endDialog();
                break;
        }
    }
]).reloadAction('showMenu', null, { matches: /^(menu|back)/i }).triggerAction({ matches: /^menu/i });;