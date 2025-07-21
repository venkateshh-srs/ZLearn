import express from "express";
import cors from "cors";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import dotenv from "dotenv";
import axios from "axios";
// Import your existing Zod schemas
import courseContentSchema from "./zodSchemas/courseContentSchema.js";
import QuizSchema from "./zodSchemas/quizSchema.js";
import { followupResponseSchema } from "./zodSchemas/followupResponseSchema.js";
import { protect } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/auth.js";
import learningHistoryRoutes from "./routes/learningHistory.js";
import dbConnect from "./lib/dbConnect.js";
import cookieParser from "cookie-parser";
import { Course } from "./models/Course.js";
import { LearningHistory } from "./models/History.js";
import { nanoid } from "nanoid";
dotenv.config();
await dbConnect();
const app = express();
const allowedOrigins = [
  "https://zlearn-zeta.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/history", learningHistoryRoutes);

const port = 1235;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let inputTokens = 0;
let outputTokens = 0;
let totalTokens = 0;

const modelConfig = {
  model: "gemini-2.5-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
};

// Helper function to handle chat history for Gemini
const buildGeminiChatHistory = (messages) => {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : msg.role,
    parts: [{ text: msg.content }],
  }));
};

//generate quiz along with answers
const generateQuiz = async ({
  title,
  subtopics = [],
  questionCount = 5,
  messages = null,
}) => {
  //console.log(`Generating quiz for topic: ${title}`);
  // console.log("generate quiz");
  // console.log(title,subtopics,questionCount,messages);
  const model = genAI.getGenerativeModel({
    ...modelConfig,
    // Use JSON mode for structured output
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Indicates if the quiz generation was successful.",
          },
          message: {
            type: "string",
            description: "A message regarding the quiz generation status.",
          },
          questions: {
            type: "array",
            description: "An array of quiz questions.",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "A unique identifier for the question.",
                },
                question: {
                  type: "string",
                  description: "The text of the quiz question.",
                },
                options: {
                  type: "array",
                  description: "An array of exactly four string options.",
                  items: {
                    type: "string",
                  },
                  minItems: 4,
                  maxItems: 4,
                },
                correct: {
                  type: "integer",
                  description:
                    "The 0-based index of the correct option in the 'options' array.",
                  minimum: 0,
                  maximum: 3,
                },
              },
              required: ["id", "question", "options", "correct"],
            },
          },
        },
        required: ["success", "message", "questions"],
      },
    },
  });

  const chatHistory = messages ? messages : [];
  const prompt = messages
    ? `You are a helpful assistant designed to generate quizzes. Based on the provided topic "${title}" and the preceding conversation, create a short quiz with ${questionCount} questions along with answers. Ensure the quiz is relevant to the topic and the previous conversation. Output a valid JSON object matching the requested schema.`
    : `You are an expert quiz creator. Your task is to generate a comprehensive quiz.
           **Topic:** "${title}"
           **Subtopics to cover:** ${subtopics.join(", ")}
           **Number of Questions:** Generate exactly ${questionCount} questions.
           **Instructions:**
           - The questions should cover the provided subtopics.
           - The difficulty should be varied.
           - Ensure the entire output is a single, valid JSON object that conforms to the schema. Do not include any text or markdown before or after the JSON.
           - Ensure there are exactly 4 options for each question.
           - Ensure the 'correct' field is the 0-based index of the correct answer.`;
  // console.log(prompt);
  try {
    const result = await model.generateContent({
      contents: [...chatHistory, { role: "user", parts: [{ text: prompt }] }],
    });
    inputTokens += result.response.usageMetadata.promptTokenCount;
    outputTokens += result.response.usageMetadata.candidatesTokenCount;
    totalTokens += result.response.usageMetadata.totalTokenCount;
    // console.log("inputTokens: ", inputTokens);
    // console.log("outputTokens: ", outputTokens);
    // console.log("totalTokens: ", totalTokens);

    const jsonText = result.response.text();
    const jsonData = JSON.parse(jsonText);

    // Validate the data against the Zod schema as a final check
    const validation = QuizSchema.safeParse(jsonData);
    if (validation.success) {
      return { success: true, data: validation.data };
    } else {
      console.error(
        "Zod validation failed for quiz generation:",
        validation.error
      );
      return {
        success: false,
        message:
          "The AI's response for the quiz did not conform to the expected output schema.",
        errors: validation.error.errors,
      };
    }
  } catch (error) {
    console.error("Error during quiz generation:", error);
    return {
      success: false,
      message:
        "An unexpected error occurred during quiz generation. Please try again later.",
      error: error.message,
    };
  }
};

// streamResponse does NOT use JSON mode, as it's for free-text streaming. No changes needed here.
async function streamResponse(messages, res) {
  // ... (This function remains unchanged from the previous version)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const model = genAI.getGenerativeModel(modelConfig);
  const chatHistory = buildGeminiChatHistory(messages);

  const systemInstruction = {
    role: "model",
    parts: [
      {
        text: `You are an expert educational assistant focused on providing high-quality answers.
          **Context:**
          **Task:** Provide a comprehensive, well-formatted educational response.
          **Relevance Rules:**
          - Respond fully if the query relates to the topic, subtopics, or builds on previous conversation
          - If completely unrelated, provide a brief redirect message about the topic
          **Critical Formatting Requirements:**
          ✅ **LaTeX Math - ALWAYS use delimiters:**
          - Inline: $E=mc^2$ or $\\text{H}_2\\text{O}$
          - Display: $$\\frac{d}{dx}(x^2) = 2x$$
          - Chemical: $\\text{CO}_2 + \\text{H}_2\\text{O} \\rightarrow \\text{H}_2\\text{CO}_3$
          ❌ **Never output bare LaTeX without $ delimiters**
          **Response Quality:**
          - Use clear markdown formatting (headers, bold, lists)
          - Include concrete examples and analogies
          - Structure logically with good spacing
          - No control characters or encoding issues
          - Provide comprehensive explanations with examples when possible
          Focus only on providing the best possible educational response.`,
      },
    ],
  };

  try {
    const stream = await model.generateContentStream({
      contents: [systemInstruction, ...chatHistory],
    });

    let fullResponse = "";

    for await (const chunk of stream.stream) {
      const content = chunk.text();
      if (content) {
        fullResponse += content;
        const responseChunk = {
          choices: [{ delta: { content } }],
        };
        res.write(`data: ${JSON.stringify(responseChunk)}\n\n`);
      }
    }

    res.write(
      `data: ${JSON.stringify({
        type: "answer_complete",
        fullAnswer: fullResponse,
      })}\n\n`
    );
    res.write("data: [DONE]\n\n");
  } catch (error) {
    console.error("Streaming Error:", error);
    res.write(
      `data: ${JSON.stringify({
        error: "An error occurred during the stream.",
      })}\n\n`
    );
  } finally {
    res.end();
  }
}

async function generateCourseContents(userTopic) {
  const model = genAI.getGenerativeModel({
    ...modelConfig,
    // Use JSON mode for structured output
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          title: { type: "string" },
          message: { type: "string" },
          introduction: { type: "string" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                subtopics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      subtopics: {
                        type: "array",
                        minItems: 3,
                        maxItems: 5,
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                          },
                          required: ["id", "name"],
                        },
                      },
                    },
                    required: ["id", "name"],
                  },
                },
              },
              required: ["id", "name", "subtopics"],
            },
          },
        },
        required: ["success", "title", "message", "introduction", "data"],
      },
    },
  });

  const prompt = `
You are an expert educational content generator. Your job is to generate a structured course outline in a strict JSON format based on the user input and the provided schema.

<RULES>

1. **OUTPUT STRUCTURE**
   - Return JSON with the following fields:
     - "success": boolean
     - "title": string
     - "message": string
     - "introduction": string — a learner-focused description written in second-person perspective. Format as:
       - **Intro**: A short, friendly overview of the main course topic and why it matters.
       - **What You Will Learn**: A separate paragraph or list clearly explaining what *you* will explore and be able to do by the end of the course.
     - "data": array of 5–8 top-level topics

1. **INTRODUCTION FIELD**
   Create intoduction using markdown format.I am using react-markdown to render the text in frontend.So make sure to use markdown format with proper headings and lists.
   #### 📝 Structure:

      1. ### Intro  
        Write a short, compelling overview that answers:  
        - What is this course about?  
        - Why is it important or valuable for the learner?  
        - How will it help *you* grow personally or professionally?  
        Use friendly, encouraging, and motivational language.

      2. ### What You Will Learn  
        List 4–6 bullet points that describe key takeaways.  
        Each point should:  
        - Start with a **verb**  
        - Be concise and action-oriented  
        - Focus on what *you* will achieve by the end  

        **Examples:**  
        - Design scalable APIs with industry best practices  
        - Improve your confidence through practical speaking drills  
        - Understand the psychology behind great storytelling  
        - Build a real-world to-do app using React and Node.js  

      3. ### Final Call to Action  
        End with this line in **bold markdown**:

        **Select a topic from the sidebar to start your journey.**
      
      



2. **MANDATORY INTRODUCTION SUBTOPIC**
   - Every Topic **must begin** with a **standalone subtopic**:
     - Title: "Introduction to {Topic Name}" (or "Overview of {Topic Name}" if Topic itself is an introduction)
     - Must be the **first subtopic**.
     - Must have **no sub-subtopics**.
   - If the Topic itself is an introduction, this rule still applies.
   - This rule is **critical** and must never be skipped.

3. **SUBTOPIC STRUCTURE (Level 2)**
   - Each Topic must have 3–6 subtopics (including the required introduction).
   - Subtopics may include 2–5 sub-subtopics to go deeper.
   - If sub-subtopics are used, begin with a sub-subtopic titled "Introduction to {Subtopic Name}" — but only if that level needs context.

4. **ID STRUCTURE**
   - Use this ID format:
     - Topics: "1", "2", "3"...
     - Subtopics: "1.1", "1.2"...
     - Sub-subtopics: "1.1.1", "1.1.2"...

5. **LOGICAL FLOW**
   - The course must progress logically from beginner to advanced concepts.

6. **FAILURE HANDLING**
   - If the input is harmful, inappropriate, or too vague to generate a course:
     - "success": false
     - "message": clear explanation of the issue
     - "data": []

</RULES>

Generate a course outline for: "${userTopic}"
`;

  try {
    const result = await model.generateContent(prompt);
    const jsonText = result.response.text();
    const aiResponse = JSON.parse(jsonText);
    //console.log(aiResponse);
    inputTokens += result.response.usageMetadata.promptTokenCount;
    outputTokens += result.response.usageMetadata.candidatesTokenCount;
    totalTokens += result.response.usageMetadata.totalTokenCount;
    // console.log("inputTokens: ", inputTokens);
    // console.log("outputTokens: ", outputTokens);
    // console.log("totalTokens: ", totalTokens);
    // We can still validate with Zod as a safeguard
    // const validation = courseContentSchema.safeParse(aiResponse);

    // if (!validation.success) {
    //     // console.error("Zod validation failed for course content:", validation.error);
    //     throw new Error("The AI's response did not conform to the expected schema.");
    // }

    if (aiResponse.success) {
      return {
        success: true,
        title: aiResponse.title,
        message: aiResponse.message || "Course outline generated successfully.",
        introduction: aiResponse.introduction,
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
    return {
      success: false,
      message: "An unexpected error occurred during course generation.",
      error: error.message,
    };
  }
}

// ... (getAllSubtopicNames function remains unchanged)
const getAllSubtopicNames = (topics) => {
  const leafNames = [];
  for (const topic of topics) {
    for (const subtopic of topic?.subtopics) {
      if (subtopic?.subtopics?.length > 0) {
        for (const subSubtopic of subtopic?.subtopics) {
          leafNames.push(subSubtopic?.name);
        }
      } else {
        leafNames.push(subtopic?.name);
      }
    }
  }
  return leafNames;
};

async function getFollowupPrompts(messages) {
  const model = genAI.getGenerativeModel({
    ...modelConfig,
    // Use JSON mode for structured output
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          show: {
            type: "boolean",
            description: "Whether to show the follow-up prompts to the user.",
          },
          prompts: {
            type: "array",
            description: "An array of 1-4 concise follow-up questions.",
            items: {
              type: "string",
              maxLength: 80,
            },
            maxItems: 4,
          },
        },
        required: ["show", "prompts"],
      },
    },
  });

  // const chatHistory = buildGeminiChatHistory(messages);

  const prompt = `You are an expert educational follow-up prompt generator. Your goal is to create logical, reasoning-based follow-up questions (8-15 words).
    
    **STRATEGY:** Use logical progression (deeper exploration, application, comparison, etc.). Mix question types (Why/How, What-if, etc.).
    **LOGIC FOR "show":** Set "show" to true only if the conversation is educational and substantive with clear next steps for learning.
    **OUTPUT FORMAT:** Return a valid JSON object matching the schema, with a 'show' boolean and an array of 3-4 'prompts'.

    Based on our conversation, generate the most logical follow-up prompts.`;

  try {
    const result = await model.generateContent({
      contents: [...messages, { role: "user", parts: [{ text: prompt }] }],
    });
    let inputTokens = result.response.usageMetadata.promptTokenCount;
    let outputTokens = result.response.usageMetadata.candidatesTokenCount;
    let totalTokens = result.response.usageMetadata.totalTokenCount;
    let thoughtTokens = result.response.usageMetadata.thoughtsTokenCount;
    // console.log("followup inputTokens: ", inputTokens);
    // console.log("followup outputTokens: ", outputTokens);
    // console.log("followup thoughtTokens: ", thoughtTokens);
    // console.log("followup totalTokens: ", totalTokens);

    const jsonText = result.response.text();
    const jsonData = JSON.parse(jsonText);
    // console.log(jsonData);
    // const validation = followupResponseSchema.safeParse(jsonData);
    // console.log(validation);
    // if (validation.success) {
    //   // console.log(validation.data);
    //     return validation.data;
    // }

    return jsonData;
  } catch (error) {
    console.error("Error generating follow-up prompts:", error);
    return { show: false, prompts: [] };
  }
}

const fetchDiagramFromPSE = async (query) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX_ID;

  try {
    const res = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: apiKey,
        cx,
        q: query,
        searchType: "image",
        num: 1,
        safe: "high",
      },
    });
    console.log(res.data.items?.[0]?.link);
    return res.data.items?.[0]?.link || null;
  } catch (error) {
    console.error("Image fetch failed:", error);
    return null;
  }
};

// ... (getAnswerResponse, getAIResponse, and Express routes remain unchanged)

const getAnswerResponse = async (messages, topic, topics, customPrompt) => {
  // console.log(messages);
  const model = genAI.getGenerativeModel({
    ...modelConfig,
    tools: [
      {
        functionDeclarations: [
          {
            name: "fetch_educational_image",
            description: `Fetches a relevant educational image or diagram based on a keyword`,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "A short keyword like 'heart diagram' or 'photosynthesis image'",
                },
              },
              required: ["query"],
            },
          },
        ],
      },
    ],
  });

  const topicsNames = topics.map((topic) => topic.name).join(", ");
  const allSubtopicsNames = getAllSubtopicNames(topics).join(", ");
  // console.log("topicsNames: " , topicsNames);
  // console.log("allSubtopicsNames: " , allSubtopicsNames);
  // console.log("customPrompt: " , customPrompt);
  // If systemInstructionText contains {{sometext}}, replace with ${sometext}
  // This allows users to use {{variable}} in their custom prompt and have it interpolated with JS variables
  let promptWithTemplate = customPrompt;
  if (customPrompt) {
    promptWithTemplate = customPrompt.replace(/{{\s*(\w+)\s*}}/g, (_, v) => {
      if (v === "topicsNames") return topicsNames;
      if (v === "allSubtopicsNames") return allSubtopicsNames;
      if (v === "topic") return topic;
      // fallback: keep as is
      return `\${${v}}`;
    });
  }
  // console.log("promptWithTemplate: " , promptWithTemplate);
  const systemInstructionText = promptWithTemplate
    ? promptWithTemplate
    : `You are a helpful assistant given the following context:
- A **current topic**: ${topic}
- A **list of topics**: ${topicsNames}
- A **list of all subtopics**: ${allSubtopicsNames}

### Relevance Rules
1.  **Respond if any of these are true**:
    - The query relates to the current topic, any topic/subtopic in the lists, or the conversation history.
    - The user selected text and asked for elaboration, an example, or an analogy.
    - Provide an example whenever possible, especially for topics in the "all subtopics" list.
    - Be flexible; if the query is generally related, respond to it.
2.  **Only if none of the above apply**, reply with the exact text: "This is not related to the topic: ${topic}.".
3. MOST IMPORTANT: Only generate images for this topic: ${topic} or related to this topic else reply with the exact text: "This is not related to the topic: ${topic}.".

### Output Formatting Guidelines
- Use clear Markdown (headings, bold, lists).
- Render all mathematical or scientific notations inside LaTeX delimiters.
- Inline: $E=mc^2$
- Block: 
$$
h'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x)g(x) - f(x)g(x + \\Delta x)}{\\Delta x}
$$

 - IMPORTANT: **When there is currency invloved never render it as math formuale.

### Image Generation Guidelines

1. **Purpose:** Use visuals to enhance learning, especially for topics where diagrams make understanding significantly easier.

2. **When to call "fetch_educational_image" :**
   -If visual aid heps user to understand the current query call the function otherwise dont.Always give importance for explaining things indetail along with examples if possible then focus on image/diagram.

**Summary:**  
Don't wait for the user to ask. Be proactive and thoughtful. If the concept feels visual in nature, provide a diagram **with context**.
Strictly follow all of the above rules. Now, process the user query.`;
  // console.log("systemInstructionText: " , systemInstructionText);
  const systemInstruction = {
    role: "model",
    parts: [
      {
        text: systemInstructionText,
      },
    ],
  };

  try {
    const result = await model.generateContent({
      contents: [systemInstruction, ...messages],
    });
    let inputTokens = result.response.usageMetadata.promptTokenCount;
    let outputTokens = result.response.usageMetadata.candidatesTokenCount;
    let totalTokens = result.response.usageMetadata.totalTokenCount;
    // console.log("answer inputTokens: ", inputTokens);
    // console.log("answer outputTokens: ", outputTokens);
    // console.log("answer totalTokens: ", totalTokens);
    const responseText = result.response.text();
    // console.log("responseText: " , responseText);
    // console.log(result.response.functionCalls());

    if (
      result.response.functionCalls() &&
      result.response.functionCalls().length > 0
    ) {
      console.log("function called");
      // console.log(result.response.functionCalls());

      const call = result.response.functionCalls()[0];
      const { query } = call.args;
      console.log("Function Query: ", query);
      const imageUrl = await fetchDiagramFromPSE(query);
      // const imageUrl = "https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/ogimage.png";
      const imageContext = [
        {
          role: "model",
          parts: [
            {
              functionCall: {
                name: "fetch_educational_image",
                args: {
                  query: query,
                },
              },
            },
          ],
        },
        {
          role: "function",
          parts: [
            {
              functionResponse: {
                name: "fetch_educational_image",
                response: {
                  content: imageUrl,
                },
              },
            },
          ],
        },
      ];

      return {
        success: true,
        message: responseText,
        image: imageUrl,
        imageContext: imageContext,
      };
    }

    return {
      success: true,
      message: responseText,
      image: null,
      imageContext: null,
    };
  } catch (error) {
    console.error("Error in getAnswerResponse:", error);
    return { success: false, message: "Error processing your request." };
  }
};

async function getAIResponse(messages, currentTopic, topics, customPrompt) {
  try {
    const [answerResponse, followupResponse] = await Promise.all([
      getAnswerResponse(messages, currentTopic, topics, customPrompt),
      getFollowupPrompts(messages),
    ]);

    //  console.log(answerResponse);
    return {
      success: true,
      message: answerResponse,
      followup: followupResponse,
    };
  } catch (error) {
    console.error("AI Response Error:", error);
    return {
      success: false,
      message: "I'm having trouble processing your request right now.",
      followup: { show: false, prompts: [] },
    };
  }
}

app.post("/generate-course", protect, async (req, res) => {
  // console.log("generating course");
  const topicName = req.body.topic;
  console.log("topicName", topicName);
  const publicId = req.body.publicId;
  // console.log("topicName: ", topicName);

  // check if the course is already present in the database

  try {
    const response = await generateCourseContents(topicName);
    if (!response.success) {
      return res.status(400).json({
        success: false,
        message: response.message || "Cannot create course.",
      });
    }

    const newCourseData = response;
    // console.log("newCourseData: ", newCourseData);
    //get uer id from token
    const courseData = {
      userId: req.user._id,
      title: newCourseData.title,
      topics: newCourseData.data,
      chatThreads: {
        1: [
          {
            id: 1,
            sender: "llm",
            text: newCourseData.introduction,
            thinking: false,
          },
        ],
      },
      relatedTopicsByThread: {},
      completedSubtopics: [],
      llmResponsesByTopic: {},
      quizzes: {},
      currentChat: {
        topicId: "1",
        subtopicId: null,
        subtopicName: "",
      },
    };
    if (publicId) {
      // update the existing course
      // console.log("publicId is there");
      await Course.updateOne(
        { userId: req.user._id, publicId: publicId },
        {
          $set: {
            ...courseData,
          },
        }
      );
      // console.log("updated existing course");
    } else {
      // create a new course
      courseData.publicId = nanoid(10);
      const newCourse = new Course(courseData);
      await newCourse.save();
    }

    // console.log("publicId", publicId);
    const topics = courseData.topics;
    const totalSubtopics = (topics) => {
      return (topics || []).reduce((acc, topic) => {
        return (
          acc +
          (topic.subtopics || []).reduce((subAcc, subtopic) => {
            if (subtopic?.subtopics?.length > 0) {
              return subAcc + subtopic.subtopics.length;
            } else {
              return subAcc + 1;
            }
          }, 0)
        );
      }, 0);
    };
    const totalSubtopicsLength = totalSubtopics(topics);
    // console.log("totalSubtopicsLength", totalSubtopicsLength);

    if (publicId) {
      // Update the existing course
      // console.log("updating existing course");
      await LearningHistory.updateOne(
        { userId: req.user._id, "courses.courseId": publicId },
        {
          $set: {
            "courses.$.title": newCourseData.title,
            "courses.$.totalTopics": totalSubtopicsLength,
            "courses.$.lastAccessed": new Date(),
            // Reset completedTopics if needed
            "courses.$.completedTopics": 0,
          },
        }
      );
      // also update the course
    } else {
      // Push the new course
      // console.log("pushing new course");
      // console.log("courseId: ", courseData.publicId);
      await LearningHistory.findOneAndUpdate(
        { userId: req.user._id },
        {
          $push: {
            courses: {
              courseId: courseData.publicId,
              title: newCourseData.title,
              totalTopics: totalSubtopicsLength,
              completedTopics: 0,
              lastAccessed: new Date(),
            },
          },
        },
        { upsert: true, new: true }
      );
    }

    // await history.save();
    // console.log("saved");
    const createdPublicId = courseData.publicId;
    res.status(200).json({
      success: true,
      publicId: createdPublicId,
      redirectUrl: `/course/${createdPublicId}`,
      data: response,
    });
  } catch (error) {
    console.error("Error creating learning history:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});
app.get("/get-course/:publicId", protect, async (req, res) => {
  // console.log("get course");
  const { publicId } = req.params;
  // check if the course is present in history
  const history = await LearningHistory.findOne({
    userId: req.user._id,
    "courses.courseId": publicId,
  });
  if (!history) {
    return res.status(404).json({ message: "Course not found" });
  }

  const course = await Course.findOne({ publicId });

  // update history last accessed
  const updatedHistory = await LearningHistory.findOneAndUpdate(
    { userId: req.user._id, "courses.courseId": publicId },
    { $set: { "courses.$.lastAccessed": new Date() } }
  );
  await updatedHistory.save();
  // console.log("history: ", history);
  res.status(200).json({ success: true, data: course });
});
app.get("/public/get-course/:publicId", async (req, res) => {
  // console.log("public get course");`
  const { publicId } = req.params;
  //filter chatThreads only want 1st id 1st message
  const course = await Course.findOne({ publicId }).lean();
  if (!course) return res.status(404).json({ message: "Course not found" });

  // ✅ Filter only first message from chatThreads["1"]
  const thread1 = course.chatThreads?.["1"] || course.chatThreads?.get?.("1");
  const firstMessage = thread1?.[0] || null;
  // console.log("firstMessage: ", firstMessage);

  course.chatThreads = {
    1: firstMessage ? [firstMessage] : [],
  };

  // ❌ Clear private fields
  course.currentChat = {
    topicId: 1,
    subtopicId: null,
    subtopicName: "",
  };

  course.quizzes = {};
  course.completedSubtopics = [];

  //  console.dir("course: ", course, { depth: null });
  res.status(200).json({ success: true, data: course });
});
app.post("/save-course-progress", protect, async (req, res) => {
  // console.log("gotcha");
  try {
    const { publicId, ...rest } = req.body;
    // console.dir(rest, { depth: null });

    const updated = await Course.findOneAndUpdate(
      { publicId, userId: req.user._id },
      {
        $set: {
          ...rest,
          lastAccessed: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }
    // console.log("updated: ", updated);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save course progress:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/chat", protect, async (req, res) => {
  // ... same as before
  const {
    formattedMessages,
    currentTopicName,
    topics,
    customPrompt,
    subtopicId,
    publicId,
  } = req.body;
  if (!formattedMessages || !currentTopicName || !topics) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields in request body.",
    });
  }

  const result = await getAIResponse(
    formattedMessages,
    currentTopicName,
    topics,
    null
  );
  // console.log(result);

  if (result.success) {
    let followupToSend = result.followup;
    if (
      result.message?.message?.includes("This is not related to the topic:")
    ) {
      followupToSend = { show: false, prompts: [] };
    }
    //if subtopic id is provided then update "llmResponsesByTopic"
    if (subtopicId) {
      try {
        const course = await Course.findOne({ publicId });

        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        const encodeKey = (key) => key.replace(/\./g, "__");

        course.llmResponsesByTopic.set(encodeKey(subtopicId), {
          id: Date.now() + 2,
          sender: "llm",
          text: result.message.message,
          thinking: false,
          image: result.message.image,
          imageContext: result.message.imageContext,
          prompts: result.followup?.show ? result.followup.prompts : [],
        });

        await course.save(); // 🔥 ensures it's written to DB
        //update history increase completedTopics by 1 and update lastAccessed
        const history = await LearningHistory.findOneAndUpdate(
          { userId: req.user._id, "courses.courseId": publicId },
          {
            $inc: { "courses.$.completedTopics": 1 },
            $set: { "courses.$.lastAccessed": new Date() },
          }
        );
        await history.save();

        // console.log("updated");
      } catch (error) {
        console.error("Error updating LLM response:", error);
        res.status(500).json({ success: false, message: "Server error." });
      }
    }
    res.status(200).json({
      success: true,
      message: result.message,
      followup: followupToSend,
    });
  } else {
    res.status(500).json({ success: false, message: result.message });
  }
});
app.post("/fetch-subtopic", async (req, res) => {
  // console.log("fetching subtopic");
  const { subtopicId, publicId } = req.body;
  const { formattedMessages, currentTopicName, topics, customPrompt } =
    req.body;
  const encodeKey = (key) => key.replace(/\./g, "__");

  try {
    const course = await Course.findOne({ publicId });
    // console.log("course: ", course);
    const llmResponse = course.llmResponsesByTopic.get(encodeKey(subtopicId));
    // console.log("encodeKey(subtopicId): ", encodeKey(subtopicId));
    // console.log("llmResponse: ", llmResponse);

    if (!llmResponse) {
      const result = await getAIResponse(
        formattedMessages,
        currentTopicName,
        topics,
        null
      );
      // console.log("result: ", result);
      let followupToSend = result.followup;

      if (result.success) {
        if (
          result.message?.message?.includes("This is not related to the topic:")
        ) {
          followupToSend = { show: false, prompts: [] };
        }
        //if subtopic id is provided then update "llmResponsesByTopic"
      }
      res.status(200).json({
        success: true,
        message: result.message,
        followup: followupToSend,
      });
    } else {
      // console.log("llmResponse: ", llmResponse);
      res.status(200).json({
        success: true,
        message: {
          message: llmResponse.text,
          image: llmResponse.image,
          imageContext: llmResponse.imageContext,
        },
        followup: {
          show: llmResponse.prompts.length > 0,
          prompts: llmResponse.prompts,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching subtopic:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.get("/me", protect, async (req, res) => {
  res.status(200).json({ success: true, userId: req.user._id });
});
app.post("/logout", protect, async (req, res) => {
  // console.log("logging out");
  res.clearCookie("token", {
    httpOnly: true,
    secure: true, // Only in production (HTTPS)
    sameSite: "None",
    //sameSite: "Lax", wont clear the cookie in chrome but in safari it will, read abt it
  });

  res.json({ message: "Logged out successfully" });
});

app.post("/generate-quiz", async (req, res) => {
  const { quizType, title, subtopics, questionCount, messages } = req.body;
  // console.log(req.body);

  if (!quizType || !title) {
    return res
      .status(400)
      .json({ success: false, message: "Missing quizType or title." });
  }

  if (quizType === "subtopic" && !messages) {
    return res.status(400).json({
      success: false,
      message: "Messages are required for subtopic quizzes.",
    });
  }

  if (
    (quizType === "topic" || quizType === "overall") &&
    (!subtopics || subtopics.length === 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Subtopics are required for this quiz type.",
    });
  }

  const quizConfig = {
    title,
    subtopics,
    questionCount,
    messages,
  };

  const response = await generateQuiz(quizConfig);
  if (response.success) {
    // console.log(response.data);
    res.status(200).json({ success: true, data: response.data });
  } else {
    res.status(500).json(response);
  }
});

app.post("/stream-response", async (req, res) => {
  // ... same as before
  const { messages } = req.body;
  if (!messages) {
    return res
      .status(400)
      .json({ success: false, message: "Missing messages for streaming." });
  }
  streamResponse(messages, res);
});

app.post("/get-another-image", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  const model = genAI.getGenerativeModel(modelConfig);
  const chatHistory = messages;
  // console.log(chatHistory);

  const prompt = `Based on the following conversation history, generate a new, but relevant search query for a diagram or image. The user wants another image that is different from any previous one. Provide only the search query which is then given to google search engine to get image. So give the query as a string, no extra text. Make sure the query should be different from the previous one's in the chat history but should be relevant to the topic.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }, ...chatHistory],
    });
    const imageQuery = result.response.text().trim();
    console.log(imageQuery);

    if (!imageQuery) {
      return res
        .status(500)
        .json({ error: "Could not generate an image query." });
    }

    const imageUrl = await fetchDiagramFromPSE(imageQuery);

    if (!imageUrl) {
      return res
        .status(500)
        .json({ error: "Failed to fetch image from external service." });
    }

    res.json({ imageUrl });
  } catch (error) {
    console.error("Error in /get-another-image:", error);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
