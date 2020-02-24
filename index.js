/* Constants */
const CREATE = 'Create'
const UPDATE = 'Update'
const DELETE = 'Delete'
const SUCCESS = 'SUCCESS'
const FAILED = 'FAILED'
const LOG_NORMAL = 1
const LOG_VERBOSE = 2
const LOG_DEBUG = 3
const DEFAULT_PHYSICAL_RESOURCE_ID = 'NOIDPROVIDED'
const DEFAULT_REASON_WITH_CONTEXT = 'Details in CloudWatch Log Stream: '
const DEFAULT_REASON = 'WARNING: Reason not properly provided for failure'

/* Globals */
const opts = { logLevel: LOG_NORMAL }

/**
 * Configures the module with the given options
 * @param  {Object} options Options to configure with
 * @return {void}           Void return
 */
const configure = (options) => {
  Object.assign(opts, options)
}

/* Requires */
const https = require('https')
const { URL } = require('url')

/**
 * Mocks the callback function if one is not provided to directly return the value intended for the callback
 * @param  {Error} error   Error encountered that should be returned. null if no error.
 * @param  {*}     result  Optional. Value to return. Ignored if error is provided.
 * @return {*}             Returns the Error, result value, or if neither applicable, null
 */
const mockCallback = (error, result) => {
  if (error) {
    if (error instanceof Error) {
      return error
    }

    return new Error(error)
  }

  if (result) {
    return result
  }

  return null
}

/**
 * Wraps the internal function to handle any callbacks
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
const sendResponse = async (responseDetails, event, callback) => {
  if (opts.logLevel >= LOG_VERBOSE) {
    console.log(responseDetails)
    console.log(event)
  }

  const iCallback = callback || mockCallback

  let result

  try {
    result = await sendResponseInternal(responseDetails, event)
  } catch (err) {
    console.log(opts.logLevel >= LOG_DEBUG ? err : err.message)
    return iCallback(err)
  }

  return iCallback(null, result)
}

/**
 * Internal function to send the response to Cloudformation about the success or failure of a custom resource deploy
 * @param  {Object} responseDetails                     Contains the properties for the response
 * @param  {string} responseDetails.Status              Status for the response. SUCCESS or FAILED.
 * @param  {string} responseDetails.Reason              Reason for FAILED response. Ignored if SUCCESS.
 * @param  {string} responseDetails.PhysicalResourceId  Physical resource id
 * @param  {string} responseDetails.Data                Additional response to return. Optional.
 * @param  {Object} event                               Lambda event that contains passthrough information
 * @return {Promise}                                    Promise for sending the response.
 *                                                      If the Lambda callback is provided,returns the provided callback with
 *                                                      error/result parameters.
 *                                                      If the Lambda callback is not provided, returns the error or result data directly.
 *                                                      Errors are returned for FAILED responses as well as for any errors in the
 *                                                      send response execution.
 *                                                      If Data is provided, it is provided as the callback result or returned directly.
 *                                                      Otherwise, null will be provided as the callback result or returned directly.
 */
const sendResponseInternal = async (responseDetails, event) => {
  if (!event) {
    throw new Error('CRITICAL: no event, cannot send response')
  }

  if (!responseDetails) {
    throw new Error('CRITICAL: no response details, cannot send response')
  }

  /* Cloudformation requires an object, so wrap if it's not */
  if (responseDetails.Data && typeof responseDetails.Data !== 'object') {
    responseDetails.Data = { data: responseDetails.Data }
  }

  /* Cloudformation requires this to be a string, so make sure it is */
  if (responseDetails.Reason && typeof responseDetails.Reason !== 'string') {
    /* Stringifying an Error generates an empty object, so handle differently */
    if (responseDetails.Reason instanceof Error) {
      responseDetails.Reason = responseDetails.Reason.stack
    }
    responseDetails.Reason = JSON.stringify(responseDetails.Reason)
  }

  const { Status, Reason, PhysicalResourceId, Data } = responseDetails
  const { StackId, RequestId, LogicalResourceId } = event

  const responseBodyStr = JSON.stringify({
    Status,
    ...Reason ? { Reason } : {}, // Only set if Reason is truthy
    PhysicalResourceId,
    StackId,
    RequestId,
    LogicalResourceId,
    ...Data ? { Data } : {} // Only set if Data is truthy
  })

  let respURL

  try {
    respURL = new URL(event.ResponseURL)
  } catch (err) {
    err.message = `CRITICAL: Error parsing URL due to: [${err.message}]`
    throw err
  }

  const { hostname, protocol, path, pathname, search } = respURL

  const options = {
    hostname,
    protocol,
    path: path || pathname + search,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBodyStr.length
    }
  }

  if (opts.logLevel >= LOG_VERBOSE) {
    console.log(JSON.stringify(options))
    console.log(responseBodyStr)
  }

  return new Promise((resolve, reject) => {
    const request = https.request(options, (res) => {
      console.log('Response sent.')

      let body

      if (opts.logLevel >= LOG_VERBOSE) {
        console.log(`STATUS: ${res.statusCode}`)
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`)

        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          body += chunk
        })

        res.on('end', () => {
          console.log(`RESPONSE BODY: ${body}`)
          resolve()
        })
      } else {
        resolve()
      }
    })

    request.on('error', (err) => {
      reject(err)
    })

    request.write(responseBodyStr)
    request.end()
  })
    .then(() => {
      if (Status === FAILED) {
        throw Reason
      }

      if (Data) {
        return Data
      }

      return null
    })
    .catch((err) => {
      err.message = `CRITICAL: Error sending response due to: [${err.message}]`
      console.log(opts.logLevel >= LOG_DEBUG ? err : err.message)
      throw err
    })
}

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
const sendSuccess = async (physicalResourceId, data, event, callback) => {
  return sendResponse({ Status: SUCCESS, Reason: '', PhysicalResourceId: physicalResourceId, Data: data }, event, callback)
}

/**
 * Sends a failed response to Cloudformation. Wraps sendResponse.
 * @param  {string}   reason              Reason for the failure. If not provided, a default is provided.
 * @param  {Object}   event               Lambda event
 * @param  {Function} callback            Lambda callback
 * @param  {Object}   context             Lambda context. Used for providing a useful default reason.
 * @param  {string}   physicalResourceId  Physical Resource Id of the resource. If not provided,
 *                                        uses the one from the event. If none in the event, generates one.
 *                                        Note: this is often not needed
 * @return {Promise}                      Promise for sending the responses
 *                                        If the Lambda callback is provided,returns the provided callback with error/result parameters.
 *                                        If the Lambda callback is not provided, returns the error or result data directly.
 *                                        Errors are returned for FAILED responses as well as for any errors in the send response execution.
 *                                        If Data is provided, it is provided as the callback result or returned directly.
 *                                        Otherwise, null will be provided as the callback result or returned directly.
 */
const sendFailure = async (reason, event, callback, context, physicalResourceId) => {
  const defaultReason = context
    ? `${DEFAULT_REASON_WITH_CONTEXT}${context.logStreamName}`
    : DEFAULT_REASON

  const finalReason = reason || defaultReason

  const defaultPhysicalResourceId = event.PhysicalResourceId
    ? event.PhysicalResourceId
    : DEFAULT_PHYSICAL_RESOURCE_ID

  const finalPhysicalResourceId = physicalResourceId || defaultPhysicalResourceId

  if (opts.logLevel >= LOG_DEBUG) {
    console.log(finalPhysicalResourceId)
  }

  return sendResponse({ Status: FAILED, Reason: finalReason, PhysicalResourceId: finalPhysicalResourceId }, event, callback)
}

/* Exports */
module.exports = {
  CREATE,
  UPDATE,
  DELETE,
  SUCCESS,
  FAILED,
  DEFAULT_PHYSICAL_RESOURCE_ID,
  DEFAULT_REASON_WITH_CONTEXT,
  DEFAULT_REASON,
  LOG_NORMAL,
  LOG_VERBOSE,
  LOG_DEBUG,
  configure,
  sendResponse,
  sendSuccess,
  sendFailure
}
