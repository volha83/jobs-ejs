const { app } = require("../app");
const Job = require("../models/Job");
const { seed_db, testUserPassword, buildJob } = require("../util/seed_db");
const get_chai = require("../util/get_chai");

const extractCsrfToken = (html) => {
  const textNoLineEnd = html.replaceAll("\n", "");
  const match = /name="_csrf"\s+value="(.*?)"/.exec(textNoLineEnd);
  return match ? match[1] : null;
};

const buildCookieHeader = (setCookieHeaders = []) =>
  setCookieHeaders.map((cookie) => cookie.split(";")[0]).join("; ");

const mergeCookieHeaders = (...cookieHeaders) => {
  const cookieMap = new Map();

  cookieHeaders
    .filter(Boolean)
    .flatMap((header) => header.split("; "))
    .forEach((cookie) => {
      const [name, ...rest] = cookie.split("=");
      cookieMap.set(name, `${name}=${rest.join("=")}`);
    });

  return Array.from(cookieMap.values()).join("; ");
};

describe("testing job CRUD operations", function () {
  before(async () => {
    const { expect, request } = await get_chai();

    this.test_user = await seed_db();

    let res = await request.execute(app).get("/sessions/logon").send();

    this.csrfToken = extractCsrfToken(res.text);
    expect(this.csrfToken).to.not.be.null;

    this.cookieHeader = buildCookieHeader(res.headers["set-cookie"]);
    expect(this.cookieHeader).to.not.equal("");

    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };

    res = await request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", this.cookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    const newCookies = buildCookieHeader(res.headers["set-cookie"] || []);
    this.authCookieHeader = mergeCookieHeaders(this.cookieHeader, newCookies);

    expect(this.authCookieHeader).to.not.equal("");
  });

  it("should get jobs list page with 20 jobs", async () => {
    const { expect, request } = await get_chai();

    const res = await request
      .execute(app)
      .get("/jobs")
      .set("Cookie", this.authCookieHeader)
      .send();

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");

    const pageParts = res.text.split("<tr>");
    expect(pageParts.length).to.equal(21);
  });

  it("should get new job form", async () => {
    const { expect, request } = await get_chai();

    const res = await request
      .execute(app)
      .get("/jobs/new")
      .set("Cookie", this.authCookieHeader)
      .send();

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");

    this.addJobCsrfToken = extractCsrfToken(res.text);
    expect(this.addJobCsrfToken).to.not.be.null;

    const refreshedCookies = buildCookieHeader(res.headers["set-cookie"] || []);
    this.authCookieHeader = mergeCookieHeaders(
      this.authCookieHeader,
      refreshedCookies,
    );
  });

  it("should add a job", async () => {
    const { expect, request } = await get_chai();

    const job = buildJob();

    const dataToPost = {
      company: job.company,
      position: job.position,
      status: job.status,
      _csrf: this.addJobCsrfToken,
    };

    const res = await request
      .execute(app)
      .post("/jobs")
      .set("Cookie", this.authCookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    expect(res).to.have.status(200);

    const jobs = await Job.find({ createdBy: this.test_user._id });
    expect(jobs.length).to.equal(21);
  });
});
