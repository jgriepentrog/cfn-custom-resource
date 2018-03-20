/* SETUP */
const {sendSuccess, sendFailure, sendResponse, SUCCESS, FAILED} = require("./index");

/* Callback setup */
const fakeCallback = jest.fn((error, data) => {
  if (data) {
    return {error, data};
  }

  return {error};
});

/* Context setup */
const fakeContext = {logStreamName: "fake-logs-1df372"};

/* Event setup */
const fakeStackId = "f3a936";
const fakeReqId = "c4dd7439";
const fakeLogicalResourceId = "testResource";
const fakePhysicalResourceId = "12345a";
const fakeReason = "Something bad happened";
const fakeRespURL = "https://google.com/resp/testing?testId=436";
const badFakeRespURL = "notAURL";
const notExistFakeRespURL = "https://thiswebsitedoesntexist1354htrbt3.com/nope?foo=bar";


const fakeEvent = {
  StackId: fakeStackId,
  RequestId: fakeReqId,
  LogicalResourceId: fakeLogicalResourceId,
  ResponseURL: fakeRespURL
};

const badFakeEvent = Object.assign({}, fakeEvent);
badFakeEvent.ResponseURL = badFakeRespURL;

const notExistFakeEvent = Object.assign({}, fakeEvent);
notExistFakeEvent.ResponseURL = notExistFakeRespURL;

/* Success response setup */
const successRespDetails = {
  Status: SUCCESS,
  PhysicalResourceId: fakePhysicalResourceId
};

const successRespDetailsWithData = Object.assign({}, successRespDetails);
successRespDetailsWithData.Data = {test: "I'm some data"};

const successRespDetailsWithStrData = Object.assign({}, successRespDetails);
successRespDetailsWithStrData.Data = "I'm some data";
const strData = successRespDetailsWithStrData.Data.slice(0);

/* Failed response setup */
const failedRespDetailsNoReason = {
  Status: FAILED,
  PhysicalResourceId: fakePhysicalResourceId
};

const failedRespDetails = Object.assign({}, failedRespDetailsNoReason);
failedRespDetails.Reason = fakeReason;

/* Error setup */
const noEventError = new Error("CRITICAL: no event, cannot send response");
const noRespDetailsError = new Error("CRITICAL: no response details, cannot send response");
const reasonContextError = `Details in CloudWatch Log Stream: ${fakeContext.logStreamName}`;
const reasonDefaultError = "WARNING: Reason not properly provided for failure";

/* TESTS */

/* Pure Errors */
test("Gets a rejected promise with a thrown error when callback is omitted", () => {
  expect.assertions(1);
  return expect(sendResponse(successRespDetails, fakeEvent, null)).rejects.toThrow();
});

test("Gets a resolved promise with a thrown error when event is omitted", () => {
  expect.assertions(1);
  return expect(sendResponse(successRespDetails, null, fakeCallback)).resolves.toEqual({error: noEventError});
});

test("Gets a rejected promise with a thrown error when response details is omitted", () => {
  expect.assertions(1);
  return expect(sendResponse(null, fakeEvent, fakeCallback)).resolves.toEqual({error: noRespDetailsError});
});

/* Proper Success sendResponses */
test("Gets a resolved Promise with null passed to callback when it is a proper success response", () => {
  expect.assertions(1);
  return expect(sendResponse(successRespDetails, fakeEvent, fakeCallback)).resolves.toEqual({error: null});
});

test("Gets a resolved Promise with null passed to callback when it is a proper success response with data", () => {
  expect.assertions(1);
  return expect(sendResponse(successRespDetailsWithData, fakeEvent, fakeCallback))
    .resolves.toEqual({error: null, data: successRespDetailsWithData.Data});
});

test("Gets a resolved Promise with null passed to callback when it is a proper success response with data", () => {
  expect.assertions(1);
  return expect(sendResponse(successRespDetailsWithStrData, fakeEvent, fakeCallback))
    .resolves.toEqual({error: null, data: {data: strData}});
});

/* Improper Success sendResponses */
test("Gets a resolved Promise with an error passed to callback when it is a proper success response, but a bad response URL", () => {
  expect.assertions(1);
  return expect(sendResponse(successRespDetails, badFakeEvent, fakeCallback)).resolves.toThrow();
});

test("Gets a resolved Promise with an error passed to callback on a proper success response, but not existent response URL", () => {
  expect.assertions(1);
  return expect(sendResponse(successRespDetails, notExistFakeEvent, fakeCallback)).resolves.toThrow();
});

/* Proper Failed sendResponses */
test("Gets a resolved Promise with reason passed to callback when it is a proper failed response", () => {
  expect.assertions(1);
  return expect(sendResponse(failedRespDetails, fakeEvent, fakeCallback)).resolves.toEqual({error: fakeReason});
});

/* Proper sendSuccesses */
test("Gets a resolved Promise with null passed to callback when it is a proper success response", () => {
  expect.assertions(1);
  return expect(sendSuccess(fakePhysicalResourceId, null, fakeEvent, fakeCallback)).resolves.toEqual({error: null});
});

/* Proper sendFailures */
test("Gets a resolved Promise with reason passed to callback when it is a proper failed response", () => {
  expect.assertions(1);
  return expect(sendFailure(fakeReason, fakeEvent, fakeCallback, fakeContext)).resolves.toEqual({error: fakeReason});
});

test("Gets a resolved Promise with context default reason passed to callback when it is a proper failed response", () => {
  expect.assertions(1);
  return expect(sendFailure(null, fakeEvent, fakeCallback, fakeContext)).resolves.toEqual({error: reasonContextError});
});

test("Gets a resolved Promise with default reason passed to callback when it is a proper failed response", () => {
  expect.assertions(1);
  return expect(sendFailure(null, fakeEvent, fakeCallback)).resolves.toEqual({error: reasonDefaultError});
});
