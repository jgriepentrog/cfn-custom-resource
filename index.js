/* Globals */
const opts = {logLevel: 1};

/**
 * Configures the module with the given options
 * @param  {Object} options Options to configure with
 * @return {void}           Void return
 */
const configure = (options) => {
  Object.assign(opts, options);
};

/* Requires */
const https = require("https");
const url = require("url");
const {URL} = url;

/* Constants */
const CREATE = "Create";
const UPDATE = "Update";
const DELETE = "Delete";
const SUCCESS = "SUCCESS";
const FAILED = "FAILED";

/**
 * Mocks the callback function if one is not provided to directly return the value intended for the callback
 * @param  {Error} error   Error encountered that should be returned. null if no error.
 * @param  {*}     result  Optional. Value to return. Ignored if error is provided.
 * @return {*}             Returns the Error, result value, or if neither applicable, null
 */
const mockCallback = (error, result) => {
  if (error) {
    if (error instanceof Error) {
      return error;
    }

    return new Error(error);
  }

  if (result) {
    return result;
  }

  return null;
};

/**
 * Sends a response to Cloudformation about the success or failure of a custom resource deploy
 * @param  {Object} responseDetails                     Contains the properties for the response
 * @param  {string} responseDetails.Status              Status for the response. SUCCESS or FAILED.
 * @param  {string} responseDetails.Reason              Reason for FAILED response. Ignored if SUCCESS.
 * @param  {string} responseDetails.PhysicalResourceId  Physical resource id
 * @param  {string} responseDetails.Data                Additional response to return. Optional.
 * @param  {Object} event                               Lambda event that contains passthrough information
 * @param  {Function} callback                          Optional. Lambda callback.
 * @return {Promise}                                    Promise for sending the response.
 *                                                      If the Lambda callback is provided,returns the provided callback with
 *                                                      error/result parameters.
 *                                                      If the Lambda callback is not provided, returns the error or result data directly.
 *                                                      Errors are returned for FAILED responses as well as for any errors in the
 *                                                      send response execution.
 *                                                      If Data is provided, it is provided as the callback result or returned directly.
 *                                                      Otherwise, null will be provided as the callback result or returned directly.
 */
const sendResponse = (responseDetails, event, callback) => {
  if (opts.logLevel > 1) {
    console.log(responseDetails);
    console.log(event);
  }

  const iCallback = callback ? callback : mockCallback;

  if (!event) {
    return Promise.reject(new Error("CRITICAL: no event, cannot send response"))
      .catch((err) => {
        return iCallback(err);
      });
  }

  if (!responseDetails) {
    return Promise.reject(new Error("CRITICAL: no response details, cannot send response"))
      .catch((err) => {
        return iCallback(err);
      });
  }

  /* Cloudformation requires an object, so wrap if it's not */
  if (responseDetails.Data && typeof responseDetails.Data !== "object") {
    responseDetails.Data = {data: responseDetails.Data};
  }

  /* Cloudformation requires this to be a string, so make sure it is */
  if (responseDetails.Reason && typeof responseDetails.Reason !== "string") {
    responseDetails.Reason = JSON.stringify(responseDetails.Reason);
  }

  const {Status, Reason, PhysicalResourceId, Data} = responseDetails;

  const responseBody = {
    Status,
    /* ...Reason ? {Reason} : {}, - reinstate once Node 8 is more widespead on Lambda */
    PhysicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId
    /* ...Data ? {Data} : {}, - reinstate once Node 8 is more widespead on Lambda */
  };

  if (Reason) {
    responseBody.Reason = Reason;
  }

  if (Data) {
    responseBody.Data = Data;
  }

  const responseBodyStr = JSON.stringify(responseBody); // Put back inline once Lambda Node 8 more widespead

  let respURL;

  try {
    respURL = URL ? new URL(event.ResponseURL) : url.parse(event.ResponseURL);
  } catch (err) {
    return Promise.reject(err)
      .catch(() => {
        return iCallback(err);
      });
  }

  const {hostname, protocol, path, pathname, search} = respURL;

  const options = {
    hostname,
    protocol,
    path: path ? path : pathname + search,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBodyStr.length
    }
  };

  if (opts.logLevel > 1) {
    console.log(JSON.stringify(options));
    console.log(responseBodyStr);
  }

  return new Promise((resolve, reject) => {
    const request = https.request(options, (res) => {
      console.log("Response sent.");

      let body;

      if (opts.logLevel > 1) {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          console.log(`RESPONSE BODY: ${body}`);
          resolve();
        });
      } else {
        resolve();
      }
    });

    request.on("error", (error) => {
      console.log(error);
      reject(error);
    });

    request.write(responseBodyStr);
    request.end();
  })
    .then(() => {
      if (Status === FAILED) {
        return iCallback(Reason);
      }

      if (Data) {
        return iCallback(null, Data);
      }

      return iCallback(null);
    })
    .catch((err) => {
      return iCallback(err);
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
 *                                        If the Lambda callback is provided,returns the provided callback with error/result parameters.
 *                                        If the Lambda callback is not provided, returns the error or result data directly.
 *                                        Errors are returned for FAILED responses as well as for any errors in the send response execution.
 *                                        If Data is provided, it is provided as the callback result or returned directly.
 *                                        Otherwise, null will be provided as the callback result or returned directly.
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
 * @param  {string}   physicalResourceId  Physical Resource Id of the resource. If not provided,
 *                              uses the one from the event. If none in the event, generates one.
 *                              Note: this is often not needed
 * @return {Promise}            Promise for sending the responses
 *                              If the Lambda callback is provided,returns the provided callback with error/result parameters.
 *                              If the Lambda callback is not provided, returns the error or result data directly.
 *                              Errors are returned for FAILED responses as well as for any errors in the send response execution.
 *                              If Data is provided, it is provided as the callback result or returned directly.
 *                              Otherwise, null will be provided as the callback result or returned directly.
 */
const sendFailure = (reason, event, callback, context, physicalResourceId) => {
  const defaultReason = context ?
    `Details in CloudWatch Log Stream: ${context.logStreamName}` :
    "WARNING: Reason not properly provided for failure";

  const finalReason = reason ? reason : defaultReason;

  const defaultPhysicalResourceId = event.PhysicalResourceId ?
    event.PhysicalResourceId :
    "NOIDPROVIDED";

  const finalPhysicalResourceId = physicalResourceId ? physicalResourceId : defaultPhysicalResourceId;

  if (opts.logLevel > 2) {
    console.log(finalPhysicalResourceId);
  }

  return sendResponse({Status: FAILED, Reason: finalReason, PhysicalResourceId: finalPhysicalResourceId}, event, callback);
};

/* Exports */
module.exports = {
  CREATE,
  UPDATE,
  DELETE,
  SUCCESS,
  FAILED,
  configure,
  sendResponse,
  sendSuccess,
  sendFailure
};
