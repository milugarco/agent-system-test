import { z } from 'zod';

const EnvironmentSchema = z.object({
  API_HOST: z.string().default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().min(1).max(65_535).default(5432),
  DB_NAME: z.string().min(1).default('sistema_comercial'),
  DB_USER: z.string().min(1).default('sistema_comercial'),
  DB_PASSWORD: z.string().min(1).default('change-me-local-only'),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
});

export type AppConfig = z.infer<typeof EnvironmentSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return EnvironmentSchema.parse(environment);
}
