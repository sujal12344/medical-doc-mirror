import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .startsWith("mongodb", "MONGODB_URI must be a valid MongoDB connection string"),
  OPENAI_API_KEY: z.string().optional(),
});

// Check if environment validation should be bypassed (e.g. during CI/CD build step)
const shouldSkipValidation =
  process.env.SKIP_ENV_VALIDATION === "1" || process.env.SKIP_ENV_VALIDATION === "true";

function getEnv(): z.infer<typeof envSchema> {
  if (shouldSkipValidation) {
    return {
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/placeholder",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "mock-openai-key-for-ci",
    };
  }

  return envSchema.parse({
    MONGODB_URI: process.env.MONGODB_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });
}

export const env = getEnv();
