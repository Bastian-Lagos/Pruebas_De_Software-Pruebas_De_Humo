const express = require("express");
const healthRouter = require("./routes/health");
const studyPlanRouter = require("./routes/studyPlan");

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/study-plan", studyPlanRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;