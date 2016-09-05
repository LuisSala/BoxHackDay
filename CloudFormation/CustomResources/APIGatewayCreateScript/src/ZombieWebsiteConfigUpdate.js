/**
 * This module writes the file out in the format needed for the website.
 * the S3 bucket/key and the url is passed in, and it writes the javascript file out.
 */
var AWS = require('aws-sdk');
module.exports = {
		updateConfig:function(region, s3key, s3bucketName, url, callback)
	{
		console.log('updating Zombie S3 web page located at: ' + s3key + ' and ' + s3bucketName);
		
		AWS.config.update({region: region});
		
		var s3bucket = new AWS.S3({params: {Bucket: s3bucketName}});
		s3bucket.createBucket(function() {
		  var params = {Key: s3key, Body: 'var MESSAGES_ENDPOINT = "' + url + '";'};
		  s3bucket.upload(params, function(err, data) {
		    if (err) {
		      callback(err);
		    } else {
		      callback(null);
		    }
		  });
		});
	}
}

