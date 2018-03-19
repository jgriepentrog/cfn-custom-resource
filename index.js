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

  const {Status, Reason, PhysicalResourceId, Data} = responseDetails;

  const responseBody = {
    Status,
    /* ...Reason ? {Reason} : {}, - reinstate once Node 8 is supported in Lambda */
    PhysicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: Data ? Data : {}
  };

  if (Reason) {
    responseBody.Reason = Reason;
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

      return callback(null);
    })
    .catch((err) => {
      return callback(err);
    });
};

/**
 * [sendSuccess description]
 * @param  {[type]}   physicalResourceId [description]
 * @param  {[type]}   data               [description]
 * @param  {[type]}   event              [description]
 * @param  {Function} callback           [description]
 * @return {[type]}                      [description]
 */
const sendSuccess = (physicalResourceId, data, event, callback) => {
  return sendResponse({Status: SUCCESS, Reason: "", physicalResourceId, data}, event, callback);
};

/**
 * [sendFailure description]
 * @param  {[type]}   reason   [description]
 * @param  {[type]}   event    [description]
 * @param  {Function} callback [description]
 * @param  {[type]}   context  [description]
 * @return {[type]}            [description]
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
