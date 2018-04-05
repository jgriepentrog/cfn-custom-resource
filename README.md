# Cloudformation Custom Resources Helper
Node.js module providing utility functions and constants for AWS CloudFormation Custom Resources.

##Supported Runtimes
* Lambda NodeJS 8.10
* Lambda NodeJS 6.10

## How to Use
```javascript
const cfnCR = require("cfn-custom-resource");
```

## Constants
* Responses - SUCCESS and FAILED
* Request Types - CREATE, UPDATE, DELETE

## Functions
### sendResponse(responseDetails, event, callback) ⇒ <code>Promise</code>
Sends a response to Cloudformation about the success or failure of a custom resource deploy

**Kind**: global function  
**Returns**: <code>Promise</code> - Promise for sending the response.
                                     If the Lambda callback is provided,returns the provided callback with
                                     error/result parameters.
                                     If the Lambda callback is not provided, returns the error or result data directly.
                                     Errors are returned for FAILED responses as well as for any errors in the
                                     send response execution.
                                     If Data is provided, it is provided as the callback result or returned directly.
                                     Otherwise, null will be provided as the callback result or returned directly.  

| Param | Type | Description |
| --- | --- | --- |
| responseDetails | <code>Object</code> | Contains the properties for the response |
| responseDetails.Status | <code>string</code> | Status for the response. SUCCESS or FAILED. |
| responseDetails.Reason | <code>string</code> | Reason for FAILED response. Ignored if SUCCESS. |
| responseDetails.PhysicalResourceId | <code>string</code> | Physical resource id |
| responseDetails.Data | <code>string</code> | Additional response to return. Optional. |
| event | <code>Object</code> | Lambda event that contains passthrough information |
| callback | <code>function</code> | Optional. Lambda callback. |

<a name="sendSuccess"></a>

### sendSuccess(physicalResourceId, data, event, callback) ⇒ <code>Promise</code>
Sends a success response to Cloudformation. Wraps sendResponse.

**Kind**: global function  
**Returns**: <code>Promise</code> - Promise for sending the response
                                     If the Lambda callback is provided,returns the provided callback with error/result parameters.
                                     If the Lambda callback is not provided, returns the error or result data directly.
                                     Errors are returned for FAILED responses as well as for any errors in the send response execution.
                                     If Data is provided, it is provided as the callback result or returned directly.
                                     Otherwise, null will be provided as the callback result or returned directly.  

| Param | Type | Description |
| --- | --- | --- |
| physicalResourceId | <code>string</code> | Physical Resource Id of the resource |
| data | <code>\*</code> | Optional. Additional data to send. If not                                        an object, it is wrapped in one with a                                        single property, data, assigned to it. |
| event | <code>Object</code> | Lambda event |
| callback | <code>function</code> | Lambda callback |

<a name="sendFailure"></a>

### sendFailure(reason, event, callback, context) ⇒ <code>Promise</code>
Sends a failed response to Cloudformation. Wraps sendResponse.

**Kind**: global function  
**Returns**: <code>Promise</code> - Promise for sending the responses
                                     If the Lambda callback is provided,returns the provided callback with error/result parameters.
                                     If the Lambda callback is not provided, returns the error or result data directly.
                                     Errors are returned for FAILED responses as well as for any errors in the send response execution.
                                     If Data is provided, it is provided as the callback result or returned directly.
                                     Otherwise, null will be provided as the callback result or returned directly.  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | Reason for the failure. If not provided, a default is provided. |
| event | <code>Object</code> | Lambda event |
| callback | <code>function</code> | Lambda callback |
| context | <code>Object</code> | Lambda context. Used for providing a useful default reason. |
