import React, { useState, useEffect } from "react";
import Sidebar from "./SideBar";
import ChatInterface from "./ChatInterface";
import { courseTopics } from "../data/courseTopics";
// import generateNewSubtopics from "../data/regenerateTopics";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Learn() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  const [currentTopicName, setCurrentTopicName] = useState("Machine Learning");
  const [topics, setTopics] = useState(courseTopics["Machine Learning"]);
  const [completedSubtopics, setCompletedSubtopics] = useState(new Set());
  const [currentChat, setCurrentChat] = useState({
    topicId: null,
    subtopicId: null,
    subtopicName: "",
  });
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // const validTopics = Object.keys(courseTopics);

  useEffect(() => {
    // console.log(location.state.data);
    if (location.state?.data) {
      setCurrentTopicName(location.state.data.title);
      // console.log(location.state.data.title);

      setTopics(location.state.data.data);
      // console.log(location.state.data.data);
    } else {
      navigate("/");
    }
  }, [location.state]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen); // Consolidated toggle function

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // setTopics(courseTopics[currentTopicName]);
    setCompletedSubtopics(new Set());
    setMessages([]);
    setCurrentChat({ topicId: null, subtopicId: null, subtopicName: "" });
  }, [currentTopicName]);
  const getLlmResponseFromBackend = async (formattedMessages) => {
    // Intentionally delay for testing
    // await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formattedMessages,
          currentTopicName, // extra field
          topics,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return result.message;
      } else {
        throw new Error(result.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Error in LLM call:", error);
      throw error; // Re-throw to be caught by calling function
    }
  };
  const handleSubtopicSelect = async (topicId, subtopicId, subtopicName) => {
    setIsThinking(true);
    setCurrentChat({ topicId, subtopicId, subtopicName });

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: `Let's learn about: ${subtopicName}`,
    };

    const thinkingMessageId = Date.now() + 1;
    const thinkingMessage = {
      id: thinkingMessageId,
      sender: "llm",
      text: "Thinking...",
      thinking: true,
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      thinkingMessage,
    ]);

    // Prepare messages for API, excluding any previous "Thinking..." or error messages not from user/llm
    const chatContextForApi = messages.filter(
      (msg) => msg.sender === "user" || (msg.sender === "llm" && !msg.thinking)
    );
    const formattedMessages = [...chatContextForApi, userMessage].map(
      (msg) => ({
        role: msg.sender === "llm" ? "assistant" : "user",
        content: msg.text,
      })
    );

    try {
      const llmReply = await getLlmResponseFromBackend(formattedMessages);
      const llmResponseMessage = {
        id: Date.now() + 2, // Ensure unique ID
        sender: "llm",
        text: llmReply,
        thinking: false,
      };
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === thinkingMessageId ? llmResponseMessage : msg
        )
      );
      setCompletedSubtopics((prev) => new Set(prev).add(subtopicId));
    } catch (error) {
      console.error("Subtopic select LLM API error:", error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === thinkingMessageId
            ? {
                ...msg,
                thinking: false,
                text: "Sorry, I couldn't process that. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsThinking(false);
    }

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async (messageText, quickAction = null) => {
    setIsThinking(true);
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: messageText,
    };

    const thinkingId = Date.now() + 1; // Unique ID for the thinking message
    const thinkingMessage = {
      id: thinkingId,
      sender: "llm",
      text: "Thinking...",
      thinking: true,
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      thinkingMessage,
    ]);

    // Prepare messages for API, excluding any previous "Thinking..." or error messages not from user/llm
    const chatContextForApi = messages.filter(
      (msg) => msg.sender === "user" || (msg.sender === "llm" && !msg.thinking)
    );
    let currentMessagesForApi = [...chatContextForApi, userMessage];

    const formattedMessages = currentMessagesForApi.map((msg) => ({
      role: msg.sender === "llm" ? "assistant" : "user",
      content: msg.text,
    }));

    if (quickAction && currentChat?.subtopicName) {
      formattedMessages.push({
        role: "user", // This is a contextual instruction for the LLM
        content: `Regarding "${currentChat.subtopicName}", can you ${quickAction} it?`,
      });
    }

    try {
      const llmReply = await getLlmResponseFromBackend(formattedMessages);
      const llmResponseMessage = {
        id: Date.now() + 2, // Ensure unique ID
        sender: "llm",
        text: llmReply,
        thinking: false,
      };
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === thinkingId ? llmResponseMessage : msg
        )
      );
    } catch (error) {
      console.error("LLM API error:", error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === thinkingId
            ? {
                ...msg,
                thinking: false,
                text: "Sorry, an error occurred. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsThinking(false);
    }
  };
  const generateNewSubtopics = async (topicName) => {
    // console.log("called");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/generate-course`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topicName }),
      }
    );

    const result = await res.json();
    if (!result.success || !result.data || !result.data.data) {
      throw new Error(
        result.message ||
          "Failed to generate subtopics: Invalid response from server."
      );
    }
    setTopics(result.data.data);
    // console.log(result.data.data);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true); // Used for the sidebar refresh icon animation
    setIsThinking(true); // General thinking state to disable other inputs

    const thinkingMessage = {
      id: Date.now(), // Unique ID
      sender: "llm", // Changed back to llm to avoid system styling if not desired for this
      text: "Generating new subtopics...",
      thinking: true,
    };
    setMessages([thinkingMessage]);
    setCurrentChat({ topicId: null, subtopicId: null, subtopicName: "" });
    setCompletedSubtopics(new Set());

    try {
      await generateNewSubtopics(currentTopicName);
      const successMessage = {
        id: Date.now() + 1, // Ensure unique ID
        sender: "llm",
        text: `Okay, I've regenerated the subtopics for ${currentTopicName}. What would you like to learn first?`,
        thinking: false,
      };
      setMessages([successMessage]); // Replace thinking message with success
    } catch (error) {
      console.error("Error generating subtopics:", error);
      const errorMessage = {
        id: thinkingMessage.id, // Reuse ID to replace the thinking message
        sender: "llm", // Or "system" if preferred for errors
        text: `Sorry, there was an error refreshing the content: ${error.message}. Please try again.`,
        thinking: false,
      };
      setMessages([errorMessage]); // Replace thinking message with error
    } finally {
      setIsGenerating(false);
      setIsThinking(false);
    }
  };

  const totalSubtopics = topics.reduce(
    (acc, topic) => acc + topic.subtopics.length,
    0
  );
  const progress =
    totalSubtopics > 0 ? (completedSubtopics.size / totalSubtopics) * 100 : 0;

  return (
    <div className="flex h-screen bg-main-bg">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar} // Pass the general toggleSidebar function
        topicName={currentTopicName}
        setTopicName={setCurrentTopicName}
        availableTopics={Object.keys(courseTopics)}
        topics={topics}
        completedSubtopics={completedSubtopics}
        onSubtopicSelect={handleSubtopicSelect}
        onRegenerate={handleRegenerate}
        progress={progress}
        totalSubtopics={totalSubtopics}
        isGenerating={isGenerating}
        isThinking={isThinking}
        setIsThinking={setIsThinking}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* The mobile header that was here is now integrated into ChatInterface */}
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          currentSubtopicName={currentChat.subtopicName}
          isTopicSelected={!!currentChat.subtopicId}
          mainTopicName={currentTopicName}
          toggleSidebar={toggleSidebar}
          isThinking={isThinking}
          setIsThinking={setIsThinking}
        />
      </div>
    </div>
  );
}

export default Learn;
