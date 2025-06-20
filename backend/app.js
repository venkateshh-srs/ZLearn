import express from "express";
import cors from "cors";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import dotenv from "dotenv";

// Import your existing Zod schemas
import courseContentSchema from "./zodSchemas/courseContentSchema.js";
import QuizSchema from "./zodSchemas/quizSchema.js";
import { followupResponseSchema } from "./zodSchemas/followupResponseSchema.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 1235;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelConfig = {
    // Using gemini-1.5-flash-latest for a balance of speed and capability
    model: "gemini-2.0-flash",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
};

// Helper function to handle chat history for Gemini
const buildGeminiChatHistory = (messages) => {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));
};

//generate quiz along with answers
const generateQuiz = async (topicName, messages) => {
    // 
  //console.log(`Generating quiz for topic: ${topicName}`);
  const model = genAI.getGenerativeModel({
      ...modelConfig,
      // Use JSON mode for structured output
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "description": "Indicates if the quiz generation was successful."
      },
      "message": {
        "type": "string",
        "description": "A message regarding the quiz generation status."
      },
      "questions": {
        "type": "array",
        "description": "An array of quiz questions.",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "A unique identifier for the question."
            },
            "question": {
              "type": "string",
              "description": "The text of the quiz question."
            },
            "options": {
              "type": "array",
              "description": "An array of exactly four string options.",
              "items": {
                "type": "string"
              },
              "minItems": 4,
              "maxItems": 4
            },
            "correct": {
              "type": "integer",
              "description": "The 0-based index of the correct option in the 'options' array.",
              "minimum": 0,
              "maximum": 3
            }
          },
          "required": [
            "id",
            "question",
            "options",
            "correct"
          ]
        }
      }
    },
    "required": [
      "success",
      "message",
      "questions"
    ]
  }
      }
  });

  const chatHistory = buildGeminiChatHistory(messages);

  try {
      const result = await model.generateContent([
          `You are a helpful assistant designed to generate quizzes. Based on the provided topic "${topicName}" and the preceding conversation, create a short quiz with questions and answers. Ensure the quiz is relevant to the topic. Output a valid JSON object matching the requested schema.`,
          ...chatHistory
      ]);
      
      const jsonText = result.response.text();
      const jsonData = JSON.parse(jsonText);

      // Validate the data against the Zod schema as a final check
      const validation = QuizSchema.safeParse(jsonData);
      if (validation.success) {
          return { success: true, data: validation.data };
      } else {
          console.error("Zod validation failed for quiz generation:", validation.error);
          return {
              success: false,
              message: "The AI's response for the quiz did not conform to the expected output schema.",
              errors: validation.error.errors,
          };
      }

  } catch (error) {
      console.error("Error during quiz generation:", error);
      return {
          success: false,
          message: "An unexpected error occurred during quiz generation. Please try again later.",
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
      role: 'model',
      parts: [{
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
          Focus only on providing the best possible educational response.`
      }]
  };

  try {
      const stream = await model.generateContentStream({
        contents: [systemInstruction, ...chatHistory]
      });

      let fullResponse = "";

      for await (const chunk of stream.stream) {
          const content = chunk.text();
          if (content) {
              fullResponse += content;
              const responseChunk = {
                  choices: [{ delta: { content } }]
              };
              res.write(`data: ${JSON.stringify(responseChunk)}\n\n`);
          }
      }

      res.write(`data: ${JSON.stringify({
          type: "answer_complete",
          fullAnswer: fullResponse
      })}\n\n`);
      res.write("data: [DONE]\n\n");
  } catch (error) {
      console.error("Streaming Error:", error);
      res.write(`data: ${JSON.stringify({
          error: "An error occurred during the stream."
      })}\n\n`);
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
      responseSchema:{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "title": { "type": "string" },
    "message": { "type": "string" },
    "introduction": { "type": "string" },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "subtopics": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "name": { "type": "string" },
                "subtopics": {
                  "type": "array",
                  "minItems": 3,
                  "maxItems": 5,
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "string" },
                      "name": { "type": "string" }
                    },
                    "required": ["id", "name"]
                  }
                }
              },
              "required": ["id", "name"]
            }
          }
        },
        "required": ["id", "name", "subtopics"]
      }
    }
  },
  "required": ["success", "title", "message", "introduction", "data"]
}


}

    
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
   - Add a top-level "introduction" field — written in second-person ("you"/"your") perspective.
   - Format:
     - **Intro**: A short, engaging overview of the main course topic and why it matters to you.
     - **What You Will Learn**: A separate paragraph (or bullet points) describing what *you* will explore and achieve in this course.
   - At the end of the introduction, append this line in **bold markdown**:  
     "**Select a topic from the sidebar to start your journey.**"

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
    "type": "object",
    "properties": {
      "show": {
        "type": "boolean",
        "description": "Whether to show the follow-up prompts to the user."
      },
      "prompts": {
        "type": "array",
        "description": "An array of 1-4 concise follow-up questions.",
        "items": {
          "type": "string",
          "maxLength": 80
        },
        "maxItems": 4
      }
    },
    "required": [
      "show",
      "prompts"
    ]
  }
        }
    });

    const chatHistory = buildGeminiChatHistory(messages);

    const prompt = `You are an expert educational follow-up prompt generator. Your goal is to create logical, reasoning-based follow-up questions (8-15 words).
    
    **STRATEGY:** Use logical progression (deeper exploration, application, comparison, etc.). Mix question types (Why/How, What-if, etc.).
    **LOGIC FOR "show":** Set "show" to true only if the conversation is educational and substantive with clear next steps for learning.
    **OUTPUT FORMAT:** Return a valid JSON object matching the schema, with a 'show' boolean and an array of 3-4 'prompts'.

    Based on our conversation, generate the most logical follow-up prompts.`;

    try {
        const result = await model.generateContent({
            contents: [...chatHistory, { role: 'user', parts: [{ text: prompt }] }],
        });

        const jsonText = result.response.text();
        const jsonData = JSON.parse(jsonText);
        
        const validation = followupResponseSchema.safeParse(jsonData);
        if (validation.success) {
            return validation.data;
        }
        
        return { show: false, prompts: [] };

    } catch (error) {
        console.error("Error generating follow-up prompts:", error);
        return { show: false, prompts: [] };
    }
}

// ... (getAnswerResponse, getAIResponse, and Express routes remain unchanged)
const getAnswerResponse = async (messages, topic, topics) => {
    // This function returns free-form text, so no JSON mode needed.
    // It remains unchanged.
    const model = genAI.getGenerativeModel(modelConfig);
    const chatHistory = buildGeminiChatHistory(messages);

    const topicsNames = topics.map((topic) => topic.name);
    const allSubtopicsNames = getAllSubtopicNames(topics);

    const systemInstruction = {
        role: "model",
        parts: [{
            text: `You are a helpful assistant given the following context:
- A **current topic**: "${topic}"
- A **list of topics**: ${topicsNames.join(", ")}
- A **list of all subtopics**: ${allSubtopicsNames.join(", ")}

### 🔍 Relevance Rules
1.  **Respond if any of these are true**:
    - The query relates to the current topic, any topic/subtopic in the lists, or the conversation history.
    - The user selected text and asked for elaboration, an example, or an analogy.
    - Provide an example whenever possible, especially for topics in the "all subtopics" list.
    - Be flexible; if the query is generally related, respond to it.
2.  **Only if none of the above apply**, reply with the exact text: "This is not related to the topic: ${topic}."

### 🧾 Output Formatting Guidelines
- Use clear Markdown (headings, bold, lists).
- Render all mathematical or scientific notations inside LaTeX delimiters.
- Inline: $E=mc^2$
- Block: $$\\text{Zn(s)} + 2\\text{HCl(aq)} \\rightarrow \\text{ZnCl}_2\\text{(aq)} + \\text{H}_2\\text{(g)}$$
- IMPORTANT: Write dollar amounts as \\$10,000 (double backslash) to prevent math rendering conflicts.
- Strictly follow these rules. Now, process the user query.`
        }]
    };

    try {
        const result = await model.generateContent({
            contents: [systemInstruction, ...chatHistory]
        });
        const responseText = result.response.text();
        return { success: true, message: responseText };
    } catch (error) {
        console.error("Error in getAnswerResponse:", error);
        return { success: false, message: "Error processing your request." };
    }
};

async function getAIResponse(messages, currentTopic, topics) {
  try {
    const [answerResponse, followupResponse] = await Promise.all([
      getAnswerResponse(messages, currentTopic, topics),
      getFollowupPrompts(messages),
    ]);

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

app.post("/generate-course", async (req, res) => {
    // ... same as before
    const topicName = req.body.topic;
    if (!topicName) {
        return res.status(400).json({ success: false, message: "Topic name is required." });
    }
    const response = await generateCourseContents(topicName);
    if (response.success) {
      res.status(200).json({ success: true, data: response });
    } else {
      res.status(400).json({
        success: false,
        message: response.message || "Sorry, cannot create a learning plan for this topic.",
      });
    }
});

app.post("/chat", async (req, res) => {
    // ... same as before
    const { formattedMessages, currentTopicName, topics } = req.body;
    if (!formattedMessages || !currentTopicName || !topics) {
        return res.status(400).json({ success: false, message: "Missing required fields in request body." });
    }

    const result = await getAIResponse(formattedMessages, currentTopicName, topics);

    if (result.success) {
        let followupToSend = result.followup;
        if (result.message?.message?.includes("This is not related to the topic:")) {
            followupToSend = { show: false, prompts: [] };
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

app.post("/generate-quiz", async (req, res) => {
    // ... same as before
    const { subtopicName, messages } = req.body;
    if (!subtopicName || !messages) {
        return res.status(400).json({ success: false, message: "Missing subtopic name or messages." });
    }
    const response = await generateQuiz(subtopicName, messages);
    if (response.success) {
        res.status(200).json({ success: true, data: response });
    } else {
        res.status(500).json(response);
    }
});

app.post("/stream-response", async (req, res) => {
    // ... same as before
    const { messages } = req.body;
    if (!messages) {
        return res.status(400).json({ success: false, message: "Missing messages for streaming." });
    }
    streamResponse(messages, res);
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});