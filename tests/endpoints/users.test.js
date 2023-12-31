import { PrismaClient, Prisma } from "@prisma/client";
import request from "supertest";
import app from "../../app.js";

async function cleanupDatabase() {
  const prisma = new PrismaClient();
  const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);

  return Promise.all(
    modelNames.map((modelName) => prisma[modelName.toLowerCase()].deleteMany())
  );
}

describe("POST /users", () => {
  const user = {
    username: "John",
    email: "john9@example.com",
    password: "insecure11",
  };

  beforeAll(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it("with valid data should return 200", async () => {
    const response = await request(app)
      .post("/users")
      .send(user)
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBeTruthy;
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    expect(response.body.password).toBe(undefined);
  });

  it("with same email should fail", async () => {
    const response = await request(app)
      .post("/users")
      .send(user)
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBeTruthy;
    expect(response.body.error.email).toBe("Email already taken");
  });

  it("with invalid password should fail", async () => {
    user.email = "unique@example.com";
    user.password = "short";
    const response = await request(app)
      .post("/users")
      .send(user)
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeTruthy;
    expect(response.body.error.password).toBe(
      "should be at least 8 characters"
    );
  });

  it("test when name is blank", async () => {
    user.username = "";
    const response = await request(app)
      .post("/users")
      .send(user.username)
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeTruthy;
    expect(response.body.error.username).toBe("cannot be blank");
  });
});
