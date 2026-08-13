import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .startsWith("mongodb", "MONGODB_URI must be a valid MongoDB connection string"),
  OPENAI_API_KEY: z.string().optional(),
});

function getEnv(): z.infer<typeof envSchema> {
  const rawMongoUri = process.env.MONGODB_URI;
  const rawOpenAiKey = process.env.OPENAI_API_KEY;

  // Provide fallback for build step / CI when process.env values aren't injected
  const mongoUriToValidate =
    rawMongoUri && rawMongoUri.trim() !== ""
      ? rawMongoUri
      : "mongodb://127.0.0.1:27017/placeholder";

  return envSchema.parse({
    MONGODB_URI: mongoUriToValidate,
    OPENAI_API_KEY: rawOpenAiKey,
  });
}

export const env = getEnv();
