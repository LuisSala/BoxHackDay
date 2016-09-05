console.log('Starting create API Gateway script');
var AWS = require('aws-sdk');
var async = require('async');

var apigateway;
var restAPIId = '';
var currentResourceId = '';
var zombieResourceId = '';
var talkerResourceId = '';
var twilioResourceId = '';

var getmessagearn;
var postmessagearn;
var iamRole;
var apigatewayuuid;
var apiName;

// Variables for the callback...
var theEvent;
var theContext;
var theDoneCallback;

module.exports = {
	createGateway:function(event, context, doneCallback) {
        console.log('creating gateway, parameters passed in: ');
        console.log(event);

        theEvent = event;
        theContext = context;

        region = event.ResourceProperties.region;
        getmessagearn = event.ResourceProperties.getmessagelambdaapiuri;
        postmessagearn = event.ResourceProperties.postmessagelambdaapiuri;
        iamRole = event.ResourceProperties.iamrole;
        apigatewayuuid = event.StackId;
        apiName = event.ResourceProperties.apiname;

        AWS.config.update({region: region});
        apigateway = new AWS.APIGateway();

        theDoneCallback = doneCallback;

        createGatewayImplementation();
    }
}

function createGatewayImplementation() {
	// Asyncrhonous Steps that need to be done in order...
	async.waterfall([
        createRestAPI,
        getRootResourse,
        createZombieResource,
        createMessagesResource,
        createMethods,
        createMethodResponses,
        createTalkerResource,
        createTalkerMethods,
        createTalkerIntegrations,
        createTwilioResource,
        createTwilioMethods,
        createTwilioMethodResponses,
        createTwilioIntegrations,
        createTwilioIntegrationResponses,
        createIntegrations,
        createIntegrationResponses,
        createDeployment
    ],
	done);
}

function createRestAPI(callback) {
	console.log('Creating REST API');

	var params = {
        name: apiName,
        description: apigatewayuuid
    };
    apigateway.createRestApi(params, function(err, data) {
        if (!err) {
            restAPIId = data.id;
            return callback(null)
        }
        else {
            callback(err);
        }
    });
}

function getRootResourse(callback){
	console.log('Getting Root Resource');
	var params = {
        restApiId: restAPIId
	};
    apigateway.getResources(params, function(err, data) {
        if(!err) {
            currentResourceId = data.items[0].id;      // successful response
            return callback(null);
        }
        else {
            callback(err);
        }
    });
}

function createZombieResource(callback) {
	console.log('Creating Zombie Resource');
	  var params = {
			  parentId: currentResourceId, /* required */
			  pathPart: 'zombie', /* required */
			  restApiId: restAPIId /* required */
			};
			apigateway.createResource(params, function(err, data) {
			 if(!err)
			  {
				 currentResourceId = data.id;
				 zombieResourceId = data.id;
				 return callback(null);
			  }
			 else{ callback(err); }
			});
}
function createMessagesResource(callback) {
    console.log('Creating Message Resource');
	var params = {
        parentId: currentResourceId,
        pathPart: 'message',
        restApiId: restAPIId
    };
    apigateway.createResource(params, function(err, data) {
        if(!err) {
            currentResourceId = data.id;
            return callback(null);
        }
        else {
            callback(err);
        }
    });
}

function createMethods(callback) {
    console.log('Creating GET Method');
    //this method is going to chain the callbacks for the 3 methods to create...
    //we don't need to save the IDs from these calls.
	var params = {
        authorizationType: 'AWS_IAM', /* required */
        httpMethod: 'GET', /* required */
        resourceId: currentResourceId, /* required */
        restApiId: restAPIId, /* required */
        apiKeyRequired: false
    };
	apigateway.putMethod(params, function(err, data) {
        if(!err) {
            console.log('Creating POST Method');
            params.httpMethod = 'POST';
            apigateway.putMethod(params, function(err, data) {
                if(!err) {
				    console.log('Creating OPTIONS Method');
					params.httpMethod = 'OPTIONS';
                    params.authorizationType = 'None';
					apigateway.putMethod(params, function(err, data) {
						if(!err)
						{
							callback(null);
						}
						else{ callback(err); }
					});
                }
				else {
                    callback(err);
                }
            });
        }
		else {
            callback(err);
        }
    });
}

function createMethodResponses(callback) {
    console.log('Creating GET Method Response');
	var params = {
        httpMethod: 'GET', /* required */
        resourceId: currentResourceId, /* required */
        restApiId: restAPIId, /* required */
        statusCode: '200', /* required */
        responseModels: {
            'application/json': 'Empty',
        },
        responseParameters: {
			'method.response.header.Access-Control-Allow-Origin': true,
			'method.response.header.Access-Control-Allow-Headers': true,
			'method.response.header.Access-Control-Allow-Methods': true
        }
    };
    apigateway.putMethodResponse(params, function(err, data) {
        if(!err) {
            console.log('Creating POST Method Response');
            params.httpMethod = 'POST';
            apigateway.putMethodResponse(params, function(err, data) {
                if(!err) {
                    console.log('Creating OPTIONS Method Response');
                    params.httpMethod = 'OPTIONS';
                    /*
                    params.responseParameters = {
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Headers': true,
                        'method.response.header.Access-Control-Allow-Methods': true
                    };
                    */
                    apigateway.putMethodResponse(params, function(err, data) {
                        if(!err) {
                            callback(null);
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    callback(err);
                }
            });
        }
        else {
            callback(err);
        }
    });
}

function createIntegrations(callback) {
    console.log('Creating GET Integration');
	var params = {
        httpMethod: 'GET', /* required */
        resourceId: currentResourceId, /* required */
        restApiId: restAPIId, /* required */
        type: 'AWS', /* required */
        credentials: iamRole,
        integrationHttpMethod: 'POST',
        uri: getmessagearn,
	};
	apigateway.putIntegration(params, function(err, data) {
        if (!err) {
            console.log('Creating POST Integration');
            params.httpMethod = 'POST';
            params.uri = postmessagearn;
            params.requestTemplates = {
            "application/json": '{"message": $input.json(\'$.message\'), "name": $input.json(\'$.name\'), "channel" : $input.json(\'$.channel\') }'
            }
            apigateway.putIntegration(params, function(err, data) {
                if (!err) {
                    console.log('Creating OPTIONS Integration');
                    params.httpMethod = 'OPTIONS';
                    params.uri = null;
                    params.type = 'MOCK';
                    params.requestTemplates = {
                        "application/json": '{"statusCode": 200}'
                    };
                    apigateway.putIntegration(params, function(err, data) {
                        if (!err) {
                            callback(null);
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    callback(err);
                }
            });
        }
        else {
            callback(err);
        }
    });
}

function createIntegrationResponses(callback) {
	console.log('Creating GET Integration Response');
	var params = {
        httpMethod: 'GET', /* required */
        resourceId: currentResourceId, /* required */
        restApiId: restAPIId, /* required */
        statusCode: '200', /* required */
        responseParameters: {
		  'method.response.header.Access-Control-Allow-Origin': "'*'"
        },

        responseTemplates : {
            "application/json":'{#set($inputRoot = $input.path("$")) \
            "messages": [ \
            #set($index = $inputRoot.Items.size()) \
            #foreach($i in $inputRoot.Items) \
                #set($index = $index - 1) \
                #set($elem = $inputRoot.Items.get($index)) \
                { 									        \
                    "name": "$elem.name.S", 			\
                    "channel": "$elem.channel.S", 		\
                    "message": "$elem.message.S", 		\
                    "timestamp":"$elem.timestamp.N"		\
                } 									    \
                #if($foreach.hasNext),#end 				\
            #end 									\
            ]}'
        }
	};

	apigateway.putIntegrationResponse(params, function(err, data) {
        if(!err) {
            console.log('Creating POST Integration Response');
            params.httpMethod = 'POST';
            apigateway.putIntegrationResponse(params, function(err, data) {
                if(!err) {
                    console.log('Creating OPTIONS Integration Response');
                    params.httpMethod = 'OPTIONS';
                    params.responseParameters = {
                        'method.response.header.Access-Control-Allow-Origin': "'*'",
                        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'"
				    };
                    params.responseTemplates = {
                        "application/json":'{"statusCode": 200}'
                    };
                    apigateway.putIntegrationResponse(params, function(err, data) {
                        if(!err) {
                            callback(null);
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    callback(err);
                }
            });
        }
		else {
            callback(err);
        }
    });
}

function createDeployment(callback) {
    console.log('Creating Deployment');
	var params = {
        restApiId: restAPIId, /* required */
        stageName: 'ZombieWorkshopStage', /* required */
        cacheClusterEnabled: false,
        description: 'ZombieWorkshopStage deployment',
        stageDescription: 'ZombieWorkshopStage deployment'
	};
	apigateway.createDeployment(params, function(err, data) {
        if(!err) {
		  callback(null);
        }
        else {
            callback(err);
        }
	});
}

function createTalkerResource(callback) {
    console.log('Creating Talker Resource');
    var params = {
        parentId: zombieResourceId,
        pathPart: 'talkers',
        restApiId: restAPIId
    };
    apigateway.createResource(params, function(err, data) {
        if(!err) {
            talkerResourceId = data.id;
            return callback(null);
        }
        else {
            callback(err);
        }
    });
}

function createTalkerMethods(callback) {
    console.log('Creating GET Method');
	//this method is going to chain the callbacks for the 3 methods to create...
	//we don't need to save the IDs from these calls.
	var params = {
        authorizationType: 'AWS_IAM', /* required */
        httpMethod: 'GET', /* required */
        resourceId: talkerResourceId, /* required */
        restApiId: restAPIId, /* required */
        apiKeyRequired: false
    };
	apigateway.putMethod(params, function(err, data) {
        if(!err) {
            console.log('Creating POST Method');
			params.httpMethod = 'POST';
			apigateway.putMethod(params, function(err, data) {
                if(!err) {
                    console.log('Creating OPTIONS Method');
					params.httpMethod = 'OPTIONS';
                    params.authorizationType = 'None';
					apigateway.putMethod(params, function(err, data) {
                        if(!err) {
                            callback(null);
                        }
						else {
                            callback(err);
                        }
					});
                }
                else {
                    callback(err);
                }
            });
        }
        else {
            callback(err);
        }
    });
}

function done(err, status) {
    if(err) {
        console.log('There was an error with APIGW Create waterfall callback.');
        theDoneCallback(err, null);
	}
	else {
        console.log('Callback with rest ID of: ' + restAPIId);
        theDoneCallback(null, restAPIId);
	}
}

function createTalkerIntegrations(callback) {
    console.log('Creating GET Integration');
	var params = {
        httpMethod: 'GET', /* required */
        resourceId: talkerResourceId, /* required */
        restApiId: restAPIId, /* required */
        type: 'MOCK', /* required */
        credentials: iamRole,
        integrationHttpMethod: 'POST',
        uri: null,
        requestTemplates: {
            "application/json": '{"statusCode": 200}'
        }
	};
	apigateway.putIntegration(params, function(err, data) {
        if (!err) {
            console.log('Creating POST Integration');
            params.httpMethod = 'POST';
            apigateway.putIntegration(params, function(err, data) {
                if (!err) {
                    console.log('Creating OPTIONS Integration');
                    params.httpMethod = 'OPTIONS';
                    params.uri = null;
                    params.type = 'MOCK';
                    params.requestTemplates = {
                        "application/json": '{"statusCode": 200}'
                    };
                    apigateway.putIntegration(params, function(err, data) {
                        if (!err) {
                            callback(null);
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    callback(err);
                }
			});
        }
        else {
            callback(err);
        }
    });
}

function createTwilioResource(callback) {
    console.log('Creating Twilio Resource');
    var params = {
        parentId: zombieResourceId,
        pathPart: 'twilio',
        restApiId: restAPIId
    };
    apigateway.createResource(params, function(err, data) {
        if(!err) {
            twilioResourceId = data.id;
            return callback(null);
        }
        else {
            callback(err);
        }
    });
}

function createTwilioMethods(callback) {
	console.log('Creating Twilio POST Method');
	var params = {
        authorizationType: 'None', /* required */
        httpMethod: 'POST', /* required */
        resourceId: twilioResourceId, /* required */
        restApiId: restAPIId, /* required */
        apiKeyRequired: false
    };
	apigateway.putMethod(params, function(err, data) {
        if(!err) {
            console.log('Created Twilio POST Method');
            return callback(null);
        }
        else {
            callback(err);
        }
    });
}

function createTwilioMethodResponses(callback) {
    console.log('Creating Twilio POST Method Response');
	var params = {
        httpMethod: 'POST', /* required */
        resourceId: twilioResourceId, /* required */
        restApiId: restAPIId, /* required */
        statusCode: '200', /* required */
        responseModels: {
            'application/xml': 'Empty',
        }
    };
    apigateway.putMethodResponse(params, function(err, data) {
        if(!err) {
            console.log('Created Twilio POST Method Response');
            return callback(err);
        }
        else {
            callback(err);
        }
    });
}

function createTwilioIntegrations(callback) {
	console.log('Creating Twilio POST Integration');
    var params = {
        httpMethod: 'POST', /* required */
        resourceId: twilioResourceId, /* required */
        restApiId: restAPIId, /* required */
        type: 'MOCK', /* required */
        credentials: iamRole,
        integrationHttpMethod: 'POST',
        uri: null,
        requestTemplates: {
            "application/x-www-form-urlencoded": '{"postBody" : "$input.path(\'$\')"}'
        }
    };
    apigateway.putIntegration(params, function(err, data) {
        if (!err) {
            console.log('Created Twilio POST Integration');
            return callback(null);
        }
        else {
            callback(err);
        }
    });
}

function createTwilioIntegrationResponses(callback) {
    console.log('Creating Twilio POST Integration Response');
	var params = {
        httpMethod: 'POST', /* required */
        resourceId: twilioResourceId, /* required */
        restApiId: restAPIId, /* required */
        statusCode: '200', /* required */
        responseTemplates : {
            "application/xml": '#set($inputRoot = $input.path(\'$\'))<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>$inputRoot</Body></Message></Response>'
        }
	};

	apigateway.putIntegrationResponse(params, function(err, data) {
        if(!err) {
            console.log('Created Twilio POST Integration Response');
            return callback(null);
        }
        else {
            callback(err);
        }
    });
}
