import basicAuth from "express-basic-auth";

const authMiddleware = basicAuth({
  users: { admin: "password" },
  challenge: true,
});

export default authMiddleware;
