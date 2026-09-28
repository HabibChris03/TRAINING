function structuredLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
}

module.exports = structuredLogger;
