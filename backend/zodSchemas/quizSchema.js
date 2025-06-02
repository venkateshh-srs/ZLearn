import { z } from "zod";

const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).length(4), // 4 options
  correct: z.number().int().min(0).max(3), // 0-3 index
});

const QuizSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  questions: z.array(QuizQuestionSchema),
});

export default QuizSchema;
