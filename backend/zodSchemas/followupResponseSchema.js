import { z } from "zod";
export const followupResponseSchema = z.object({
  show: z.boolean(),
  prompts: z.array(z.string().max(80)).max(4),
});
