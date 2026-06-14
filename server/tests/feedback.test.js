import request from "supertest";
import { closeRoomStore } from "../room-store.js";

let app;
let httpServer;

beforeAll(async () => {
  process.env.SKIP_AUTH_SETUP = "true";
  process.env.NODE_ENV = "test";
  process.env.ADMIN_EMAILS = "admin@test.com";
  const serverModule = await import("../index.js");
  app = serverModule.app;
  httpServer = serverModule.httpServer;
}, 30_000);

afterAll(async () => {
  if (httpServer?.listening) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  await closeRoomStore();
});

const validPayload = {
  category: "feature",
  message: "Please add a dark mode toggle in settings.",
  pageUrl: "http://localhost:5173/",
};

describe("POST /api/feedback", () => {
  it("rejects missing message", async () => {
    const response = await request(app)
      .post("/api/feedback")
      .send({ category: "bug", message: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/at least 10 characters/i);
  });

  it("rejects short message", async () => {
    const response = await request(app)
      .post("/api/feedback")
      .send({ category: "bug", message: "too short" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/at least 10 characters/i);
  });

  it("rejects invalid category", async () => {
    const response = await request(app)
      .post("/api/feedback")
      .send({ category: "spam", message: validPayload.message });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid category/i);
  });

  it("rejects XSS-like message", async () => {
    const response = await request(app)
      .post("/api/feedback")
      .send({
        category: "bug",
        message: '<script>alert("xss")</script> extra text here',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid message/i);
  });

  it("accepts valid payload and returns id", async () => {
    const response = await request(app)
      .post("/api/feedback")
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({ ok: true, id: expect.any(String) }),
    );
  });
});

describe("GET /api/admin/feedback", () => {
  it("returns 403 without admin session", async () => {
    const response = await request(app).get("/api/admin/feedback");
    expect(response.status).toBe(403);
  });
});
