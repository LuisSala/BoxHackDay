var mraa = require('mraa'); //require mraa
var AWS = require('aws-sdk'); //require AWS SDK
// For variables that ask for region input, please use region code such as us-west-2 or us-east-1
AWS.config.update({accessKeyId: 'ENTER ACCESS KEY HERE', secretAccessKey: 'ENTER SECRET ACCESS KEY HERE', region: 'ENTER REGION HERE'}); //configure AWS credentials
var sns = new AWS.SNS({region: 'ENTER REGION HERE'}); // establish the SNS connection

var zombieSensor = new mraa.Gpio(6); //setup digital read on Digital pin #6 (D6)
zombieSensor.dir(mraa.DIR_IN); //set the gpio direction to input

var city = 
  [ 
    ["London",51.507351,-0.127758],
    ["Las Vegas",36.169941,-115.139830],
    ["New York",40.712784,-74.005941],
    ["Singapore",1.352083,103.819836],
    ["Sydney",-33.867487,151.206990],
    ["Paris",48.856614,2.352222],
    ["Seattle",47.606209,-122.332071],
    ["San Francisco",37.774929,-122.419416],
    ["Montreal",45.501689,-73.567256],
    ["Rio De Janeiro",-22.906847,-43.172896],
    ["Beijing",39.904211,116.407395],
    ["Moscow",55.755826,37.617300],
    ["Buenos Aires",-34.603684,-58.381559],
    ["New Dehli",28.613939,77.209021],
    ["Cape Town",-33.924869,18.424055],
    ["Lagos",6.524379,3.379206],
    ["Munich",48.135125,11.581981]
  ]

periodicActivity(); //call the periodicActivity function

//logic starts here.


//Function to generate a randomNumber to be used for selecting random cities
function roundedNumberFunc(callback) {

  var randomNumber =  Math.random() * (15 - 0 + 1) + 0;
  var roundedNumber = Math.round(randomNumber)
  generateAlert(roundedNumber, city) //call the function to send the alert to SNS

}

// function to form the message with a random city and send it to SNS
function generateAlert(roundedNumber, city) {

  var message = '{"message":"A Zombie has been detected in ' + city[roundedNumber][0] + '!", "value":"1", "city":"' + city[roundedNumber][0] + '", "longitude":"' + city[roundedNumber][2] + '", "latitude":"' + city[roundedNumber][1] + '"}'
  var params = {
    Message: message, /* required */
    Subject: "Zombie Alert",
    TopicArn: "ENTER YOUR TOPIC ARN HERE"
  };
  sns.publish(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data + " Message successfully sent to SNS");           // successful response
  });

  console.log("Zombie Detected") 
}

// Period function to run every second and read the sensor vlaue.
function periodicActivity() {
  var sensorValue =  zombieSensor.read(); //read the digital value of the Grove PIR Motion Sensor
    if (sensorValue == 1) { 
    roundedNumberFunc() // Sensor value is 1 (motion detected), start function to generate random number and publish message to SNS
    }
    else {
      console.log("The Coast is Clear") //No motion detected
    };
  setTimeout(periodicActivity,1000); //call the indicated function after 1 second (1000 milliseconds)
}

