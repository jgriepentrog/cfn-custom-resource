# Cloudformation Custom Resources Helper
Node.js module providing utility functions and constants for AWS CloudFormation Custom Resources.

## How to Use
```javascript
const cfnCR = require("cfn-custom-resource");
```

## Functions
* sendSuccess - sends a success response for a custom resource operation to CloudFormation, wraps sendResponse
* sendFailure - sends a failed response for a custom resource operation to CloudFormation, wraps sendResponse
* sendResponse - core function for sending custom resource operation responses to CloudFormation

## Constants
* Responses - SUCCESS and FAILED
* Request Types - CREATE, UPDATE, DELETE
