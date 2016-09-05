'use strict';

/* == Imports == */
var fs = require('fs');
var rp = require('request-promise');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');

/* == Globals == */
var BOX_SUB_TYPES = {
    enterprise: 'enterprise',
    user: 'user'
};

var APP_USER_NAME = 'ZombieAppUser';

/* == Missing parameters information == */
var API_KEY = ''; // Insert application Api Key from Backend Parameters section
var CLIENT_ID = ''; // Insert application client_id from OAuth2 Parameters section
var CLIENT_SECRET = ''; // Insert application client_secret from OAuth2 Parameters section
var PUBLIC_KEY_ID = ''; // Insert application Public Key ID from Public Key Management section
var ENTERPRISE_ID = ''; // Insert Enterprise ID from Account Information section in Admin console under the business settings
var RSA_PRIVATE_KEY = ``;  // Insert your generated private key including  -----BEGIN RSA PRIVATE KEY----- and -----END RSA PRIVATE KEY-----

exports.handler = function(event, context, callback) {
    console.log('REQUEST RECEIVED:\n', JSON.stringify(event));

    var appUserId = "";
    console.log('Saving a file to  path ' + '/tmp/' + event.fileName + ' successful');
    fs.writeFile('/tmp/' + event.fileName, event.fileContent, 'base64', function(err) {
        if (err) {
            console.log('Error while saving file!');
        }
        requestToken(ENTERPRISE_ID, BOX_SUB_TYPES.enterprise)
            .then(function(enterpriseAccessTokenData) {
                return createUser(APP_USER_NAME, enterpriseAccessTokenData.access_token);
            }).then(function(userData) {
                appUserId = userData.id;
                return requestToken(userData.id, BOX_SUB_TYPES.user);
            }).then(function(userAccessTokenData) {
                return uploadFile('/tmp/' + event.fileName, event.fileName, userAccessTokenData.access_token)
            }).then(function(fileData) {
                context.succeed( {
                    fileId: fileData.entries[0].id,
                    appUserId: appUserId
                });
            }).catch(function(error) {
                console.log('There was an error ' + error.message);
            });
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
            "kid": API_KEY
        }
    };
    var tokenData = {
        "iss": PUBLIC_KEY_ID,
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
}

function createUser(userName, accessToken) {
    console.log('Creating an app user ' + userName);
    
    return rp({
        uri: 'https://api.box.com/2.0/users',
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + accessToken
        },
        transform: function(body) {
            return JSON.parse(body);
        },
        body: JSON.stringify({
            "name": userName,
            "is_platform_access_only": true
        })
    });
}

function uploadFile(filePath, fileName, accessToken) {
    console.log('Uploading file ' + fileName + ' to Box');

    var formData = {
        attributes: JSON.stringify({
            name: fileName,
            parent: {
                id: 0
            }
        }),
        file: fs.createReadStream(filePath),
    };

    return rp({
        uri: 'https://upload.box.com/api/2.0/files/content',
        method: 'POST',
        transform: function(body) {
            return JSON.parse(body);
        },
        headers: {
            Authorization: 'Bearer ' + accessToken
        },
        formData: formData
    });
}
