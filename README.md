# FaaS
Function as a Service for AWS Lambda

Technology stack:
- Node.js (v12.x)
- Mocha (Testing framework)
- Circle CI for CI/CD Pipeline


## Installing node.js and npm

https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions

### Debian and Ubuntu based distributions

#### Node.js v12.x:
```$xslt
# Using Ubuntu
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using Debian, as root
curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get install -y nodejs
```

## Installing dependencies from `package.json`
Execute `npm install` from root of the repo

## Running test cases
This app uses Mocha framework for executing unit and integration tests.
Command to run all the tests is `npm test`

## Deployment
```
zip -9 --exclude '*.git*' -r send_email.zip .
```
After this, export the AWS_PROFILE (dev or prod)
```          
aws lambda update-function-code \
    --region us-east-1 \
    --function-name send_email \
    --zip-file \
    fileb://send_email.zip --output json
```