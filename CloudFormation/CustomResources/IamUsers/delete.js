var aws = require('aws-sdk');
var async = require('async');
var iam;

var groupObject;
var groupName;
var stackName; 

// Variables for the callback...
var theEvent;
var theContext;
var theDoneCallback;


module.exports = {
    deleteIAM:function(event, context, doneCallback) {
        console.log('Deleting users');
        theEvent = event;
        theContext = context;

        stackName = event.ResourceProperties.StackName;
        groupName = stackName + '-IamGroup';
        
        iam = new aws.IAM();
        theDoneCallback = doneCallback;
        
        deleteUsersImplementation(groupName);       
    }    
}

function deleteUsersImplementation(groupName) {
    async.waterfall([
        async.apply(getGroupUsers, groupName),
        deleteUsers,
        deleteGroup
    ], done);    
}

function getGroupUsers(groupName, callback) {
    var params = {
        GroupName: groupName
    };
    var usersToDelete = [];
    iam.getGroup(params, function(err, data) {
        if (err) {
            console.log('Error getting group');
            return callback(err);
        } else {
            groupObject = data.Users;
            groupName = data.Group.GroupName;
            
            for (var obj in groupObject) {
                var userName = groupObject[obj]['UserName'];
                console.log('UserName is ' + userName);
                usersToDelete.push(userName);  
            }
            callback(null, usersToDelete, params.GroupName);
        }
    });    
}

function deleteUsers (usersToDelete, groupName, callback) {
    async.forEachLimit(usersToDelete, 1, function(item, callback) {
        async.waterfall([
            async.apply(removeUserFromGroup, item, groupName),
            removeUserLoginProfile,
            deleteIamUser,  
        ], function (err, data) {
            if (err) {
                console.log('Error occurred deleting user');
                return callback(err);
            } else {
                callback(null);
            }
        });
    }, function(err, data){
        if (err) {
            console.log('Error in deleteusers function.');
            return callback(err);
        } else {
            callback(null, groupName);
        }
    }); 
}

function removeUserFromGroup(user, groupName, callback) {
    console.log('Removing user ' + user + ' from group');
    var params = {
        GroupName: groupName,
        UserName: user
    };
    iam.removeUserFromGroup(params, function(err, data) {
        if (err) {
            console.log('Error removing user from group');
            return callback(err);
        } else {
            console.log('Removed IAM user ' + params.UserName);
            callback(null, params.UserName);
        }
    }); 
}

function removeUserLoginProfile(user, callback){
    console.log('Removing login profile for ' + user);
    var params = {
        UserName: user
    };
    iam.deleteLoginProfile(params, function(err, data) {
        if (err) {
            console.log('Error deleting login profile for user');
            return callback(err);
        } else {
            console.log('Removed login profile for user: ' + params.UserName);
            callback(null, params.UserName);
        }                           
    });    
}

function deleteIamUser(user, callback){        
    console.log('Deleting user ' + user);
    var params = {
        UserName: user
    };
    iam.deleteUser(params, function(err, data) {
        if (err) {
            console.log('Error deleting user');
            return callback(err);
        } else {
            console.log('Deleted IAM user ' + params.UserName);
            callback(null);
        }
    });  
}

function deleteGroup(groupName, callback) {
    var params = {
        GroupName: groupName
    };
    iam.deleteGroup(params, function(err, data) {
        if (err) {
            console.log('Error deleting IAM group'); 
            return callback(err);
        } else {
            console.log('IAM Group deleted: ' + params.GroupName); 
            callback(null);  
        }
    });
}

function done(err, status) {
    if(err) {
        return theDoneCallback(err);
    } else {
        theDoneCallback(null);
	}
}