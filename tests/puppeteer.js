const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword } = require("../util/seed_db");
const Job = require("../models/Job");

let testUser = null;
let page = null;
let browser = null;

describe("jobs-ejs puppeteer test", function () {
  before(async function () {
    this.timeout(10000);
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });

  after(async function () {
    this.timeout(5000);
    await browser.close();
  });

  describe("got to site", function () {
    it("should have completed a connection", async function () {});
  });

  describe("index page test", function () {
    this.timeout(10000);

    it("finds the index page logon link", async () => {
      this.logonLink = await page.waitForSelector(
        "a ::-p-text(Click this link to logon)",
      );
    });

    it("gets to the logon page", async () => {
      await this.logonLink.click();
      await page.waitForNavigation();
      await page.waitForSelector('input[name="email"]');
    });
  });

  describe("logon page test", function () {
    this.timeout(20000);

    it("resolves all the fields", async () => {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector("button ::-p-text(Logon)");
    });

    it("sends the logon", async () => {
      testUser = await seed_db();
      await this.email.type(testUser.email);
      await this.password.type(testUserPassword);
      await this.submit.click();
      await page.waitForNavigation();

      await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
    });
  });

  describe("puppeteer job operations", function () {
    this.timeout(20000);

    it("should open jobs list and show 20 entries", async function () {
      const { expect } = await import("chai");

      await page.goto("http://localhost:3000/jobs", {
        waitUntil: "networkidle0",
      });

      const html = await page.content();
      const rows = html.split("<tr>");
      expect(rows.length).to.equal(21);
    });

    it("should open new job form", async function () {
      const { expect } = await import("chai");

      await page.goto("http://localhost:3000/jobs/new", {
        waitUntil: "networkidle0",
      });

      this.companyField = await page.waitForSelector('input[name="company"]');
      this.positionField = await page.waitForSelector('input[name="position"]');
      this.statusField = await page.waitForSelector('input[name="status"]');
      this.addSubmit = await page.waitForSelector("button ::-p-text(Create)");

      expect(this.companyField).to.not.be.null;
      expect(this.positionField).to.not.be.null;
      expect(this.statusField).to.not.be.null;
      expect(this.addSubmit).to.not.be.null;
    });

    it("should add a new job and verify in db", async function () {
      const { expect } = await import("chai");

      const company = "Acme Logistics";
      const position = "Owner Operator";
      const status = "pending";

      await this.companyField.type(company);
      await this.positionField.type(position);
      await this.statusField.type(status);

      await this.addSubmit.click();
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      const jobs = await Job.find({ createdBy: testUser._id }).sort({
        createdAt: -1,
      });

      expect(jobs.length).to.equal(21);
      expect(jobs[0].company).to.equal(company);
      expect(jobs[0].position).to.equal(position);
      expect(jobs[0].status).to.equal(status);
    });
  });
});
