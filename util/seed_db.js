const Job = require("../models/Job");
const User = require("../models/User");
const faker = require("@faker-js/faker").fakerEN_US;
require("dotenv").config();

const testUserPassword = faker.internet.password();

const buildJob = (overrides = {}) => ({
  company: faker.company.name(),
  position: faker.person.jobTitle(),
  status: ["interview", "declined", "pending"][Math.floor(3 * Math.random())],
  ...overrides,
});

const buildUser = (overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  ...overrides,
});

const seed_db = async () => {
  let testUser = null;
  try {
    await Job.deleteMany({});
    await User.deleteMany({});

    testUser = await User.create(buildUser({ password: testUserPassword }));

    const jobs = Array.from({ length: 20 }, () =>
      buildJob({ createdBy: testUser._id }),
    );

    await Job.insertMany(jobs);
  } catch (e) {
    console.log("database error");
    console.log(e.message);
    throw e;
  }
  return testUser;
};

module.exports = { testUserPassword, buildUser, buildJob, seed_db };
