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
      model: "gpt-4o-mini",
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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content generator.

Your task is to interpret user prompts and return a structured course outline in JSON format.

1. Generate a clean, meaningful course title based on the user's input. This should be suitable for display in an educational interface.It should be in 2-5 words  (e.g., "Social Science for IAS Preparation").

2. If the user input is clear and valid, set "success": true and generate:
   - "title": a cleaned-up course title.
   - "message": a short confirmation message (e.g., "Course outline generated successfully.").
   - "data": an array of 2-5 topic objects, each with 2-5 subtopics based on the topic.

3. If the user input is vague, harmful, inappropriate, or unsuitable for a course, set "success": false, and provide:
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

//user asks question-> take response from backend
const askAI = async (messages, topic, topics) => {
  // console.log(subtopics);
  console.log(topics);
  const topicsNames = topics.map((topic) => topic.name);
  const subtopics = topics.flatMap((topic) => topic.subtopics);
  const subtopicsNames = subtopics.map((subtopic) => subtopic.name);
  // console.log(subtopics);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.
You are given the following:
- A **current topic**: "${topic}"
- A **list of topics**: ${topicsNames}
- A **list of subtopics**: ${subtopicsNames}

### Instructions for Responding:

1.  **Relevance Check**:
    * You must **only** respond to the user's question if it is directly and clearly related to the **current topic** ("${topic}").
    * Alternatively, you may respond if the question falls unambiguously under one of the topics in the provided **list of topics** (${topicsNames}) or **list of subtopics** (${subtopicsNames}).

2.  **Off-Topic Response**:
    * If the user's question does **not** meet the relevance criteria above, you **must** respond with the following exact phrase and nothing else:
        **"This is not related to the topic: ${topic}."**
    * Do not add any apologies, further explanations, or conversational filler if the question is off-topic.

### Output Formatting Guidelines (Crucial for Frontend Display):

1.  **General Markdown Structure**:
    * Format your entire response using clear, well-structured Markdown.
    * Use appropriate line breaks (e.g., new paragraphs for distinct ideas).
    * Employ headings, lists (bulleted or numbered), bolding, italics, etc., as needed to enhance readability and organization, especially after distinct sections or when transitioning between different points.

2.  **Mathematical and Chemical Formulas**:
    * **Mandatory for Rendering**: Any mathematical equations, chemical formulas, variables, or scientific notations included **in your response** must be enclosed in dollar-sign delimiters. This is essential for them to be correctly rendered by KaTeX on the user's screen.
    * **Inline Formulas**: For expressions, symbols, or simple formulas that appear within a line of text (e.g., $E=mc^2$, the variable $x$, or the chemical formula $H_2O$).
        * **Syntax**: Wrap the expression in single dollar signs: "$...$"
        * **Example in Markdown**: "The famous equation is $E=mc^2$. In chemistry, water is represented as $H_2O$. Let $n$ be an integer."
    * **Block Formulas**: For more complex equations, reactions, or expressions that should appear on their own dedicated line(s) for emphasis or clarity.
        * **Syntax**: Wrap the expression in double dollar signs: "$$...$$"
        * **Example in Markdown**:
            A common quadratic equation is shown below:
            $$ax^2 + bx + c = 0$$

            A chemical reaction example:
            $$\text{Zn(s)} + 2\text{HCl(aq)} \rightarrow \text{ZnCl}_2\text{(aq)} + \text{H}_2\text{(g)}$$
    * **Strict Adherence Required**: You **must** strictly follow these dollar-sign conventions for all mathematical and chemical notations. Do not output raw LaTeX commands (like "\rightarrow" or "\text{ZnCl}_2") *without* these enclosing dollar-sign delimiters. Failure to adhere to this will result in the formulas not displaying correctly on the frontend.

Now, please process the user's query based on all the instructions above.`,
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
