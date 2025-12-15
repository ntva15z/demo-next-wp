import { z } from "zod";

export const envSchema = z.object({
  WORDPRESS_GRAPHQL_ENDPOINT: z.url({
    message: "WORDPRESS_GRAPHQL_ENDPOINT must be a valid URL",
  }),
  WORDPRESS_API_URL: z.url({
    message: "WORDPRESS_API_URL must be a valid URL",
  }),
  REVALIDATE_SECRET: z.string().min(32, {
    message: "REVALIDATE_SECRET must be at least 32 characters",
  }),
  NEXT_PUBLIC_SITE_URL: z.url({
    message: "NEXT_PUBLIC_SITE_URL must be a valid URL",
  }),
});

export type Env = z.infer<typeof envSchema>;

export type EnvValidationResult =
  | {
      success: true;
      data: Env;
    }
  | {
      success: false;
      error: string;
    };

export function validateEnv(envVars: Record<string, string | undefined>): EnvValidationResult {
  const result = envSchema.safeParse(envVars);

  if (!result.success) {
    const issues = result.error.issues;
    const errors = issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    return {
      success: false,
      error: `Environment validation failed:\n${errors}\n\nPlease check your .env.local file.`,
    };
  }

  return { success: true, data: result.data };
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = validateEnv({
    WORDPRESS_GRAPHQL_ENDPOINT: process.env.WORDPRESS_GRAPHQL_ENDPOINT,
    WORDPRESS_API_URL: process.env.WORDPRESS_API_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Lazy getter for env - only validates when accessed
export const env = new Proxy({} as Env, {
  get(_, prop: keyof Env) {
    return getEnv()[prop];
  },
});
