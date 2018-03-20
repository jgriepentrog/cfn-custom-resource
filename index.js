/* Requires */
const https = require("https");
const {URL} = require("url");

/* Constants */
const CREATE = "Create";
const UPDATE = "Update";
const DELETE = "Delete";
const SUCCESS = "SUCCESS";
const FAILED = "FAILED";

/**
 * Sends a response to Cloudformation about the success or failure of a custom resource deploy
 * @param  {Object} responseDetails                     Contains the properties for the response
 * @param  {string} responseDetails.Status              Status for the response. SUCCESS or FAILED.
 * @param  {string} responseDetails.Reason              Reason for FAILED response. Ignored if SUCCESS.
 * @param  {string} responseDetails.PhysicalResourceId  Physical resource id
 * @param  {string} responseDetails.Data                Additional response to return. Optional.
 * @param  {Object} event                               Lambda event that contains passthrough information
 * @param  {Function} callback                          Lambda callback
 * @return {Promise}                                    Promise for sending the response
 */
const sendResponse = (responseDetails, event, callback) => {
  if (!event) {
    return Promise.reject(new Error("CRITICAL: no event, cannot send response"))
      .catch((err) => {
        return callback(err);
      });
  }

  if (!responseDetails) {
    return Promise.reject(new Error("CRITICAL: no response details, cannot send response"))
      .catch((err) => {
        return callback(err);
      });
  }

  /* Cloudformation requires an object, so wrap if it's not */
  if (responseDetails.Data && typeof responseDetails.Data !== "object") {
    responseDetails.Data = {data: responseDetails.Data};
  }

  const {Status, Reason, PhysicalResourceId, Data} = responseDetails;

  const responseBody = {
    Status,
    /* ...Reason ? {Reason} : {}, - reinstate once Node 8 is supported in Lambda */
    PhysicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId
    /* ...Data ? {Data} : {}, - reinstate once Node 8 is supported in Lambda */
  };

  if (Reason) {
    responseBody.Reason = Reason;
  }

  if (Data) {
    responseBody.Data = Data;
  }

  const responseBodyStr = JSON.stringify(responseBody); // Put back inline once Node 8

  let url;

  try {
    url = new URL(event.ResponseURL);
  } catch (err) {
    return Promise.reject(err)
      .catch(() => {
        return callback(err);
      });
  }

  const {hostname, pathname, protocol} = url;

  const options = {
    hostname,
    protocol,
    pathname,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBodyStr.length
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, () => {
      console.log("Response sent.");
      resolve();
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.write(responseBodyStr);
    request.end();
  })
    .then(() => {
      if (Status === FAILED) {
        return callback(Reason);
      }

      if (Data) {
        return callback(null, Data);
      }

      return callback(null);
    })
    .catch((err) => {
      return callback(err);
    });
};

/**
 * Sends a success response to Cloudformation. Wraps sendResponse.
 * @param  {string}   physicalResourceId  Physical Resource Id of the resource
 * @param  {*}        data                Optional. Additional data to send. If not
 *                                        an object, it is wrapped in one with a
 *                                        single property, data, assigned to it.
 * @param  {Object}   event               Lambda event
 * @param  {Function} callback            Lambda callback
 * @return {Promise}                      Promise for sending the response
 */
const sendSuccess = (physicalResourceId, data, event, callback) => {
  return sendResponse({Status: SUCCESS, Reason: "", physicalResourceId, data}, event, callback);
};

/**
 * Sends a failed response to Cloudformation. Wraps sendResponse.
 * @param  {string}   reason    Reason for the failure. If not provided, a default is provided.
 * @param  {Object}   event     Lambda event
 * @param  {Function} callback  Lambda callback
 * @param  {Object}   context   Lambda context. Used for providing a useful default reason.
 * @return {Promise}             Promise for sending the resposne
 */
const sendFailure = (reason, event, callback, context) => {
  const defaultReason = context ?
    `Details in CloudWatch Log Stream: ${context.logStreamName}` :
    "WARNING: Reason not properly provided for failure";

  const finalReason = reason ? reason : defaultReason;

  return sendResponse({Status: FAILED, Reason: finalReason}, event, callback);
};

/* Exports */
module.exports = {
  CREATE,
  UPDATE,
  DELETE,
  SUCCESS,
  FAILED,
  sendResponse,
  sendSuccess,
  sendFailure
};
