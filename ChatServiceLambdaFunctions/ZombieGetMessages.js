console.log('Loading function');
var aws = require('aws-sdk');
var ddb;

var theContext;

function dynamoCallback(err, response) {
    if (err) {
        console.log('error' + err, err.stack); // an error occurred
        theContext.fail(err);
    }

    else {
        console.log('result: ' + JSON.stringify(response))        // successful response
        theContext.succeed(response);
    }
}

function init(context) {
  if(!ddb) {
    var stackName = context.functionName.split('-z0mb1es-')[0];
    var stackRegion = context.functionName.split('-GetMessagesFromDynamoDB-')[1];
    ddb = new aws.DynamoDB({
      region: stackRegion,
      params: { TableName: stackName + "-messages" }
    });
  }
}

exports.handler = function(event, context) {
    init(context);
    theContext = context;
    var params = {
        "KeyConditions": {
            "channel": {
                "AttributeValueList": [{
                    "S": "default"
                }],
                "ComparisonOperator": "EQ"
            }
        },
        "Limit": 20,
            "ScanIndexForward":false
    }
    console.log("Querying DynamoDB");
    var response = ddb.query(params, dynamoCallback);
}