angular.module('chatApp.talkersPanel', [])
.controller('talkersPanelCtrl', function($scope, $rootScope, $resource, $timeout) {

    $rootScope.$on("chatting", function() {
        var poll = function() {
            $timeout(function() {
                if($rootScope.chatting) {
                    console.log('Retrieving Talkers from Server');
                
                    var apigClient = apigClientFactory.newClient({
                        region: AWS_REGION, // OPTIONAL: The region where the API is deployed, by default this parameter is set to us-east-1
                        accessKey: AWS.config.credentials.accessKeyId,
                        secretKey: AWS.config.credentials.secretAccessKey, 
                        sessionToken: AWS.config.credentials.sessionToken
                    });

                    var body = '';

                    var params = '';
                    var additionalParams = '';
            

                    apigClient.zombieTalkersGet(params, body, additionalParams)
                        .then(function(result){
                            if($rootScope.chatting) {
                                console.log('talkers are: ' + result.data.Talkers);
                                $scope.talkers = result.data.Talkers;
                                
                            } else {
                                $scope.talkers = null;
                            }
                        }).catch(function(error){
                            console.log('error: ' + error.data);
                        });
                    
                    poll();
                }
            }, 1000);
        };
        poll();
    });
    $rootScope.$on("not chatting", function() {
        //clear our model, which will clear out the messages from the panel
     		$scope.talkers = null;
    });

});
