# Cloudformation Custom Resources Helper

Node.js module providing utility functions and constants for AWS CloudFormation Custom Resources.

[![Build Status](https://travis-ci.com/zippadd/cfn-custom-resource.svg?branch=master)](https://travis-ci.com/zippadd/cfn-custom-resource)
[![codecov](https://codecov.io/gh/zippadd/cfn-custom-resource/branch/master/graph/badge.svg)](https://codecov.io/gh/zippadd/cfn-custom-resource)
[![dependencies Status](https://david-dm.org/zippadd/cfn-custom-resource/status.svg)](https://david-dm.org/zippadd/cfn-custom-resource)
[![devDependencies Status](https://david-dm.org/zippadd/cfn-custom-resource/dev-status.svg)](https://david-dm.org/zippadd/cfn-custom-resource?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/zippadd/cfn-custom-resource.svg)](https://greenkeeper.io/)
[![Inline docs](http://inch-ci.org/github/zippadd/cfn-custom-resource.svg?branch=master)](http://inch-ci.org/github/zippadd/cfn-custom-resource)

## Supported Runtimes
* Lambda NodeJS 10
* Lambda NodeJS 8.10
* Lambda NodeJS 6.10

## Usage
```javascript
const cfnCR = require("cfn-custom-resource");
const {configure, sendSuccess, sendFailure, sendResponse, LOG_VERBOSE, SUCCESS} = cfnCR;

/* Increase the logging level */
configure({logLevel: LOG_VERBOSE});

/**
  Do resource creation
                      **/

/* Resource successfully created! - async/await */
const result = await sendSuccess(id, {ImportantInfo: otherId}, event);
return result;

/* Resource successfully created! - Promises */
return sendSuccess(id, {ImportantInfo: otherId}, event, callback);

/* Resource encountered an error during creation - async/await */
await sendFailure("mistakes were made", event); // Simple form
await sendFailure("mistakes were made", event, null, null, id); //If there's a special resource id to pass

/* Resource encountered an error during creation - Promises */
return sendFailure("mistakes were made", event, callback); // Simple form
return sendFailure("mistakes were made", event, callback, null, id); //If there's a special resource id to pass

/* If you want full control */
await sendResponse({Status: SUCCESS, PhysicalResourceId: id, Data: {ImportantInfo: otherId}}, event);
```

## Constants
* Responses - SUCCESS and FAILED
* Request Types - CREATE, UPDATE, DELETE
* Logging Levels - LOG_NORMAL, LOG_VERBOSE, LOG_DEBUG
* Default sendFailure text - DEFAULT_PHYSICAL_RESOURCE_ID, DEFAULT_REASON_WITH_CONTEXT, DEFAULT_REASON (no context)

## Functions
<a name="configure"></a>

### configure(options) ⇒ <code>void</code>
Configures the module with the given options

**Kind**: global function  
**Returns**: <code>void</code> - Void return  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options to configure with |

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

### sendFailure(reason, event, callback, context, physicalResourceId) ⇒ <code>Promise</code>
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
| physicalResourceId | <code>string</code> | Physical Resource Id of the resource. If not provided,                              uses the one from the event. If none in the event, generates one.  
