import { z } from "zod";

const SubtopicSchema = z.lazy(() =>
  z.object({
    id: z
      .string()
      .describe("The hierarchical ID of the subtopic (e.g., '1.1', '1.1.1')."),
    name: z.string().describe("The name of the subtopic."),
    subtopics: z
      .array(SubtopicSchema)
      .describe("An array for nested sub-subtopics. Can be empty."),
  })
);

const TopicSchema = z.object({
  id: z.string().describe("The top-level ID of the topic (e.g., '1', '2')."),
  name: z.string().describe("The name of the topic."),
  subtopics: z
    .array(SubtopicSchema)
    .describe("An array of subtopics within this topic. Cannot be empty."),
});

const courseContentSchema = z.object({
  success: z
    .boolean()
    .describe("Indicates if the course generation was successful."),
  title: z.string().describe("A clean, short title for the course."),
  message: z.string().describe("A short success or failure message."),
  data: z
    .array(TopicSchema)
    .describe("An array of the main topics for the course."),
});

export default courseContentSchema;
