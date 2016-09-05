var AWS = require('aws-sdk');
var async = require('async');

exports.handler = function(event, context) {
  console.log('REQUEST RECEIVED:\n', JSON.stringify(event));

  // Set region to the destination region where the user's bucket is hosted.
  //aws.config.update({region: event.ResourceProperties.S3Region})
  var responseData = {};
  var responseStatus = "FAILED";  // Start out with response of FAILED until we confirm SUCCESS explicitly.

  var srcS3Bucket = event.ResourceProperties.BucketName;  // S3 bucket where AWS has hosted the lab content
  var dstS3Bucket = event.ResourceProperties.WebsiteBucketCreatedEarlier;
  var s3Region = event.ResourceProperties.S3Region;
  var s3 = new AWS.S3({params: {Bucket: srcS3Bucket}, region: s3Region});

  // CloudFormation cannot delete S3 bucket if there are objects in it.
  // If DELETE request type is sent, delete the objects out of the user's bucket, then log SUCCESS so Cloudformation can proceed.
  if (event.RequestType == "Delete") {
    var params = {
      Bucket: dstS3Bucket
    }

    s3.listObjects(params, function(err, data) {
      if (err) {
        responseData = {Error: 'Failed to get objects from bucket for deletion.'};
        console.log(responseData.Error + ':\\n', err);
      }

      params = {Bucket: dstS3Bucket};
      params.Delete = {};
      params.Delete.Objects = [];

      data.Contents.forEach(function(content) {
        params.Delete.Objects.push({Key: content.Key});
      });

      s3.deleteObjects(params, function(err, data) {
        if (err) {
          responseData = {Error: 'Failed to delete an object from bucket.'};
          console.log(responseData.Error + ':\\n', err);
        }
        else {
          console.log(data);
          responseStatus = "SUCCESS";
        }
        sendResponse(event, context, responseStatus, responseData);
      });
    });
  }

  // if request type is CREATE or UPDATE, list objects from the zombie workshop bucket and copy them to the user's new bucket.
  else {
    function initiateCopyObjects() {  // List all objects, then invoke copy function with keys
      async.waterfall([
        s3ListObjects,
        s3CopyObjects
      ], function(err, result) {
        if (err) {
          console.log('Error: ' + err);
          responseStatus = "FAILED";
          console.log('responseStatus is: ' + responseStatus + ' and event is: ' + event + ' and context is: ' + context);
          sendResponse(event, context, responseStatus, responseData);
        } 
        else {
          console.log('Done processing');
          responseStatus = "SUCCESS";
          console.log('responseStatus is: ' + responseStatus + ' and event is: ' + event + ' and context is: ' + context);
          sendResponse(event, context, responseStatus, responseData);
        }
      });  
    }

    
    function s3ListObjects(callback) {
      console.log('Starting s3 list objects function');
      var keys = [];

      var params = {
        Bucket: srcS3Bucket
      };

      s3.listObjects(params, function(err, data) {
        if (err) {
          console.log('Error listing S3 objects');
          return callback('Failed to list objects in bucket with error ' + err);
        }
        else {
          console.log('Data.contents is: ' + data.Contents.Key);
          keys.push(data.Contents);
          callback(null, data.Contents);
        }
      });
    }

    function s3CopyObjects(keys, callback) {
      async.each(keys, function(file, callback) {
        var params = {
          Bucket: dstS3Bucket,
          CopySource: srcS3Bucket + '/' + file.Key,
          Key: file.Key
        };
        s3.copyObject(params, function(copyErr, copyData){
          if (copyErr) {
            console.log('Failed to copy object: ' + copyErr);
            return callback(copyErr);
          }
          else {
            console.log('Copied: ', params.Key);
            callback(null);
          }
        });
      }, function(err) {
        if (err) {
          console.log('There was an error');
          return callback(err);
        }
        else {
          console.log('Finished copying');
          callback(null, 'Finished copying all of the files');
        }
      });
    }
    initiateCopyObjects(); 
  } // End CREATE/UPDATE section
}

function sendResponse(event, context, responseStatus, responseData) {

  var responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
      PhysicalResourceId: context.logStreamName,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData
  });

  console.log('RESPONSE BODY:\n', responseBody);

  var https = require('https');
  var url = require('url');

  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'PUT',
      headers: {
        "content-type": "",
        "content-length": responseBody.length
      }
  };

  console.log('SENDING RESPONSE...\n');

  var request = https.request(options, function(response) {
      console.log('STATUS: ' + response.statusCode);
      console.log('HEADERS: ' + JSON.stringify(response.headers));
      context.done();
  });

  request.on('error', function(error) {
    console.log('sendResponse Error:' + error);
    context.done();
  });

  request.write(responseBody);
  request.end();
}
