var aws = require('aws-sdk');
var iamCreate = require('./create.js');
var iamDelete = require('./delete.js');
var cloudformationsender = require('./cloudformationsender.js');

var region;
var theEvent;
var theContext;
var groupName;
var stackName;

exports.handleIAM = function(event, context) {
	theEvent = event;
	theContext = context;
    
    region = event.ResourceProperties.region;
    aws.config.update({region: region});
	
    if(event.RequestType == 'Create') {
       stackName = event.ResourceProperties.StackName;
       groupName = stackName + '-IamGroup';
       
       iamCreate.createIAM(event, context, finishedCreatingCallback);
	}
    else if(event.RequestType == 'Delete') {
        iamDelete.deleteIAM(event, context, finishedDeletingCallback);
	}
	else {
        console.log(event);
        console.log('Event is not a create or delete, send success');
        cloudformationsender.sendResponse(event, context, "SUCCESS", {});
	}
}

/**
 * Callback function for the IAM creation which should have 3 params coming in.
 */
function finishedCreatingCallback(err, usersForCloudFormation, IAMuserPassword, groupName) {
    if(err) {
        cloudformationsender.sendResponse(theEvent, theContext, "FAILED", {});
	}
	else {	
	   cloudformationsender.sendResponse(theEvent, theContext, "SUCCESS", {
            "IamPassword": IAMuserPassword,
            "Users": usersForCloudFormation,
            "IamGroup": groupName 
        });
    }
}

/**
 * Callback function for the IAM deletion, no params.
 */
function finishedDeletingCallback(err) {
    if(err) {
        cloudformationsender.sendResponse(theEvent, theContext, "FAILED", {});
	}
	else {
        cloudformationsender.sendResponse(theEvent, theContext, "SUCCESS", {});
	}
}