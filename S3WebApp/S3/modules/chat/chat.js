angular.module('chatApp.chat', ['chatApp.utils'])
.controller('ChatCtrl', function($rootScope, $scope, $state, $_, $http) {

    $scope.chatState = "Start Chatting";
    $rootScope.chatuser = {
        name: "",
        phone: "",
        email: ""
    };

    var data = {
        UserPoolId : USER_POOL_ID,
        ClientId : CLIENT_ID
    };
    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(data);
    var cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, session) {
            if (err) {
                $scope.signout();
                return;
            }
            console.log('session validity: ' + session.isValid());
            cognitoUser.getUserAttributes(function(err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                var nm = $_.where(result, { Name: "name" });
                if (nm.length > 0) {
                    $rootScope.chatuser.name = nm[0].Value;
                }

                var ph = $_.where(result, { Name: "phone_number" });
                if (ph.length > 0) {
                    $rootScope.chatuser.phone = ph[0].Value;
                }

                var em = $_.where(result, { Name: "email" });
                if (em.length > 0) {
                    $rootScope.chatuser.email = em[0].Value;
                }
                $scope.$apply();

            });
        });
    }


    var login = function() {
        $rootScope.chatting = true;
        $rootScope.$emit('chatting');
        $scope.chatState = "Stop Chatting";
        
    };

    var logoff = function() {
        $scope.chatState = "Start Chatting";
        $rootScope.chatting = false;
        $rootScope.$emit('not chatting');
    };

    $scope.toggleChatting = function() {
        if($rootScope.chatting) {
            logoff();
        } else {
            login();
        }
    };

    $scope.signout = function() {
        if (cognitoUser != null) {
            console.log("logging user out");
            $scope.chatState = "Start Chatting";
            $rootScope.chatting = false;
            $rootScope.$emit('not chatting');
            cognitoUser.signOut();
            AWS.config.credentials.clearCachedId();
            $state.go('signin', { });
        }
    };
    
    // Box
    var apigClient = apigClientFactory.newClient({
        region: AWS_REGION,
        accessKey: AWS.config.credentials.accessKeyId,
        secretKey: AWS.config.credentials.secretAccessKey,
        sessionToken: AWS.config.credentials.sessionToken
    });
    
    $scope.uploadFile = function(event) {
        var file = event.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', function () {
            var result = reader.result.split(',')[1];
            var name = $rootScope.chatuser.name + ' (' + $rootScope.chatuser.email + ')';
            apigClient.uploadFileToBox({}, {fileName: file.name, fileContent: result}).then(function(response) {
                apigClient.getBoxSharedLinkForFile(null, {fileId:response.data.fileId, userName: name, appUserId: response.data.appUserId});
            });
        });
        reader.readAsDataURL(file);
    };
});
