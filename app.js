var restify = require('restify');
var builder = require('botbuilder');
var prompts = require('./prompts');
var Client = require('node-rest-client').Client;
var fs = require('fs');
var text2png = require('text2png');
var util = require('util');
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
    // appId: prompts.appId,
    // appPassword: prompts.appPass
});
var bot = new builder.UniversalBot(connector, function (session) {
    session.beginDialog('startp');
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
                var reply = new builder.Message()
                    .address(message.address)
                    .text('Type \'help\' to know how bot can help you.');
                bot.send(reply);

            }
        });
    }
});

// Add root menu dialog
// bot.dialog('rootMenu', [
//     function (session) {
//         builder.Prompts.choice(session, "Hey! How may I help you today?", 'Search|Quit',{listStyle:3});
//     },
//     function (session, results) {
//         switch (results.response.index) {
//             case 0:
//                 session.beginDialog('search');
//                 break;
//             case 1:
//                 session.beginDialog('Quit');
//                 break;
//             default:
//                 session.endDialog();
//                 break;
//         }
//     }
// ]).reloadAction('showMenu', null, { matches: /^(menu|back)/i }).triggerAction({ matches: /^menu/i });

// welcome
bot.dialog('startp', [
    function (session) {
        builder.Prompts.choice(session, "Do you have UPS Café Id?", 'Yes|No',{listStyle:3});
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('upload_id');
                break;
            case 1:
                session.beginDialog('generate_id');
                break;
            default:
                session.endDialog();
                break;
        }
    }
]).triggerAction({ matches: /^startp/i });

// Generate Id
bot.dialog('generate_id', [
    function (session) {
        builder.Prompts.text(session, 'Enter your name');
    },
    function (session, results) {
        session.userData.user_name = results.response;
        builder.Prompts.text(session, 'Enter your employee ID');

    },
    function (session, results) {
        session.userData.employee_id = results.response;
        builder.Prompts.choice(session, "Select your location ", 'New Jersey|Atlanta',{listStyle:3});

    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.userData.location = "New Jersey";
                builder.Prompts.choice(session, "Select your location ", 'Mahwah|Parsippany|Wayne',{listStyle:3});
                break;
            case 1:
                session.userData.location = "Atlanta";
                session.beginDialog('confirm_id');
                break;
            default:
                session.beginDialog('start');
                break;
        }
    },
    function(session, results){
        switch (results.response.index) {
            case 0:
                session.userData.campus = "Mahwah";
                break;
            case 1:
                session.userData.campus = "Parsippany";
                break;
            case 2:
                session.userData.campus = "Wayne";
                break;
            default:
                session.beginDialog('startp');
                break;
        }
        session.beginDialog('confirm_id');
    }
]).triggerAction({ matches: /^generate_id/i });

// Confirm id information
bot.dialog('confirm_id', [
    function (session) {
        console.log("USERNAME = "+session.userData.user_name)
        console.log("DefaultLocation = "+session.userData.location)
        console.log("CAMPUS = "+session.userData.campus)
        if(session.userData.location != 'Atlanta'){
            builder.Prompts.text(session, 'Please confirm your information- \nUsername: '+ session.userData.user_name+
            ', \nEmployee ID: '+session.userData.employee_id+', \nLocation: '+session.userData.location+', \nCampus: '+session.userData.campus+'.');
        }
        else{
            builder.Prompts.text(session, 'Please confirm your information- \nUsername: '+ session.userData.user_name+
            ', \nEmployee ID: '+session.userData.employee_id+', \nLocation: '+session.userData.location+'.');
        }
    },
    function (session, results) {
        if(results.response == 'yes' || results.response == 'yeah' || results.response == 'Yes' || results.response == 'Yeah'){
            session.beginDialog('save_id');
        }
        else if(results.response == 'no' || results.response == 'No' ){
            session.beginDialog('generate_id');
        }
    }
]).triggerAction({ matches: /^confirm_id/i });

// save Id
bot.dialog('save_id', [
    function (session) {
        if(session.userData.location == 'Atlanta'){
            fs.writeFileSync(session.userData.employee_id+'.png', text2png('Name: '+session.userData.user_name+' \nId: '+session.userData.employee_id+
        '\nlocation: '+session.userData.location, {textColor: 'black',bgColor: 'white'}));
    }
    else{
        fs.writeFileSync(session.userData.employee_id+'.png', text2png('Name: '+session.userData.user_name+' \nId: '+session.userData.employee_id+
        '\nlocation: '+session.userData.location+'\nCampus: '+session.userData.campus, {textColor: 'black',bgColor: 'white'}));
    }
        
    builder.Prompts.text(session, 'Drag and drop image on your pc');
    fs.readFile('./'+session.userData.employee_id+'.png', function (err, data) {
    var contentType = 'image/png';
    var base64 = Buffer.from(data).toString('base64');

    var msg = new builder.Message(session)
        .addAttachment({
            contentUrl: util.format('data:%s;base64,%s', contentType, base64),
            contentType: contentType,
            name: session.userData.employee_id+'.png'
        });

    session.send(msg);
});

    session.beginDialog('upload_id');
    }
    // function (session, results) {
    //     session.userData.user_name = results.response;
    //     builder.Prompts.choice(session, "Select your location ", 'New Jersey|Atlanta',{listStyle:3});

    // }
]).triggerAction({ matches: /^save_id/i });

// Generate Id
bot.dialog('upload_id', [
    function (session) {
        if (hasImageAttachment(session)) {
                var stream = getImageStreamFromMessage(session.message);
                captionService
                    .getCaptionFromStream(stream)
                    .then(function (caption) { handleSuccessResponse(session, caption);})
                    .catch(function (error) { handleErrorResponse(session, error); });
                    
            }
            else {
                var imageUrl = parseAnchorTag(session.message.text) || (validUrl.isUri(session.message.text) ? session.message.text : null);
                if (imageUrl) {
                    captionService
                        .getCaptionFromUrl(imageUrl)
                        .then(function (caption) { handleSuccessResponse(session, caption);})
                        .catch(function (error) { handleErrorResponse(session, error); });
                } else {
                    session.send('I\'m more of a visual person. Upload an UPS cafe Id.');
            
            }
            console.log("query="+session.userData.q);
    }
    }
    // function (session, results) {
    //     session.userData.user_name = results.response;
    //     builder.Prompts.choice(session, "Select your location ", 'New Jersey|Atlanta',{listStyle:3});

    // }
]).triggerAction({ matches: /^upload_id/i });




//Search
bot.dialog('parse_image', function (session) {
    var data = session.userData.body;
    regions = data.regions;
    // for(var i = 0; i < regions.length; i++){
    //     for(var j = 0; j < regions.lines.length; j++){
    //          for(var k = 0; k < regions.lines.words.length; k++){
                // if(regions[i].lines[j].words[k].text == 'Name:'){
                    session.userData.new_name = regions[0].lines[0].words[1].text;
                    session.userData.new_id = regions[0].lines[1].words[1].text;
                    session.userData.new_location = regions[0].lines[2].words[1].text;
                    if(session.userData.new_location = regions[0].lines[2].words[1].text == 'New'){
                        session.userData.new_location = 'New Jersey';
                    }
                    if(regions[0].lines[2].words[1].text != 'Atlanta' ){
                        session.userData.new_campus = regions[0].lines[3].words[1].text;
                    }
                    
        console.log("USERNAME = "+session.userData.new_name)
        console.log("Id = "+session.userData.new_id)
        console.log("DefaultLocation = "+session.userData.new_location)
        console.log("CAMPUS = "+session.userData.new_campus)
                // }
    //         }
    //     }
    // }
    console.log("bbbody::::"+session.userData.body.regions[0].lines[0].words[1].text);
}).triggerAction({ matches: /^parse_image/i });




//Image handling methods
function hasImageAttachment(session) {
    return session.message.attachments.length > 0 &&
        session.message.attachments[0].contentType.indexOf('image') !== -1;
}

function getImageStreamFromMessage(message) {
    var headers = {};
    var attachment = message.attachments[0];
    if (checkRequiresToken(message)) {
        connector.getAccessToken(function (error, token) {
            var tok = token;
            headers['Authorization'] = 'Bearer ' + token;
            headers['Content-Type'] = 'application/octet-stream';

            return needle.get(attachment.contentUrl, { headers: headers });
        });
    }

    headers['Content-Type'] = attachment.contentType;
    return needle.get(attachment.contentUrl, { headers: headers });
}

function checkRequiresToken(message) {
    return message.source === 'skype' || message.source === 'msteams';
}

function parseAnchorTag(input) {
    var match = input.match('^<a href=\"([^\"]*)\">[^<]*</a>$');
    if (match && match[1]) {
        return match[1];
    }

    return null;
}

function handleSuccessResponse(session, body) {
    if (body) {
        // session.send('I think it\'s ' + caption);
        session.userData.body = body
        session.beginDialog('parse_image');
    }
    else {
        session.send('Couldn\'t find a caption for this one');
    }

}

function handleErrorResponse(session, error) {
    session.send('Oops! Something went wrong. Try again later.');
    console.error(error);
}