const express = require("express");
const router = express.Router();
const studyPlanController = require("../controllers/studyPlanController");

router.post("/", studyPlanController.generate);

module.exports = router;