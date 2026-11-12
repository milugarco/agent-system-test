import { z } from 'zod';

export const ApiHealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('sistema-comercial-api'),
});

export type ApiHealthResponse = z.infer<typeof ApiHealthResponseSchema>;
