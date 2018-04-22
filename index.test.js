/* SETUP */
const {configure, sendSuccess, sendFailure, sendResponse, SUCCESS, FAILED} = require("./index");

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
const fakePhysicalResourceIdDefault = "NOIDPROVIDED";
const fakeReason = "Something bad happened";
const fakeReasonObj = {ohno: "Something bad happened"};
const fakeRespURL = "https://google.com/resp/testing?testId=436"; // NOTE: Endpoint valid, but URL not
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

const physIdFakeEvent = Object.assign({}, fakeEvent);
physIdFakeEvent.PhysicalResourceId = fakePhysicalResourceId;

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

const failedRespDetailsObjReason = Object.assign({}, failedRespDetailsNoReason);
failedRespDetailsObjReason.Reason = fakeReasonObj;

/* Error setup */
const noEventError = new Error("CRITICAL: no event, cannot send response");
const noRespDetailsError = new Error("CRITICAL: no response details, cannot send response");
const reasonContextErrorMsg = `Details in CloudWatch Log Stream: ${fakeContext.logStreamName}`;
const reasonContextError = new Error(reasonContextErrorMsg);
const reasonDefaultErrorMsg = "WARNING: Reason not properly provided for failure";
const reasonDefaultError = new Error(reasonDefaultErrorMsg);

/* TESTS */
describe("Pure Errors", () => {
  test("Gets a resolved Promise with a thrown error passed to callback when event is omitted", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetails, null, fakeCallback)).resolves.toEqual({error: noEventError});
  });

  test("Gets a resolved Promise with a thrown error without callback when event is omitted", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetails, null)).resolves.toThrow(noEventError);
  });

  test("Gets a resolved Promise with a thrown error passed to callback when response details is omitted", () => {
    expect.assertions(1);
    return expect(sendResponse(null, fakeEvent, fakeCallback)).resolves.toEqual({error: noRespDetailsError});
  });

  test("Gets a resolved Promise with a thrown error without callback when response details is omitted", () => {
    expect.assertions(1);
    return expect(sendResponse(null, fakeEvent)).resolves.toThrow(noRespDetailsError);
  });
});

describe("Proper Success sendResponses", () => {
  test("Gets a resolved Promise with null passed to callback when it is a proper success response", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetails, fakeEvent, fakeCallback)).resolves.toEqual({error: null});
  });

  test("Gets a resolved Promise returning null without callback when it is a proper success response", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetails, fakeEvent)).resolves.toEqual(null);
  });

  test("Gets a resolved Promise with null passed to callback when it is a proper success response with data", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetailsWithData, fakeEvent, fakeCallback))
      .resolves.toEqual({error: null, data: successRespDetailsWithData.Data});
  });

  test("Gets a resolved Promise returning data without callback when it is a proper success response with data", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetailsWithData, fakeEvent))
      .resolves.toEqual(successRespDetailsWithData.Data);
  });

  test(
    "Gets a resolved Promise with null and wrapped data passed to callback when it is a proper success response with nonobject data",
    () => {
      expect.assertions(1);
      return expect(sendResponse(successRespDetailsWithStrData, fakeEvent, fakeCallback))
        .resolves.toEqual({error: null, data: {data: strData}});
    }
  );

  test("Gets a resolved Promise returning wrapped data without callback when it is a proper success response with nonobject data", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetailsWithStrData, fakeEvent))
      .resolves.toEqual({data: strData});
  });
});

describe("Improper Success sendResponses", () => {
  test("Gets a resolved Promise with an error passed to callback when it is a proper success response, but a bad response URL", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetails, badFakeEvent, fakeCallback)).resolves.toThrow();
  });

  test("Gets a resolved Promise returning an error without callback when it is a proper success response, but a bad response URL", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetails, badFakeEvent)).resolves.toThrow();
  });

  test("Gets a resolved Promise with an error passed to callback on a proper success response, but not existent response URL", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetails, notExistFakeEvent, fakeCallback)).resolves.toThrow();
  });

  test("Gets a resolved Promise returning an error without callback on a proper success response, but not existent response URL", () => {
    expect.assertions(1);
    return expect(sendResponse(successRespDetails, notExistFakeEvent)).resolves.toThrow();
  });
});

describe("Proper Failed sendResponses", () => {
  test("Gets a resolved Promise with reason passed to callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendResponse(failedRespDetails, fakeEvent, fakeCallback)).resolves.toEqual({error: fakeReason});
  });

  test("Gets a resolved Promise with object reason passed to callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendResponse(failedRespDetailsObjReason, fakeEvent, fakeCallback)).resolves
      .toEqual({error: JSON.stringify(fakeReasonObj)});
  });

  test("Gets a resolved Promise returning an error without callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendResponse(failedRespDetails, fakeEvent)).resolves.toThrow();
  });
});

describe("Proper sendSuccesses", () => {
  test("Gets a resolved Promise with null passed to callback when it is a proper success response", () => {
    expect.assertions(1);
    return expect(sendSuccess(fakePhysicalResourceId, null, fakeEvent, fakeCallback)).resolves.toEqual({error: null});
  });
});

describe("Proper sendFailures", () => {
  test("Gets a resolved Promise with reason passed to callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendFailure(fakeReason, fakePhysicalResourceId, fakeEvent, fakeCallback, fakeContext)).resolves
      .toEqual({error: fakeReason});
  });

  test("Gets a resolved Promise with returning an error without callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendFailure(fakeReason, fakePhysicalResourceId, fakeEvent, null, fakeContext)).resolves.toThrow();
  });

  test("Gets a resolved Promise with reason passed to callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendFailure(fakeReason, fakePhysicalResourceId, fakeEvent, fakeCallback)).resolves.toEqual({error: fakeReason});
  });

  test("Gets a resolved Promise with returning an error without callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendFailure(fakeReason, fakePhysicalResourceId, fakeEvent)).resolves.toThrow();
  });

  test("Gets a resolved Promise with context default reason passed to callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendFailure(null, fakePhysicalResourceId, fakeEvent, fakeCallback, fakeContext)).resolves
      .toEqual({error: reasonContextErrorMsg});
  });

  test(
    "Gets a resolved Promise with returning an error with context default reason without callback when it is a proper failed response",
    () => {
      expect.assertions(1);
      return expect(sendFailure(null, fakePhysicalResourceId, fakeEvent, null, fakeContext)).resolves.toThrow(reasonContextError);
    }
  );

  test("Gets a resolved Promise with default reason passed to callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendFailure(null, fakePhysicalResourceId, fakeEvent, fakeCallback)).resolves.toEqual({error: reasonDefaultErrorMsg});
  });

  test("Gets a resolved Promise returning an error with default reason without callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendFailure(null, fakePhysicalResourceId, fakeEvent)).resolves.toThrow(reasonDefaultError);
  });

  test("Gets a resolved Promise with reason passed to callback when it is a proper failed response", () => {
    expect.assertions(2);
    configure({logLevel: 3});
    const logSpy = jest.spyOn(global.console, "log");
    return sendFailure(fakeReason, null, fakeEvent, fakeCallback, fakeContext).then((result) => {
      expect(logSpy).toHaveBeenCalledWith(fakePhysicalResourceIdDefault);
      expect(result).toEqual({error: fakeReason});
      configure({logLevel: 1});
      logSpy.mockReset();
      logSpy.mockRestore();
    });
  });

  test("Gets a resolved Promise with reason passed to callback when it is a proper failed response", () => {
    expect.assertions(2);
    configure({logLevel: 3});
    const logSpy = jest.spyOn(global.console, "log");
    return sendFailure(fakeReason, null, physIdFakeEvent, fakeCallback, fakeContext).then((result) => {
      expect(logSpy).toHaveBeenCalledWith(fakePhysicalResourceId);
      expect(result).toEqual({error: fakeReason});
      configure({logLevel: 1});
      logSpy.mockReset();
      logSpy.mockRestore();
    });
  });

  /*
  test("Gets a resolved Promise with reason passed to callback when it is a proper failed response", () => {
    expect.assertions(1);
    return expect(sendFailure(fakeReason, null, physIdFakeEvent, fakeCallback, fakeContext)).resolves
      .toEqual({error: fakeReason});
  });*/
});

describe("Test Logging", () => {
  test("Test normal logging", () => {
    const logSpy = jest.spyOn(global.console, "log");
    const EXPECTED_LOG_COUNT = 1;
    return sendResponse(successRespDetails, fakeEvent, fakeCallback).then(() => {
      expect.assertions(1);
      const result = expect(logSpy).toHaveBeenCalledTimes(EXPECTED_LOG_COUNT);
      logSpy.mockReset();
      logSpy.mockRestore();
      return result;
    });
  });

  test("Test verbose logging", () => {
    const logSpy = jest.spyOn(global.console, "log");
    const EXPECTED_LOG_COUNT = 5;
    configure({logLevel: 2});
    return sendResponse(successRespDetails, fakeEvent, fakeCallback).then(() => {
      expect.assertions(1);
      const result = expect(logSpy).toHaveBeenCalledTimes(EXPECTED_LOG_COUNT);
      logSpy.mockReset();
      logSpy.mockRestore();
      configure({logLevel: 1});
      return result;
    });
  });
});
