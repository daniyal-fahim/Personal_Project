import basicAuth from "express-basic-auth";

// Basic Authentication Middleware
const basicAuthMiddleware = basicAuth({
  users: { admin: "password" },
  challenge: true,
});

export default basicAuthMiddleware;
