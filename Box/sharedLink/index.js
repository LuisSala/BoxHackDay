'use strict';

/* == Imports == */
var rp = require('request-promise');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var AWS = require('aws-sdk');

/* == Globals == */
var BOX_SUB_TYPES = {
    enterprise: 'enterprise',
    user: 'user'
};

/* == Missing parameters information == */
var API = {
    region: '', //'Insert your region where you launched the stack
    endpoint: '' //'Inser your API Gateway invoke url including https. Something like ... https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
};

var API_KEY = ''; // Insert application Api Key from Backend Parameters section
var CLIENT_ID = ''; // Insert application client_id from OAuth2 Parameters section
var CLIENT_SECRET = ''; // Insert application client_secret from OAuth2 Parameters section
var PUBLIC_KEY_ID = ''; // Insert application Public Key ID from Public Key Management section
var RSA_PRIVATE_KEY = ``;  // Insert your generated private key including  -----BEGIN RSA PRIVATE KEY----- and -----END RSA PRIVATE KEY-----

var endpoint = new AWS.Endpoint(API.endpoint);
var creds = new AWS.EnvironmentCredentials('AWS');

exports.handler = function(event, context, callback) {
    console.log('REQUEST RECEIVED:\n', JSON.stringify(event));
    
    requestToken(event.appUserId, BOX_SUB_TYPES.user)
        .then(function(userAccessToken) {
            return generateSharedLink(userAccessToken.access_token, event.fileId);
        }).then(function(sharedLinkData) {
            console.log('Shared link url is ', sharedLinkData.shared_link.url);
            var messageData = JSON.stringify({
                "message": sharedLinkData.shared_link.url,
                "name": event.userName,
                "channel": "default",
                "timestamp": "" + new Date().getTime()
            });
            postToChatService(messageData, context);
            callback(null, {
                'sharedLinkUrl': sharedLinkData.shared_link.url
            })
        }).catch(function(error) {
            console.log('There was an error ' + error.message);
        });
};

function requestToken(sub, boxSubType) {
    console.log('Creating request token for sub ' + sub + ' with box sub type ' + boxSubType);

    var currentDate = new Date();
    var correctedTime = new Date(currentDate.getTime() + (1 * 60 * 1000));
    var tokenOptions = {
        header: {
            "alg": "RS256",
            "typ": "JWT",
            "kid": PUBLIC_KEY_ID
        }
    };
    var tokenData = {
        "iss": API_KEY,
        "sub": sub,
        "box_sub_type": boxSubType,
        "aud": "https://api.box.com/oauth2/token",
        "jti": crypto.randomBytes(64).toString('hex').substring(0, 20),
        "exp": Math.floor(correctedTime.getTime() / 1000)
    };
    var token = jwt.sign(tokenData, RSA_PRIVATE_KEY, tokenOptions);
    return rp({
        uri: 'https://api.box.com/oauth2/token',
        method: 'POST',
        transform: function(body) {
            return JSON.parse(body);
        },
        form: {
            "grant_type": 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            "client_id": CLIENT_ID,
            'assertion': token,
            "client_secret": CLIENT_SECRET
        }
    });
};

function generateSharedLink(accessToken, fileId) {
    console.log('Generating a shared link for the file with id ' + fileId);
    
    return rp({
        uri: 'https://api.box.com/2.0/files/' + fileId,
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + accessToken
        },
        transform: function(body) {
            return JSON.parse(body);
        },
        body: JSON.stringify({
            "shared_link": {
                "access": "open"
            }
        })
    });
}

function postToChatService(post_data, context) {
    console.log('Sending shared link to the chat')
        // Create signed AWS request to API endpoint
    var req = new AWS.HttpRequest(endpoint);
    req.method = 'POST';
    req.port = '443';
    req.path = '/ZombieWorkshopStage/zombie/message';
    req.region = API.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = post_data;

    console.log('host is ' + endpoint.host);
    var signer = new AWS.Signers.V4(req, 'execute-api');
    signer.addAuthorization(creds, new Date());

    var send = new AWS.NodeHttpClient();

    send.handleRequest(req, null, function(httpResp) {
        var respBody = '';
        httpResp.on('data', function(chunk) {
            respBody += chunk;
        });
        httpResp.on('end', function(chunk) {
            console.log('Response: ' + respBody);
            context.succeed("Shared link to your file was sent to survivors. Message sent was: " + JSON.parse(post_data).message);
        });
    }, function(err) {
        console.log('Error: ' + err);
        context.fail('Lambda failed with error ' + err);
    });
}
