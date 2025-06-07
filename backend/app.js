import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import dotenv from "dotenv";
import courseContentSchema from "./zodSchemas/courseContentSchema.js";
import QuizSchema from "./zodSchemas/quizSchema.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 1235;
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

//generate quiz along with answers
const generateQuiz = async (topicName, messages) => {
  // // console.log(topicName, messages);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant designed to generate quizzes. Based on the provided topic "${topicName}" and the preceding conversation, create a short quiz with questions and answers. Ensure the quiz is relevant to the topic.`,
        },
        ...messages,
      ],
      response_format: zodResponseFormat(QuizSchema, "quiz_response"),
    });
    const result = JSON.parse(completion.choices[0].message.content);
    // // console.log(result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error during quiz generation:", error);
    if (error instanceof z.ZodError) {
      // Placeholder for if you add Zod validation later
      return {
        success: false,
        message:
          "The AI's response for the quiz did not conform to the expected output schema.",
        errors: error.errors,
      };
    } else if (error instanceof OpenAI.APIError) {
      return {
        success: false,
        message: `OpenAI API error during quiz generation: ${error.message}`,
        code: error.code,
        type: error.type,
      };
    } else {
      return {
        success: false,
        message:
          "An unexpected error occurred during quiz generation. Please try again later.",
        error: error.message,
      };
    }
  }
};

async function generateCourseContents(userTopic) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content generator.

Your task is to interpret user prompts and return a structured course outline in JSON format, optimized for a digital educational interface.

1. Generate a clean, meaningful course title based on the user's input. The title should be 2-5 words long and suitable for display in a learning app (e.g., "Social Science for IAS Preparation").

2. If the user input is clear and valid, set "success": true and generate:
   - "title": a cleaned-up course title.
   - "message": a short confirmation message (e.g., "Course outline generated successfully.").
  - "data": an array of 4–7 well-structured topics. Each topic must:
  - Start with an "Introduction to {Topic Name}" as the **first subtopic**, ensuring the learner understands the context before diving deeper.
  - Contain a total of 4–6 subtopics (including the introduction).
  - If a subtopic requires more elaboration, you may optionally include a **third level of hierarchy (sub-subtopics)**. Add 2–5 sub-subtopics where deeper clarification is beneficial. If using this third level, include an "Introduction to {Subtopic Name}" as the first sub-subtopic if necessary.
  - Follow a **clear chronological and logical progression**, allowing the learner to build understanding step by step.
  - **Logical & Chronological Flow:** The course structure must progress from foundational concepts and definitions, to core principles, then to practical applications, and finally to advanced or related topics. Each topic should naturally lead into the next, forming a coherent learning path.



3. If the user input is vague, harmful, inappropriate, or unsuitable for a course, set "success": false and provide:
   - "title": a cleaned-up version of the user prompt.
   - "message": a clear explanation of why content could not be generated.
   - "data": an empty array.`,
        },
        {
          role: "user",
          content: `Generate a course outline for: "${userTopic}"`,
        },
      ],
      response_format: zodResponseFormat(
        courseContentSchema,
        "unified_content_response"
      ),
    });
    // // console.log(JSON.parse(chatCompletion.choices[0].message.content));

    const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
    console.log(aiResponse);

    if (aiResponse.success) {
      return {
        success: true,
        title: aiResponse.title,
        message: aiResponse.message || "Course outline generated successfully.",
        data: aiResponse.data,
      };
    } else {
      return {
        success: false,
        message: aiResponse.message || "Invalid topic request.",
      };
    }
  } catch (error) {
    console.error("Error during content generation or validation:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message:
          "The AI's response did not conform to the expected output schema.",
        errors: error.errors,
      };
    } else if (error instanceof OpenAI.APIError) {
      return {
        success: false,
        message: `OpenAI API error: ${error.message}`,
        code: error.code,
        type: error.type,
      };
    } else {
      return {
        success: false,
        message: "An unexpected error occurred. Please try again later.",
        error: error.message,
      };
    }
  }
}
const getAllSubtopicNames = (topics) => {
  const leafNames = [];

  for (const topic of topics) {
    for (const subtopic of topic?.subtopics) {
      if (subtopic?.subtopics?.length > 0) {
        // If subtopic has sub-subtopics, collect those
        for (const subSubtopic of subtopic?.subtopics) {
          leafNames.push(subSubtopic?.name);
        }
      } else {
        // If subtopic is a leaf itself
        leafNames.push(subtopic?.name);
      }
    }
  }
  console.log(leafNames);
  return leafNames;
};

//user asks question-> take response from backend
const askAI = async (messages, topic, topics) => {
  // console.log(subtopics);
  console.log(topics);
  const topicsNames = topics.map((topic) => topic.name);
  const subtopics = topics.flatMap((topic) => topic.subtopics);
  const subtopicsNames = subtopics.map((subtopic) => subtopic.name);
  const allSubtopicsNames = getAllSubtopicNames(topics);
  console.log(subtopicsNames);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.

                You are given the following context:
                - A **current topic**: "${topic}"
                - A **list of topics**: ${topicsNames}
                - A **list of subtopics**: ${subtopicsNames}
                - A **list of all subtopics**: ${allSubtopicsNames}

                The user might also select a phrase or sentence from previous messages and ask you to elaborate on it, give an example, or provide an analogy — even if it’s unrelated to the topic.

                ---

                ### 🔍 Relevance Rules

                1. **Respond if any of these are true**:
                  - The user’s query is clearly related to the **current topic or subtopic or sub-subtopic or all subtopics**:
                  - The query is related to one of the **topics** or **subtopics** or **all subtopics** in the lists provided.
                  - The user has selected a **specific piece of text** and asked for **elaboration**, an **example**, or an **analogy** related to that text from previous messages.
                  -Provide an example whenever possible and when the user asks to explain a topic in the "all subtopics" list.
                  -Dont be too strict for checking the relevance of the query. If the query is related to the conversation history or to our "all subtopics" list then respond to it.

                2. **Only if none of the above apply**, reply with:
                  **"This is not related to the topic: ${topic}."**
                  Do **not** include anything else — no apologies or extra explanation.

                ---

                ### 🧾 Output Formatting Guidelines

                **Use Markdown formatting.**
                - Use headings, bold, italics, lists, and clear paragraph spacing.
                - Structure longer answers for clarity and readability.

                **Any equation or formula should be rendered in the following format (for Frontend)**:
                - Use single dollar signs for **inline** math/chemistry/physics or any other scientific notation: e.g., "$E=mc^2$"
                - Use double dollar signs for **block** math/chemistry/physics or any other scientific notation:
                  
                  $$
                  ax^2 + bx + c = 0
                  $$

                  $$
                  \\text{Zn(s)} + 2\\text{HCl(aq)} \\rightarrow \\text{ZnCl}_2\\text{(aq)} + \\text{H}_2\\text{(g)}
                  $$

                **Strictly follow these rules. Do not write raw LaTeX without enclosing it in dollar signs.**

                ---

                Now, process the user query according to these updated rules.`,
        },
        ...messages,
      ],
      store: true,
    });

    const result = completion.choices[0].message.content;

    console.log(result);
    return {
      success: true,
      message: result,
    };
  } catch (error) {
    console.error("Error during content generation or validation:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      error: error.message,
    };
  }
};

app.post("/generate-course", async (req, res) => {
  const topicName = req.body.topic;
  // // console.log("gotcha");
  const response = await generateCourseContents(topicName);
  //   const response = {
  //     success: true,
  //     title: "Comprehensive Angular Development",
  //     message:
  //       "This course outline covers the fundamentals and advanced concepts of Angular, suitable for both beginners and intermediate developers.",
  //     data: [
  //       {
  //         id: "1",
  //         name: "Introduction to Angular",
  //         subtopics: [
  //           { id: "1.1", name: "What is Angular?" },
  //           { id: "1.2", name: "Angular vs Other Frameworks" },
  //           { id: "1.3", name: "Setting Up the Development Environment" },
  //         ],
  //       },
  //       {
  //         id: "2",
  //         name: "Core Concepts",
  //         subtopics: [
  //           { id: "2.1", name: "Modules and Components" },
  //           { id: "2.2", name: "Templates and Data Binding" },
  //           { id: "2.3", name: "Directives and Pipes" },
  //           { id: "2.4", name: "Component Communication" },
  //         ],
  //       },
  //       {
  //         id: "3",
  //         name: "Working with Data",
  //         subtopics: [
  //           { id: "3.1", name: "Services and Dependency Injection" },
  //           { id: "3.2", name: "HTTP Client and APIs" },
  //           { id: "3.3", name: "Observables and RxJS" },
  //         ],
  //       },
  //       {
  //         id: "4",
  //         name: "Advanced Angular Concepts",
  //         subtopics: [
  //           { id: "4.1", name: "Routing and Navigation" },
  //           { id: "4.2", name: "Lazy Loading Modules" },
  //           { id: "4.3", name: "Forms (Template-driven & Reactive)" },
  //           { id: "4.4", name: "State Management with NgRx" },
  //         ],
  //       },
  //       {
  //         id: "5",
  //         name: "Deployment and Angular Ecosystem",
  //         subtopics: [
  //           { id: "5.1", name: "Testing and Debugging" },
  //           { id: "5.2", name: "Building and Optimization" },
  //           { id: "5.3", name: "Angular CLI and Tools" },
  //           { id: "5.4", name: "Deploying to Production" },
  //         ],
  //       },
  //     ],
  //   };
  // // console.log(response);

  if (response.success) {
    res.status(200).json({ success: true, data: response });
  } else {
    res.status(400).json({
      success: false,
      message: "Sorry, cannot create a learning plan for this topic.",
    });
  }
  // // console.log(response);
});

app.post("/chat", async (req, res) => {
  // // console.log(req.body);
  const messages = req.body.formattedMessages;
  const currentTopic = req.body.currentTopicName;
  const topics = req.body.topics;
  const result = await askAI(messages, currentTopic, topics);
  if (result.success) {
    res.status(200).json({ success: true, message: result.message });
  } else {
    res.status(500).json({ success: false, message: result.message });
  }
});
app.post("/generate-quiz", async (req, res) => {
  // // console.log(req.body);

  const topicName = req.body.subtopicName;
  const messages = req.body.messages;
  // // console.log("mama");

  // // console.log(topicName, messages);
  const response = await generateQuiz(topicName, messages);

  // const response = {
  //   success: true,
  //   data: [
  //     {
  //       id: "1",
  //       question: "What is the capital of France?",
  //       options: ["Paris", "London", "Berlin", "Madrid"],
  //       correct: 0,
  //     },
  //     {
  //       id: "2",
  //       question: "What is the capital of Germany?",
  //       options: ["Paris", "London", "Berlin", "Madrid"],
  //       correct: 2,
  //     },
  //     {
  //       id: "3",
  //       question: "What is the capital of Italy?",
  //       options: ["Paris", "London", "Berlin", "Madrid"],
  //       correct: 3,
  //     },
  //   ],
  // };
  res.status(200).json({ success: true, data: response });
});
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
