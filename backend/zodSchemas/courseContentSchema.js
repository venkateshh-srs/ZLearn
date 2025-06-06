import { z } from "zod";

const SubtopicSchema = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    subtopics: z.array(SubtopicSchema), // required, can be empty
  })
);

const TopicSchema = z.object({
  id: z.string(),
  name: z.string(),
  subtopics: z.array(SubtopicSchema), // required, can be empty
});

const courseContentSchema = z.object({
  success: z.boolean(),
  title: z.string(),
  message: z.string(),
  data: z.array(TopicSchema),
});

export default courseContentSchema;
