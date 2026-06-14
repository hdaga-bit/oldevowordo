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

describe("Admin API auth", () => {
  it("returns 403 without credentials", async () => {
    const response = await request(app).get("/api/admin/stats");
    expect(response.status).toBe(403);
  });

  it("returns 403 for non-allowlisted test email", async () => {
    const response = await request(app)
      .get("/api/admin/stats")
      .set("X-Test-Admin-Email", "stranger@test.com");

    expect(response.status).toBe(403);
  });

  it("returns stats for allowlisted test email", async () => {
    const response = await request(app)
      .get("/api/admin/stats")
      .set("X-Test-Admin-Email", "admin@test.com");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("users");
    expect(response.body).toHaveProperty("games");
    expect(response.body).toHaveProperty("feedback");
    expect(response.body).toHaveProperty("live");
  });

  it("returns admin profile for allowlisted email", async () => {
    const response = await request(app)
      .get("/api/admin/me")
      .set("X-Test-Admin-Email", "admin@test.com");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ isAdmin: true, email: "admin@test.com" }),
    );
  });
});

describe("Scheduled events admin API", () => {
  let createdEventId;

  it("lists scheduled events", async () => {
    const response = await request(app)
      .get("/api/admin/scheduled-events")
      .set("X-Test-Admin-Email", "admin@test.com");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it("creates a scheduled event", async () => {
    const response = await request(app)
      .post("/api/admin/scheduled-events")
      .set("X-Test-Admin-Email", "admin@test.com")
      .send({
        name: "Test Event",
        eventKey: "test_admin_event",
        mode: "duel",
        scheduleSlot: "12:00-13:00",
        timezone: "UTC",
        description: "Test only",
      });

    expect(response.status).toBe(201);
    expect(response.body.eventKey).toBe("test_admin_event");
    createdEventId = response.body.id;
  });

  it("toggles battle_ai event and reflects in public status", async () => {
    const list = await request(app)
      .get("/api/admin/scheduled-events")
      .set("X-Test-Admin-Email", "admin@test.com");

    const battleEvent = list.body.items.find((e) => e.eventKey === "ai_battle_hour");
    expect(battleEvent).toBeTruthy();

    const activate = await request(app)
      .patch(`/api/admin/scheduled-events/${battleEvent.id}`)
      .set("X-Test-Admin-Email", "admin@test.com")
      .send({ isActive: true });

    expect(activate.status).toBe(200);
    expect(activate.body.isActive).toBe(true);

    const status = await request(app).get("/api/events/status");
    expect(status.status).toBe(200);
    expect(status.body.active).toBe(true);

    await request(app)
      .patch(`/api/admin/scheduled-events/${battleEvent.id}`)
      .set("X-Test-Admin-Email", "admin@test.com")
      .send({ isActive: false });
  });

  afterAll(async () => {
    if (!createdEventId) return;
    await request(app)
      .delete(`/api/admin/scheduled-events/${createdEventId}`)
      .set("X-Test-Admin-Email", "admin@test.com");
  });
});
