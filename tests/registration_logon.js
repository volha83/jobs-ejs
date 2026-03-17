const { app } = require("../app");
const { buildUser } = require("../util/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;
const get_chai = require("../util/get_chai");
const User = require("../models/User");

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

describe("tests for registration and logon", function () {
  it("should get the registration page", async () => {
    const { expect, request } = await get_chai();

    const res = await request.execute(app).get("/sessions/register").send();

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Enter your name");

    this.csrfToken = extractCsrfToken(res.text);
    expect(this.csrfToken).to.not.be.null;

    expect(res).to.have.property("headers");
    expect(res.headers).to.have.property("set-cookie");

    this.cookieHeader = buildCookieHeader(res.headers["set-cookie"]);
    expect(this.cookieHeader).to.not.equal("");
  });

  it("should register the user", async () => {
    const { expect, request } = await get_chai();

    this.password = faker.internet.password();
    this.user = buildUser({ password: this.password });

    const dataToPost = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    };

    const res = await request
      .execute(app)
      .post("/sessions/register")
      .set("Cookie", this.cookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");

    const newUser = await User.findOne({ email: this.user.email });
    expect(newUser).to.not.be.null;
  });

  it("should get the logon page", async () => {
    const { expect, request } = await get_chai();

    const res = await request.execute(app).get("/sessions/logon").send();

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Enter your email");

    this.logonCsrfToken = extractCsrfToken(res.text);
    expect(this.logonCsrfToken).to.not.be.null;

    this.logonCookieHeader = buildCookieHeader(res.headers["set-cookie"]);
    expect(this.logonCookieHeader).to.not.equal("");
  });

  it("should log the user on", async () => {
    const { expect, request } = await get_chai();

    const dataToPost = {
      email: this.user.email,
      password: this.password,
      _csrf: this.logonCsrfToken,
    };

    const res = await request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", this.logonCookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal("/");

    const setCookies = res.headers["set-cookie"] || [];
    const newCookies = buildCookieHeader(setCookies);

    this.authCookieHeader = mergeCookieHeaders(
      this.logonCookieHeader,
      newCookies,
    );
    expect(this.authCookieHeader).to.not.equal("");
  });

  it("should get the index page after logon", async () => {
    const { expect, request } = await get_chai();

    const res = await request
      .execute(app)
      .get("/")
      .set("Cookie", this.authCookieHeader)
      .send();

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include(this.user.name);

    this.logoffCsrfToken = extractCsrfToken(res.text);
    expect(this.logoffCsrfToken).to.not.be.null;

    const setCookies = res.headers["set-cookie"] || [];
    const refreshedCookies = buildCookieHeader(setCookies);
    this.authCookieHeader = mergeCookieHeaders(
      this.authCookieHeader,
      refreshedCookies,
    );
  });

  it("should log the user off", async () => {
    const { expect, request } = await get_chai();

    const res = await request
      .execute(app)
      .post("/sessions/logoff")
      .set("Cookie", this.authCookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .send({ _csrf: this.logoffCsrfToken });

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Click this link to logon");
  });
});
