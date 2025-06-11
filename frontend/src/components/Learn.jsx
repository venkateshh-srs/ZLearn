import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatInterface from "./ChatInterface";
import { useLocation, useNavigate } from "react-router-dom";

// Helper function to calculate total subtopics
const calculateTotalSubtopics = (topics) => {
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

function Learn() {
  const navigate = useNavigate();
  const location = useLocation();

  // Core state for the entire component
  const [currentTopicName, setCurrentTopicName] = useState(null);
  const [topics, setTopics] = useState([]);
  const [completedSubtopics, setCompletedSubtopics] = useState(new Set());
  const [chatThreads, setChatThreads] = useState({});
  const [currentChat, setCurrentChat] = useState({
    topicId: null,
    subtopicId: null,
    subtopicName: "",
  });
  const [currentTopicId, setCurrentTopicId] = useState(null);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [isZQuizActive, setIsZQuizActive] = useState(false);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load course data on mount or location change
  useEffect(() => {
    const newCourseData = location.state?.data; // From TopicInput
    const topicIdToContinue = location.state?.topicId; // From ChatHistory

    const lastActiveTopicId = localStorage.getItem("lastActiveTopicId");

    let topicToLoad = null;

    if (newCourseData) {
      topicToLoad = newCourseData.id;
      const allCourses =
        JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
      const course = {
        id: newCourseData.id,
        title: newCourseData.title,
        topics: newCourseData.data,
        chatThreads: {},
        completedSubtopics: [],
        currentChat: { topicId: null, subtopicId: null, subtopicName: "" },
        lastAccessed: new Date().toISOString(),
      };
      // console.log(course);
      allCourses[topicToLoad] = course;
      localStorage.setItem(
        "learningJourneyHistory",
        JSON.stringify(allCourses)
      );
      localStorage.setItem("lastActiveTopicId", topicToLoad);
      // Clean up location state
      navigate(location.pathname, {
        replace: true,
        state: { topicId: topicToLoad },
      });
    } else if (topicIdToContinue) {
      topicToLoad = topicIdToContinue;
      localStorage.setItem("lastActiveTopicId", topicToLoad);
    } else {
      topicToLoad = lastActiveTopicId;
    }

    if (topicToLoad) {
      const allCourses =
        JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
      const data = allCourses[topicToLoad];
      if (data) {
        setCurrentTopicName(data.title);
        setTopics(data.topics || []);
        setCompletedSubtopics(new Set(data.completedSubtopics || []));
        setChatThreads(data.chatThreads || {});
        setCurrentTopicId(data.id || null);
        setCurrentChat(
          data.currentChat || {
            topicId: null,
            subtopicId: null,
            subtopicName: "",
          }
        );
      } else {
        // If topicToLoad was specified but not found in history, go home
        navigate("/");
      }
    } else {
      // If no topic could be determined, go home
      navigate("/");
    }
  }, [location.state, navigate]);

  // Save course data on any change
  useEffect(() => {
    if (!currentTopicName) return;

    const allCourses =
      JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
    const totalSubtopics = calculateTotalSubtopics(topics);
    const progress =
      totalSubtopics > 0
        ? Math.round((completedSubtopics.size / totalSubtopics) * 100)
        : 0;

    const courseData = {
      id: currentTopicId,
      title: currentTopicName,
      topics,
      completedSubtopics: Array.from(completedSubtopics),
      chatThreads,
      currentChat,
      progress,
      lastAccessed: new Date().toISOString(),
    };

    allCourses[currentTopicId] = courseData;
    localStorage.setItem("learningJourneyHistory", JSON.stringify(allCourses));
  }, [
    currentTopicName,
    topics,
    completedSubtopics,
    chatThreads,
    currentChat,
    currentTopicId,
  ]);

  const currentMessages = chatThreads[currentChat.topicId] || [];

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
    if (completedSubtopics.has(subtopicId)) {
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
      setCurrentChat({ topicId, subtopicId, subtopicName });

      const chatHistory = chatThreads[topicId] || [];
      const userMessageText = `Let's learn about: ${subtopicName}`;
      const messageToScrollTo = chatHistory.find(
        (m) => m.text === userMessageText && m.sender === "user"
      );
      // console.log(messageToScrollTo);

      if (messageToScrollTo) {
        setScrollToMessageId(messageToScrollTo.id);
      }
      return;
    }
    setIsThinking(true);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    setCurrentChat({ topicId, subtopicId, subtopicName });

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: `Let's learn about: ${subtopicName}`,
    };

    const thinkingMessage = {
      id: Date.now() + 1,
      sender: "llm",
      text: "Thinking...",
      thinking: true,
    };

    // Get the previous messages for this topic, or start a new array
    const previousMessages = chatThreads[topicId] || [];

    setChatThreads((prevThreads) => ({
      ...prevThreads,
      [topicId]: [...previousMessages, userMessage, thinkingMessage],
    }));

    // Prepare messages for API, using the context from the correct thread
    const chatContextForApi = [...previousMessages, userMessage].filter(
      (msg) => msg.sender === "user" || (msg.sender === "llm" && !msg.thinking)
    );
    const formattedMessages = chatContextForApi.map((msg) => ({
      role: msg.sender === "llm" ? "assistant" : "user",
      content: msg.text,
    }));

    try {
      const llmReply = await getLlmResponseFromBackend(formattedMessages);
      const llmResponseMessage = {
        id: Date.now() + 2,
        sender: "llm",
        text: llmReply,
        thinking: false,
      };
      setChatThreads((prevThreads) => ({
        ...prevThreads,
        [topicId]: prevThreads[topicId].map((msg) =>
          msg.id === thinkingMessage.id ? llmResponseMessage : msg
        ),
      }));
      setCompletedSubtopics((prev) => new Set(prev).add(subtopicId));
    } catch (error) {
      console.error("Subtopic select LLM API error:", error);
      const errorMessage = {
        ...thinkingMessage,
        thinking: false,
        text: "Sorry, I couldn't process that. Please try again.",
      };
      setChatThreads((prevThreads) => ({
        ...prevThreads,
        [topicId]: prevThreads[topicId].map((msg) =>
          msg.id === thinkingMessage.id ? errorMessage : msg
        ),
      }));
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendMessage = async (messageText, quickAction = null) => {
    setIsThinking(true);
    const { topicId, subtopicName } = currentChat;

    // Do not proceed if there is no active topic
    if (!topicId) {
      setIsThinking(false);
      console.error("Cannot send message without an active topic.");
      // Optionally, update UI to inform user to select a topic
      const noTopicError = {
        id: Date.now(),
        sender: "llm",
        text: "Please select a topic from the sidebar to begin.",
      };
      setChatThreads((prev) => ({
        ...prev,
        [null]: [...(prev[null] || []), noTopicError],
      }));
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: messageText,
    };

    const thinkingMessage = {
      id: Date.now() + 1,
      sender: "llm",
      text: "Thinking...",
      thinking: true,
    };

    const previousMessages = chatThreads[topicId] || [];

    setChatThreads((prevThreads) => ({
      ...prevThreads,
      [topicId]: [...previousMessages, userMessage, thinkingMessage],
    }));

    // Prepare messages for API
    const chatContextForApi = [...previousMessages, userMessage].filter(
      (msg) => msg.sender === "user" || (msg.sender === "llm" && !msg.thinking)
    );

    const formattedMessages = chatContextForApi.map((msg) => ({
      role: msg.sender === "llm" ? "assistant" : "user",
      content: msg.text,
    }));

    if (quickAction && subtopicName) {
      formattedMessages.push({
        role: "user",
        content: `Regarding "${subtopicName}", can you ${quickAction} it?`,
      });
    }

    try {
      const llmReply = await getLlmResponseFromBackend(formattedMessages);
      const llmResponseMessage = {
        id: Date.now() + 2,
        sender: "llm",
        text: llmReply,
        thinking: false,
      };
      setChatThreads((prevThreads) => ({
        ...prevThreads,
        [topicId]: prevThreads[topicId].map((msg) =>
          msg.id === thinkingMessage.id ? llmResponseMessage : msg
        ),
      }));
    } catch (error) {
      console.error("LLM API error:", error);
      const errorMessage = {
        ...thinkingMessage,
        thinking: false,
        text: "Sorry, an error occurred. Please try again.",
      };
      setChatThreads((prevThreads) => ({
        ...prevThreads,
        [topicId]: prevThreads[topicId].map((msg) =>
          msg.id === thinkingMessage.id ? errorMessage : msg
        ),
      }));
    } finally {
      setIsThinking(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setIsThinking(true);

    // Clear progress for the current course
    setCompletedSubtopics(new Set());
    setChatThreads({});
    setCurrentChat({ topicId: null, subtopicId: null, subtopicName: "" });

    const thinkingMessage = {
      id: Date.now(),
      sender: "llm",
      text: "Generating new subtopics...",
      thinking: true,
    };

    // Temporarily update chatThreads for UI
    setChatThreads({ [null]: [thinkingMessage] });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/generate-course`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: currentTopicName }),
        }
      );
      const result = await res.json();
      if (!result.success || !result.data || !result.data.data) {
        throw new Error(result.message || "Failed to generate subtopics.");
      }

      setTopics(result.data.data); // This will trigger the save useEffect
      const successMessage = {
        id: Date.now() + 1,
        sender: "llm",
        text: `Okay, I've regenerated the subtopics for ${currentTopicName}. What would you like to learn first?`,
        thinking: false,
      };
      // After regeneration, chatThreads is reset, so we set the initial message.
      setChatThreads({ [null]: [successMessage] });
    } catch (error) {
      console.error("Error generating subtopics:", error);
      const errorMessage = {
        id: thinkingMessage.id,
        sender: "llm",
        text: `Sorry, there was an error refreshing the content: ${error.message}. Please try again.`,
        thinking: false,
      };
      setChatThreads({ [null]: [errorMessage] });
    } finally {
      setIsGenerating(false);
      setIsThinking(false);
    }
  };

  const totalSubtopics = calculateTotalSubtopics(topics);

  const progress =
    totalSubtopics > 0
      ? Math.round((completedSubtopics.size / totalSubtopics) * 100)
      : 0;

  if (!currentTopicName) {
    // Render a loading state or null while we determine the topic or redirect
    return null;
  }

  return (
    <div className="chat-root flex h-screen overflow-y- bg-main-bg">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar} // Pass the general toggleSidebar function
        topicName={currentTopicName}
        setTopicName={setCurrentTopicName}
        availableTopics={[]}
        topics={topics}
        completedSubtopics={completedSubtopics}
        onSubtopicSelect={handleSubtopicSelect}
        onRegenerate={handleRegenerate}
        progress={progress}
        totalSubtopics={totalSubtopics}
        isGenerating={isGenerating}
        isThinking={isThinking}
        setIsThinking={setIsThinking}
        isZQuizActive={isZQuizActive}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* The mobile header that was here is now integrated into ChatInterface */}
        <ChatInterface
          messages={currentMessages}
          topics={topics}
          currentChat={currentChat}
          onSendMessage={handleSendMessage}
          currentSubtopicName={currentChat.subtopicName}
          isTopicSelected={!!currentChat.subtopicId}
          mainTopicName={currentTopicName}
          toggleSidebar={toggleSidebar}
          isThinking={isThinking}
          setIsThinking={setIsThinking}
          isZQuizActive={isZQuizActive}
          setIsZQuizActive={setIsZQuizActive}
          scrollToMessageId={scrollToMessageId}
          setScrollToMessageId={setScrollToMessageId}
        />
      </div>
    </div>
  );
}

export default Learn;
