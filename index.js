var aws = require('aws-sdk');

var ttl_minutes = 15;

// var profileName = 'dev';
var regionName = process.env.DEPLOYMENT_REGION || 'us-east-1';
var domain = process.env.DOMAIN || "dev.kinnarkansara.me";
var dynamodb_table = process.env.DYNAMODB_TABLE_NAME || "csye6225";
// if(process.env.NODE_ENV == 'production'){
//     profileName = process.env.IAMInstanceProfileName;
//     regionName = process.env.DEPLOYMENT_REGION;
//     domain = process.env.DOMAIN;
// } 
// else {
//     console.info("Running Env: " + process.env.NODE_ENV);
//     var credentials = new aws.SharedIniFileCredentials({profile: profileName});
//     aws.config.credentials = credentials;
// }
var ses = new aws.SES({ region: regionName });

const { v4: uuidv4 } = require('uuid');
// import { v4 as uuidv4 } from 'uuid';

var ddb = new aws.DynamoDB({ apiVersion: '2012-08-10' });

exports.handler = (event, context, callback) => {
    var uuid = uuidv4();
    console.log("AWS lambda and SNS trigger ");
    console.log(event);
    const sns_email = event.Records[0].Sns.Message;
    console.log(sns_email)
    console.log("Dynamodb table"+ dynamodb_table);
    var timestamp = new Date();
    // var expires = expires.setTime(expires.getTime() + (15*60*1000)); // Add 15 minutes.
    var expires = Math.floor((timestamp.getTime() + (ttl_minutes * 60 * 1000)) / 1000); // Add 15 minutes.

    var params = {
        TableName: dynamodb_table,
        Key: {
            "email":  {S: sns_email} 
        }
    };
    ddb.getItem(params, function (err, data) {
        if (err) {
            console.log("Item error");
            console.log("Error", err);            
        } else {
            console.log("Entry with email found", data.Item);
            var current_timestamp = Math.floor((timestamp.getTime()) / 1000);
            if((data.Item == undefined || data.Item == null) || 
                Number(data.Item.timetoexist) < current_timestamp) {
                
                var params = {
                    TableName: dynamodb_table,
                    Item: {
                        'email': { S: sns_email },
                        'timestamp': { S: timestamp.toISOString() },
                        'token': { S: uuid },
                        'timetoexist': { S: expires+"" }
                    }
                };

                ddb.putItem(params, function (err, data) {
                    if (err) {
                        console.log("Error", err);
                    } else {
                        console.log("Success", data);
                    }
                });


                var params = {
                    Destination: {
                        ToAddresses: [sns_email]
                    },
                    Message: {
                        Body: {
                            Html: {
                                Charset: "UTF-8",
                                Data: "Click the link below to reset password:<br>\
                                <a href='http://"+domain+"/users/resetpassword?email="+sns_email+"&token="+uuid+"'>\
                                http://"+domain+"/users/resetpassword?email="+sns_email+"&token="+uuid+"</a><br>\
                                Thank you."
                            },
                            Text: {
                                Data: "Copy the link below and paste it in the browser to reset password:\n\
                                http://"+domain+"/users/resetpassword?email="+sns_email+"&token="+uuid+"\n\
                                Thank you."
                            }
                        },
                        Subject: {
                            Data: "Bookstore: Password Reset Email"
                        }
                    },
                    Source: "kinnar@" + domain
                };
                ses.sendEmail(params, function (err, data) {
                    callback(null, { err: err, data: data });
                    if (err) {
                        console.log(err);
                        context.fail(err);
                    } else {
                        console.log(data);
                        context.succeed(event);
                    }
                });
            } else {
                console.log("Email already sent at " + data.Item.timestamp + ". Please try again after 15 minutes");
            }
        }

        
    });




};

exports.insertRecord = function(text) {
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(text, salt, (err, hash) => {
            if (err) throw err;
            console.info("bcrypt hash: " + hash);
            return hash;
        });
    });
}