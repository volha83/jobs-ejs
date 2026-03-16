const express = require("express");
const router = express.Router();

const {
  jobsIndex,
  jobsNewShow,
  jobsCreate,
  jobsEditShow,
  jobsUpdate,
  jobsDelete,
} = require("../controllers/jobs");

router.get("/", jobsIndex);
router.get("/new", jobsNewShow);
router.post("/", jobsCreate);
router.get("/edit/:id", jobsEditShow);
router.post("/update/:id", jobsUpdate);
router.post("/delete/:id", jobsDelete);

module.exports = router;
