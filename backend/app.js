import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import dotenv from "dotenv";
import courseContentSchema from "./zodSchemas/courseContentSchema.js";
import QuizSchema from "./zodSchemas/quizSchema.js";
import { followupResponseSchema } from "./zodSchemas/followupResponseSchema.js";
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
          content: `
You are an expert educational content generator.

Your job is to generate structured course outlines in strict JSON format based on user input. Follow these **non-negotiable rules** to ensure consistent and valid outputs.

### OUTPUT STRUCTURE

Return JSON with:
- "success": true | false
- "title": A clean, short course title (2–5 words)
- "message": A short success/failure note
- "data": An array of 5–8 top-level topics

---

### COURSE DESIGN RULES

1. **TOPIC STRUCTURE (Level 1)**
   - Must return **at least 5 Topics**. If the user’s input is short, **still expand into 5 meaningful topics**.
   - Each Topic must contain 3–6 subtopics.

2. **MANDATORY INTRODUCTION SUBTOPIC**
   - Every Topic **must begin** with a **standalone subtopic**:
     - Title: "Introduction to {Topic Name}" (or "Overview of {Topic Name}" if Topic itself is an introduction)
     - Must be the **first subtopic**.
     - Must have **no sub-subtopics**.
   - If the Topic itself is an introduction, this rule still applies.
   - This rule is **critical** and must never be skipped.

3. **SUBTOPIC STRUCTURE (Level 2)**
   - 3–6 subtopics per Topic (including the required introduction).
   - Subtopics can have 2–5 sub-subtopics if deeper explanation is needed.
   - If sub-subtopics are present, include "Introduction to {Subtopic Name}" as first sub-subtopic **if required**.

4. **ID STRUCTURE (Strict)**
   - Topic IDs: "1", "2", "3", ...
   - Subtopic IDs: "1.1", "1.2", "1.3", ...
   - Sub-subtopic IDs: "1.1.1", "1.1.2", ...

5. **FLOW**
   - Follow **logical and chronological progression**:
     - Start from fundamentals
     - Move to core principles
     - Then to practical examples
     - Finally to advanced/related topics

6. **FORMATTING RULES**
   - Wrap currency like "$100" as **$100**
   - Ensure clean and valid JSON (no Markdown formatting, no trailing commas)

---

### FAILURE HANDLING
If the user input is vague, harmful, or unsuitable for a course:
- "success": false
- "title": cleaned version of user input
- "message": a helpful explanation
- "data": []
`,
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

async function getFollowupPrompts(messages) {
  // Only generate follow-ups if the conversation seems educational

  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .slice(-1)[0];
  const lastAIResponse = messages
    .filter((m) => m.role === "assistant")
    .slice(-1)[0];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert educational follow-up prompt generator for a learning app. Your goal is to create the most logical, intuitive, and reasoning-based follow-up questions.

                  **PROMPT GENERATION STRATEGY:**
                  
                  1. **Logical Progression Types:**
                     - Bridge concepts: Connect current topic to related concepts
                     - Depth exploration: Dig deeper into the current topic
                     - Application thinking: How to use this knowledge
                     - Critical analysis: Question assumptions and limitations
                     - Comparative analysis: Compare with alternatives/contrasts
                     - Causal reasoning: Explore cause-effect relationships

                  2. **Reasoning Categories to Include:**
                     - **Why/How questions**: Understanding mechanisms
                     - **What-if scenarios**: Hypothetical exploration  
                     - **Comparison prompts**: Contrasting concepts
                     - **Application prompts**: Real-world usage
                     - **Troubleshooting**: Common problems/solutions
                     - **Advanced concepts**: Next-level topics

                  **QUALITY CRITERIA:**
                  - Each prompt should be 8-15 words (concise but complete)
                  - Must be directly relevant to the current conversation
                  - Should build a logical learning pathway
                  - Include action-oriented language
                  - Mix different cognitive levels (remember, understand, apply, analyze)

                  **PROMPT TYPES TO GENERATE:**
                  1. **Conceptual Deepening**: "Why does [concept] work this way?"
                  2. **Practical Application**: "How would you implement this in [scenario]?"
                  3. **Comparative Analysis**: "How does this compare to [alternative]?"
                  4. **Problem-Solving**: "What if [variable] changes?"
                  5. **Real-world Connection**: "Where do you see this used professionally?"
                  6. **Troubleshooting**: "What common mistakes should be avoided?"

                  **DECISION LOGIC FOR "show":**
                  Set "show": true ONLY when:
                  - The conversation is educational and substantive
                  - The AI provided helpful information worth expanding on
                  - There are clear logical next steps for learning
                  - The topic has depth and related concepts to explore
                  - The user seems engaged in learning (not just casual chat)

                  **PERSONALIZATION:**
                  - Adapt language complexity to user's demonstrated level
                  - Reference specific terms/concepts from the current conversation
                  - Consider the learning progression within the course structure

                  **OUTPUT FORMAT:**
                  Return JSON with exactly this structure:
                  {
                    "show": boolean,
                    "prompts": [
                      "prompt1",
                      "prompt2", 
                      "prompt3",
                      "prompt4" // optional 4th prompt for complex topics
                    ],
                    "reasoning": "Brief explanation of why these prompts were chosen"
                  }

                  **EXAMPLES OF EXCELLENT PROMPTS:**
                  - "How would this scale in enterprise applications?"
                  - "What are the performance implications of this approach?"
                  - "Can you walk through a debugging scenario?"
                  - "How does this pattern prevent common security issues?"
                  - "What are the trade-offs compared to alternatives?"
                  - "When would you choose this over simpler solutions?"`,
      },
      ...messages,
      {
        role: "user",
        content: `Based on our conversation above, generate the most logical and intuitive follow-up prompts. 
                  
                  Current context:
                  - Last question: "${lastUserMessage?.content || "N/A"}"
                  - Key concepts discussed: [Extract from conversation]
                  - Learning level demonstrated: [Assess from user's questions]
                  
                  Focus on creating prompts that:
                  1. Build naturally from what we just discussed
                  2. Help deepen understanding through reasoning
                  3. Connect to practical applications
                  4. Encourage critical thinking
                  5. Explore related concepts logically`,
      },
    ],
    response_format: zodResponseFormat(
      followupResponseSchema,
      "followup_response"
    ),
    temperature: 0.7, // Slight creativity for varied prompts
  });
  const result = JSON.parse(completion.choices[0].message.content);
  console.log(result);

  return result;
}

//user asks question-> take response from backend
const getAnswerResponse = async (messages, topic, topics) => {
  // console.log(subtopics);
  console.log(topics);
  const topicsNames = topics.map((topic) => topic.name);
  const subtopics = topics.flatMap((topic) => topic.subtopics);
  const subtopicsNames = subtopics.map((subtopic) => subtopic.name);
  const allSubtopicsNames = getAllSubtopicNames(topics);
  console.log(subtopicsNames);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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
};
async function getAIResponse(messages, currentTopic, topics) {
  try {
    // 🚀 PARALLEL API CALLS for better latency
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
  const topicName = req.body.topic;
  // // console.log("gotcha");
  const response = await generateCourseContents(topicName);
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
  console.log("gotcha");
  const messages = req.body.formattedMessages;
  const currentTopic = req.body.currentTopicName;
  const topics = req.body.topics;
  const result = await getAIResponse(messages, currentTopic, topics);
  if (result.success) {
    res.status(200).json({
      success: true,
      message: result.message,
      followup: result.followup,
    });
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
