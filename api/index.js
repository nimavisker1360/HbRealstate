let appPromise;

function getApp() {
  if (!appPromise) {
    appPromise = import("../backend/app.js").then((m) => m.default);
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error("Serverless function error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }
};
