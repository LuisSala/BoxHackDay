angular.module('chatApp.signin', ['chatApp.utils'])
.controller('SigninCtrl', function($scope, $state, $localstorage) {

    $scope.errormessage = "";

    $scope.user = {
        email: "",
        password: ""
    };

    $scope.signin = function(isValid) {
        //console.log($scope.user);
        if (isValid) {

            var authenticationData = {
                Username : $scope.user.email,
                Password : $scope.user.password,
            };
            var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
            var poolData = {
                UserPoolId : USER_POOL_ID,
                ClientId : CLIENT_ID
            };
            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
            var userData = {
                Username : $scope.user.email,
                Pool : userPool
            };
            var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
            try {
                cognitoUser.authenticateUser(authenticationDetails, {
                    onSuccess: function (result) {
                        console.log(result);
                        console.log('access token + ' + result.getAccessToken().getJwtToken());
                        console.log(cognitoUser);

                        var login = 'cognito-idp.' + COGNITO_REGION + '.amazonaws.com/' + USER_POOL_ID;

                        console.log('login string is: ' + login);
                        
                        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                            IdentityPoolId : IDENTITY_POOL_ID, // your identity pool id here
                            IdentityId: AWS.config.credentials.identityId
                        });
                        AWS.config.credentials.params.Logins = {};
                        AWS.config.credentials.params.Logins[login] = result.getIdToken().getJwtToken();

                        //console.log('aws config is: ' + AWS.config.credentials.params.Logins[login]);

                        AWS.config.credentials.refresh(function (err) {
                            // now using authenticated credentials
                            if(err)
                            {
                              console.log('Error in authenticating to AWS '+ err);

                              // Call error if we can't assume authenticated role.
                              $scope.errormessage = "Unable to sign in user. There was an error authenticating to identity provider.";
                              $scope.$apply();

                            }
                            else
                            {
                              console.log('identityId is: ' + AWS.config.credentials.identityId);
                              var awstoken = {
                                expireTime: AWS.config.credentials.expireTime,
                                accessKeyId: AWS.config.credentials.accessKeyId,
                                sessionToken: AWS.config.credentials.sessionToken,
                                secretAccessKey: AWS.config.credentials.secretAccessKey
                              };
                              $localstorage.setObject('awstoken', awstoken);
                              $state.go('chat', { }); // if all went well then log them in.

                            }
                        });
                    },


                    onFailure: function(err) {
                        console.log(err);
                        $scope.errormessage = "Unable to sign in user. Please check your username and password.";
                        $scope.$apply();
                    }

                });
            } catch(e) {
                console.log(e);
            }
        } else {
            $scope.errormessage = "There are still invalid fields.";
            console.log("There are still invalid fields");
        }
    };

});
