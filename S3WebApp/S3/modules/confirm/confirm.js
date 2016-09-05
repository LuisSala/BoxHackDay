angular.module('chatApp.confirm', [])
.controller('ConfirmCtrl', function($scope, $state) {

    $scope.errormessage = "";

    $scope.user = {
        email: "",
        confirmCode: ""
    };

    $scope.confirmAccount = function(isValid) {
        console.log($scope.user);
        var _username = $scope.user.email;
        if (isValid) {
            console.log("Confirmation code " + $scope.user.confirmCode);

            var poolData = {
                UserPoolId : USER_POOL_ID,
                ClientId : CLIENT_ID
            };

            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
            var userData = {
                Username : _username,
                Pool : userPool
            };

            var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
            cognitoUser.confirmRegistration($scope.user.confirmCode, true, function(err, result) {
                if (err) {
                    console.log(err);
                    $scope.errormessage = "An unexpected error has occurred. Please try again. Error: " + err;
                    $scope.$apply();
                    return;
                }
                console.log('call result: ' + result);
                $state.go('signin', { });
            });

        } else {
            $scope.errormessage = "There are still invalid fields.";
            console.log("There are still invalid fields");
        }
    };

});
