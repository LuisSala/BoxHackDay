var aws = require('aws-sdk');
var async = require('async');
var iam;

// Variables for the callback...
var theEvent;
var theContext;
var theDoneCallback;

var stackName;
var groupName;
var IAMuserPassword = "0Sa$3mJCC8xY";
var numIamUsers;                        // num users requested from cfn
var requestedUserCountArray = [];       // numIamUsers split and counted
var usersCreatedArray = [];             // Hold our created usernames

module.exports = {
    createIAM:function(event, context, doneCallback) {
        console.log(event);
        
        theEvent = event;
        theContext = context;
        
        stackName = event.ResourceProperties.StackName;
        groupName = stackName + '-IamGroup';
        numIamUsers = event.ResourceProperties.IamUsers;
        
        iam = new aws.IAM();
        
        theDoneCallback = doneCallback;
        
        pushUsers(numIamUsers); 
        createUsersImplementation();
    }
}

function createUsersImplementation() {
    async.series([
        createIamGroup,
        createUsers
    ], done);    
}

function createIamGroup (callback) {
    console.log('Creating IAM Group');
    var params = {
        GroupName: groupName
    };
    iam.createGroup(params, function(err, data) {
        if (err) {
            console.log('Error creating group')
            return callback(err);
        } else {
            console.log('Created IAM Group ' + params.GroupName);
            callback(null, params.GroupName);
        }
    }); 
}

function createUsers (callback) {
    async.forEachLimit(requestedUserCountArray, 1, function(item, callback) {
        async.waterfall([
            async.apply(userCreate, item), 
            userAddToGroup,
            userCreateLoginProfile
        ], function (err, data) {
                if (err) {
                    return callback(err);
                } else{
                    console.log('Done creating user');
                    callback(null);   
                }
        });   
    }, function(err){
        if (err) {
            return callback(err);
        } else {
            callback(null);
        }
    });   
}

function userCreate(user, callback){
    console.log('Creating user ' + user);
    var params = {
        UserName: stackName + "-user-" + user
    };
    iam.createUser(params, function(err, data){
        if (err) {
            console.log('Error creating user')
            return callback(err);
        } else {
            console.log('Created user ' + params.UserName);
            callback(null, params.UserName);
        }
    }); 
}

function userAddToGroup(user, callback){        
    var params = {
        GroupName: groupName,
        UserName: user
    };
    iam.addUserToGroup(params, function(err, data) {
        if (err) {
            console.log('Error adding user to group')
            return callback(err);
        } else {     
            console.log('Added user ' + params.UserName + ' to IAM group.');
            callback(null, params.UserName);
        }
    });  
}

function userCreateLoginProfile(user, callback){
    console.log('Creating login profile for ' + user);
    var params = {
        Password: IAMuserPassword,
        UserName: user,
        PasswordResetRequired: false
    };
    iam.createLoginProfile(params, function(err, data) {
        if (err) {
            console.log('Error creating login profile for user');
            return callback(err);
        } else {
            console.log('Created login profile for ' + params.UserName);
            usersCreatedArray.push(params.UserName);
            callback(null);
        }
    });   
}

/**
 * Create incrementing user numbers. 
 * Take numIamUsers from CFN and turn it into an array of numbers counting from 1.
 */
function pushUsers(numIamUsers) {
    for (var k = 1; k<=numIamUsers; k++) {
        requestedUserCountArray.push(k);
    }
}

function done(err, status) {
    if(err) {
        return theDoneCallback(err, null);
    } else {
        theDoneCallback(null, usersCreatedArray.toString(), IAMuserPassword, groupName); // pass back params for CFN output
	}
}