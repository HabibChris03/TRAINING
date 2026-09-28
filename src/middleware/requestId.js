const crypto = require("crypto");

function requestId(req, res, next) {
  // Use existing X-Request-Id header if provided by client/proxy, otherwise generate a new UUID
  const id = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

module.exports = requestId;
