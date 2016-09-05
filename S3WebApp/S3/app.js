var app = angular.module("chatApp",
    ['ui.router',
    'ngResource',
    'ngMessages',
    'ngSanitize',
    'chatApp.signin',
    'chatApp.signup',
    'chatApp.confirm',
    'chatApp.chat',
    'chatApp.chatPanel',
    'chatApp.talkersPanel',
    'chatApp.chatMessages']
);

app.config(function($stateProvider, $urlRouterProvider) {

    AWSCognito.config.region = COGNITO_REGION;
    AWSCognito.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IDENTITY_POOL_ID
    });
    AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'})

    var creds = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IDENTITY_POOL_ID
    });
    AWS.config.region = COGNITO_REGION;
    AWS.config.credentials = creds;

    $stateProvider

    .state('signin', {
        url: '/signin',
        views: {
            '' : {
                templateUrl: 'modules/signin/signin.html',
                controller: 'SigninCtrl'
            }
        }
    })

    .state('signup', {
        url: '/signup',
        views: {
            '' : {
                templateUrl: 'modules/signup/signup.html',
                controller: 'SignupCtrl'
            }
        }
    })

    .state('confirm', {
        url: '/confirm',
        views: {
            '' : {
                templateUrl: 'modules/confirm/confirm.html',
                controller: 'ConfirmCtrl'
            }
        }
    })

    .state('chat', {
        url: '/chat',
        views: {
            '' : {
                templateUrl: 'modules/chat/chat.html',
                controller: 'ChatCtrl'
            },
            'chatPanel@chat' : {
                templateUrl: 'modules/chat/chatPanel.html',
                controller: 'chatPanelCtrl'
            },
            'talkersPanel@chat' : {
                templateUrl: 'modules/chat/talkersPanel.html',
                controller: 'talkersPanelCtrl'
            },
            'chatMessages@chat' : {
                templateUrl: 'modules/chat/chatMessages.html',
                controller: 'chatMessageCtrl'
            }
        }
    });

    $urlRouterProvider.otherwise('/signin');

});

var apigClientFactory = {};
apigClientFactory.newClient = function (config) {
    var apigClient = { };
    if(config === undefined) {
        config = {
            accessKey: '',
            secretKey: '',
            sessionToken: '',
            region: '',
            apiKey: undefined,
            defaultContentType: 'application/json; charset=UTF-8',
            defaultAcceptType: 'application/json; charset=UTF-8'
        };
    }
    if(config.accessKey === undefined) {
        config.accessKey = '';
    }
    if(config.secretKey === undefined) {
        config.secretKey = '';
    }
    if(config.apiKey === undefined) {
        config.apiKey = '';
    }
    if(config.sessionToken === undefined) {
        config.sessionToken = '';
    }
    if(config.region === undefined) {
        config.region = AWS_REGION;
    }
    //If defaultContentType is not defined then default to application/json
    if(config.defaultContentType === undefined) {
        config.defaultContentType = 'application/json; charset=UTF-8';
    }
    //If defaultAcceptType is not defined then default to application/json
    if(config.defaultAcceptType === undefined) {
        config.defaultAcceptType = 'application/json; charset=UTF-8';
    }

    
    // extract endpoint and path from url
    var invokeUrl = MESSAGES_ENDPOINT;
    var endpoint = /(^https?:\/\/[^\/]+)/g.exec(invokeUrl)[1];
    var pathComponent = invokeUrl.substring(endpoint.length);
    
    var sigV4ClientConfig = {
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        sessionToken: config.sessionToken,
        serviceName: 'execute-api',
        region: config.region,
        endpoint: endpoint,
        defaultContentType: config.defaultContentType,
        defaultAcceptType: config.defaultAcceptType
    };

    var authType = 'NONE';
    if (sigV4ClientConfig.accessKey !== undefined && sigV4ClientConfig.accessKey !== '' && sigV4ClientConfig.secretKey !== undefined && sigV4ClientConfig.secretKey !== '') {
        authType = 'AWS_IAM';
    }

    var simpleHttpClientConfig = {
        endpoint: endpoint,
        defaultContentType: config.defaultContentType,
        defaultAcceptType: config.defaultAcceptType
    };

    var apiGatewayClient = apiGateway.core.apiGatewayClientFactory.newClient(simpleHttpClientConfig, sigV4ClientConfig);
    
    
    
    apigClient.zombieMessageGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieMessageGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/message').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(zombieMessageGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.zombieMessagePost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieMessagePostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/message').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(zombieMessagePostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.zombieMessageOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieMessageOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/message').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(zombieMessageOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.zombieTalkersGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieTalkersGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/talkers').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(zombieTalkersGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.zombieTalkersPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieTalkersPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/talkers').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(zombieTalkersPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.zombieTalkersOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieTalkersOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/talkers').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(zombieTalkersOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    // Box
    apigClient.getBoxSharedLinkForFile = function (params, body, additionalParams) {
        if(additionalParams === undefined) {additionalParams = {}; }
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieBoxPostRequest = {
            verb: 'put'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/box').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        return apiGatewayClient.makeRequest(zombieBoxPostRequest, authType, additionalParams, config.apiKey);
    };
    
    apigClient.uploadFileToBox = function (params, body, additionalParams) {
        if(additionalParams === undefined) {additionalParams = {}; }
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieBoxPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/box').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Content-Type']),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        return apiGatewayClient.makeRequest(zombieBoxPostRequest, authType, additionalParams, config.apiKey);
    };
    
    /*
    apigClient.zombieTwilioPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var zombieTwilioPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/zombie/twilio').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(zombieTwilioPostRequest, authType, additionalParams, config.apiKey);
    };
    */
    

    return apigClient;
};





var compareTo = function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
};

app.directive("compareTo", compareTo);
