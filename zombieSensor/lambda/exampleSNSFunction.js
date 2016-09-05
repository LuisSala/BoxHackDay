/* == Imports == */
var querystring = require('querystring');
var AWS = require('aws-sdk');
var path = require('path');

/* == Globals == */
var API = {
    region: 'INSERT YOUR REGION CODE HERE', //i.e 'us-east-1'
    endpoint: 'INSERT YOUR API GATEWAY URL HERE INCLUDING THE HTTPS://'
};

var endpoint = new AWS.Endpoint(API.endpoint);
var creds = new AWS.EnvironmentCredentials('AWS');

exports.handler = function(event, context) {
    
    var params = querystring.parse(event.postBody);
    var from = params.From;
    var timestamp = "" + new Date().getTime();
    var numMedia = params.NumMedia;
    var message;
    var mediaURL;
    var phoneAuthorized = false; //will set to true when incoming phone is validated

    //console.log('Received event:', JSON.stringify(event, null, 2));
    var snsData = JSON.parse(event.Records[0].Sns.Message);
    console.log('From SNS:', snsData);
    
    var message = snsData.message;

    var post_data = JSON.stringify({
            "message": message, 
            "name": "SYSTEM ALERT", 
            "channel": "default"
            
    });

    postToChatService(post_data, context);    
    
}

function postToChatService(post_data, context) {
    var req = new AWS.HttpRequest(endpoint);

    req.method = 'POST';
    req.path = '/ZombieWorkshopStage/zombie/message';
    req.port = '443';
    req.region = API.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = post_data;
    
    console.log('host is ' + endpoint.host);
    var signer = new AWS.Signers.V4(req,'execute-api');  // es: service code
    signer.addAuthorization(creds, new Date());

    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        var respBody = '';
        httpResp.on('data', function (chunk) {
            respBody += chunk;
        });
        httpResp.on('end', function (chunk) {
            console.log('Successfully processed HTTPS response');
            context.succeed('Alert delivered: ' + JSON.parse(post_data).message);
        });
    }, function(err) {
        console.log('Error: ' + err);
        context.fail('Lambda failed with error ' + err);
    });
}