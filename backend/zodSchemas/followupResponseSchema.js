import { z } from "zod";

export const followupResponseSchema = z.object({
  show: z
    .boolean()
    .describe("Whether to show the follow-up prompts to the user."),
  prompts: z
    .array(z.string().max(80))
    .max(4)
    .describe("An array of 1-4 concise follow-up questions."),
});
