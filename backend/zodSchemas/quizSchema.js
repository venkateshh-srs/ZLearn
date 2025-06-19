import { z } from "zod";

const QuizQuestionSchema = z.object({
  id: z.string().describe("A unique identifier for the question."),
  question: z.string().describe("The text of the quiz question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four string options."),
  correct: z.number().int().min(0).max(3).describe("The 0-based index of the correct option in the 'options' array."),
});

const QuizSchema = z.object({
  success: z.boolean().describe("Indicates if the quiz generation was successful."),
  message: z.string().describe("A message regarding the quiz generation status."),
  questions: z.array(QuizQuestionSchema).describe("An array of quiz questions."),
});

export default QuizSchema;