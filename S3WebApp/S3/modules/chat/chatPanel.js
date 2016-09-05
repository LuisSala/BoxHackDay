angular.module('chatApp.chatPanel', ['chatApp.chatMessages','ngSanitize'])
.controller('chatPanelCtrl', function($scope, $rootScope, $resource, $timeout) {

    $rootScope.$on("chatting", function() {
        var Messages = $resource(MESSAGES_ENDPOINT);

        var poll = function()
        {
            $timeout(function() {
                if($rootScope.chatting) 
                {
                    console.log('Retrieving Messages from Server');

                    var apigClient = apigClientFactory.newClient({
                        region: AWS_REGION, // OPTIONAL: The region where the API is deployed, by default this parameter is set to us-east-1
                        accessKey: AWS.config.credentials.accessKeyId,
                        secretKey: AWS.config.credentials.secretAccessKey, 
                        sessionToken: AWS.config.credentials.sessionToken
                    });

                    var body = '';

                    var params = '';
                    var additionalParams = '';
            

                    apigClient.zombieMessageGet(params, body, additionalParams)
                        .then(function(result){
                            if($rootScope.chatting) {
                                //console.log('result: ' + result.data.messages);
                                
                                //Format URLs as HREFs
                                var index=0;
                                for (index in result.data.messages) {
                                    var messageItem = result.data.messages[index];
                                    if (messageItem!==undefined && messageItem.message.startsWith('http')) {
                                        var newMessage = '<a href="'+messageItem.message+'" target="_new">'+messageItem.message+'</a>';
                                        result.data.messages[index].message=newMessage;
                                    }
                                }
                                
                                $scope.messages = result.data.messages;
                                
                            } else {
                                $scope.messages = null;
                            }
                        }).catch(function(result){
                            console.log('error: ' + result);
                        });
                    
                    poll();
                }
            }, 2000);
        };
        poll();
    });

    $rootScope.$on("not chatting", function() {
        //clear our model, which will clear out the messages from the panel
        $scope.messages = null;
    });

});
