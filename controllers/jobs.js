const Job = require("../models/Job");
const parseVErr = require("../util/parseValidationErr");

const jobsIndex = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id }).sort({
    createdAt: -1,
  });
  res.render("jobs", { jobs });
};

const jobsNewShow = (req, res) => {
  res.render("job", { job: null });
};

const jobsCreate = async (req, res, next) => {
  try {
    await Job.create({
      company: req.body.company,
      position: req.body.position,
      status: req.body.status,
      createdBy: req.user._id,
    });
    req.flash("info", "Job was created.");
    return res.redirect("/jobs");
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
      return res.render("job", { job: null, errors: req.flash("error") });
    }
    return next(e);
  }
};

const jobsEditShow = async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }
  res.render("job", { job });
};

const jobsUpdate = async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!job) {
      req.flash("error", "Job not found.");
      return res.redirect("/jobs");
    }

    job.company = req.body.company;
    job.position = req.body.position;
    job.status = req.body.status;

    await job.save();

    req.flash("info", "Job was updated.");
    return res.redirect("/jobs");
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
      const job = await Job.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
      });
    
      if (!job) return res.redirect("/jobs");
      return res.render("job", { job, errors: req.flash("error") });
    }
    return next(e);
  }
};

const jobsDelete = async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }

  await Job.deleteOne({ _id: req.params.id, createdBy: req.user._id });
  req.flash("info", "Job was deleted.");
  res.redirect("/jobs");
};

module.exports = {
  jobsIndex,
  jobsNewShow,
  jobsCreate,
  jobsEditShow,
  jobsUpdate,
  jobsDelete,
};
