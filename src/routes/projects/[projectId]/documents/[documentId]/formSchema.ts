import { z } from 'zod';

export const formSchema = z.object({
  description: z.string().default(''),
  contents: z.string().default(''),
});
