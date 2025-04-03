import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased rate limit for scalability
});

export default limiter;
