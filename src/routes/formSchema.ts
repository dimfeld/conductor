import { z } from 'zod';

export const newProjectSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
});
