const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  // Read token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }

  // Remove "Bearer " prefix if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
    req.user = decoded; // Contains userId
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
}

module.exports = auth;
