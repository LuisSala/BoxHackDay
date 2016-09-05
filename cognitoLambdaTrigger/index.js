"use strict";
console.log('Loading function');
var AWS = require('aws-sdk');
var moment = require('moment');

exports.handler = function(event, context, callback) {
    console.log(event);
    // set the appropriate region for AWS api calls
    const stackName = context.functionName.split('-CognitoLambdaTrigger')[0];
    console.log('stackname is: ' + stackName);

    const region = context.functionName.split('-CognitoLambdaTrigger-')[1]; // The region containing the DDB table that should be queried.
    console.log('stack region is: ' + region);
    const dynamoConfig = {
        sessionToken: process.env.AWS_SESSION_TOKEN,
        region: region
    };
    const docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
    const ddbTable = stackName + '-users';
    console.log('ddbtable is: ' + ddbTable);

    let params = {};

    if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
        console.log(event.request.userAttributes['phone_number']);
        params = {
            TableName: ddbTable,
            Item: {
                userid: event.userName,
                phone: event.request.userAttributes['phone_number']
            }
        };
        
        docClient.put(params, function(err, data) {
            if (err) {
                console.log(err);
                return callback(err, null);
            }
            return callback(null, event);
        });

    } else if (event.triggerSource === "PreAuthentication_Authentication") {
        params = {
            TableName: ddbTable,
            Key: { userid : event.userName },
            UpdateExpression: 'set camp = :c, slackuser = :s, confirmed = :v, slackteamdomain = :t',
            ExpressionAttributeValues: {
                ':c' : event.request.userAttributes['custom:camp'],
                ':s' : event.request.userAttributes['custom:slackuser'] ? event.request.userAttributes['custom:slackuser'] : "null",
                ':t' : event.request.userAttributes['custom:slackteamdomain'],
                ':v' : event.request.userAttributes['email_verified']
            },
            ReturnValues:"UPDATED_NEW"
        };
        docClient.update(params, function(err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                return callback(err, null);
            } else {
                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                return callback(null, event);
            }
        });
    } else {
        // not a valid trigger source
        return callback("Invalid trigger source.", null);
    }


};
