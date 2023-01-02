/**
 * this method helps to send a response to the frontend
 * @param {any} response this is the response parameter for the route
 * @param {boolean} error if to return error response
 * @param {string} code the response code
 * @param {any} data the payload to send as a response
 * @param {number} status response status
 * @returns a response type
 */
function sendResponse(
  response,
  error = true,
  code = FAILED,
  data = {},
  status = 200
) {
  return response.status(status).json({
    error,
    code,
    data: data,
  });
}

module.exports = {
  sendResponse,
};
