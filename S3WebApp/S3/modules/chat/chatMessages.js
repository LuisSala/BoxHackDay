angular.module('chatApp.chatMessages', [])
.controller('chatMessageCtrl', function($scope, $rootScope, $resource) {

    $scope.chatPlaceholder = "Save your brains, start chatting!";
    $scope.chatMessage = null;

    $rootScope.$on("chatting", function() {
        $scope.chatPlaceholder = "Enter a message and save humanity";
    });
    $rootScope.$on("not chatting", function() {
        $scope.chatMessage = null;
        $scope.chatPlaceholder = "Save your brains, start chatting!";
    });

    $scope.lastTalking = new Date;

    $scope.chatMessageKeyPressed = function(keyEvent) {

        var apigClient = apigClientFactory.newClient({
            region: AWS_REGION, // OPTIONAL: The region where the API is deployed, by default this parameter is set to us-east-1
            accessKey: AWS.config.credentials.accessKeyId,
            secretKey: AWS.config.credentials.secretAccessKey, 
            sessionToken: AWS.config.credentials.sessionToken
        });
        
        if (keyEvent.which === 13) {
            $scope.posting = true;
            console.log('Sending Message: ' + $scope.chatMessage);

            var body = {
                channel: 'default',
                name: [$rootScope.chatuser.name, " (", $rootScope.chatuser.email, ")"].join(""),
                message: $scope.chatMessage
            };

            var params = '';
            var additionalParams = '';

            apigClient.zombieMessagePost(params, body, additionalParams)
                .then(function(result){
                //This is where you would put a success callback
                    console.log('Message sent to database');
                    console.log ('user email is ' + $rootScope.chatuser.email);
                    $scope.chatMessage = null;
                    $scope.posting = false;
                    $scope.chatPlaceholder = "Enter a message and save humanity";
                }).catch( function(result){
                    console.log('there was an error POSTing');
                });


        } else {
            var diff = Date.now() - $scope.lastTalking;
            console.log(diff);

            // send talking update at max every .5 seconds
            if (diff < 500) {
                return;
            }

            var talkersBody = {
                channel: 'default',
                name: $rootScope.chatuser.name
            };

            var talkersParams = '';
            var talkersAdditionalParams = '';

            apigClient.zombieTalkersPost(talkersParams, talkersBody, talkersAdditionalParams)
                .then(function(result){
                    console.log('Posting to talkers.');
                    $scope.lastTalking = new Date;
                }).catch( function(result){
                });
        }
    };

});
