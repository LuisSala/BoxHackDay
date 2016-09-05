var AWS = require('aws-sdk');

var apigateway;
var apigatewayuuid;

module.exports = {
		deleteGateway:function(event, context, callback)
	{
		console.log('deleting gateway, parameters passed in: ');
		console.log(event);
		
		region = event.ResourceProperties.region;
		apigatewayuuid = event.StackId;
		
		AWS.config.update({region: region});
		apigateway = new AWS.APIGateway();
		
		deleteGatewayImplementation(callback);
	}
}

function deleteGatewayImplementation(callback)
{
	var params = {};
	apigateway.getRestApis(params, function(err, data) {
	  if (!err)
	  {
		  console.log('finding api gateway in list');
		  for (var i = 0; i < data.items.length; i++) 
		  {
			  if(data.items[i].description == apigatewayuuid)
			  {
				  	console.log('found gateway, deleting...');
				  	var params = {
					  restApiId: data.items[i].id
					};
					apigateway.deleteRestApi(params, function(err, data) {
					  if (!err)
					  {
						  console.log('successfully deleted api gateway');
						  callback(null);
						  
					  }
					  else
					  {
						  callback(err);
					  }
					}); 
			  }
		  }
	  }
	  else
	  {
		  console.log(err, err.stack); 
		  callback(err);
	  }
	});
}                
