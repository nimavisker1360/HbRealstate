let appPromise;

function getApp() {
  if (!appPromise) {
    appPromise = import("../backend/app.js").then((m) => m.default);
  }
  return appPromise;
}

module.exports = async (req, res) => {
  if (req.url === "/api/health" || req.url === "/api/health/") {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasAuth0: !!process.env.AUTH0_DOMAIN,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  }

  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error("Serverless function error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        details: err.message,
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      });
    }
  }
};
