import React, { useState, useEffect,useRef } from "react";
import Sidebar from "./Sidebar";
import ChatInterface from "./ChatInterface";
import { useLocation, useNavigate } from "react-router-dom";

function Learn() {
  const navigate = useNavigate();
  const location = useLocation();
  const abortControllerRef = useRef(null);
  // Core state for the entire component
  const [currentTopicName, setCurrentTopicName] = useState(null);
  const [topics, setTopics] = useState([]);
  const [completedSubtopics, setCompletedSubtopics] = useState(new Set());
  const [chatThreads, setChatThreads] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [currentChat, setCurrentChat] = useState({
    topicId: null,
    subtopicId: null,
    subtopicName: "",
  });
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [currentStream, setCurrentStream] = useState("");
  const [thinkingMessageActive, setThinkingMessageActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [relatedTopicsByThread, setRelatedTopicsByThread] = useState({});
  const [stoppedThinking, setStoppedThinking] = useState(false);
  // Load course data on mount or location change
  useEffect(() => {
    const newCourseData = location.state?.data; // From TopicInput
    //console.log(newCourseData);
    const topicIdToContinue = location.state?.topicId; // From ChatHistory
    //console.log(topicIdToContinue);
    const lastActiveTopicId = localStorage.getItem("lastActiveTopicId");

    let topicToLoad = null;

    if (newCourseData) {
      topicToLoad = newCourseData.id;
      const allCourses =
        JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
      // //console.log(allCourses);
      const course = {
        id: newCourseData.id,
        title: newCourseData.title,
        topics: newCourseData.data,
        chatThreads: {1:[{id:1,sender:"llm",text:newCourseData.introduction,thinking:false}]},
        relatedTopicsByThread: {},
        completedSubtopics: [],
        quizzes: {},
        currentChat: { topicId: 1, subtopicId: null, subtopicName: "" },
        lastAccessed: new Date().toISOString(),
      };
      // //console.log(course);
      allCourses[topicToLoad] = course;
      localStorage.setItem(
        "learningJourneyHistory",
        JSON.stringify(allCourses)
      );
      localStorage.setItem("lastActiveTopicId", topicToLoad);
      // //console.log(localStorage.getItem("lastActiveTopicId"));
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
        setQuizzes(data.quizzes || {});
        setCurrentTopicId(data.id || null);
        setRelatedTopicsByThread(data.relatedTopicsByThread || {});
        setCurrentChat(
          data.currentChat || {
            topicId: 1,
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
      quizzes,
      relatedTopicsByThread,
      currentChat,
      progress,
      lastAccessed: new Date().toISOString(),
    };

    allCourses[currentTopicId] = courseData;
    localStorage.setItem("learningJourneyHistory", JSON.stringify(allCourses));
    // console.log(JSON.parse(localStorage.getItem("learningJourneyHistory")));
  }, [
    currentTopicName,
    topics,
    completedSubtopics,
    chatThreads,
    quizzes,
    relatedTopicsByThread,
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

  const handleStopThinking = () => {
    //console.log("stop thinking");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  const streamLLMResponse = async (formattedMessages) => {
    setCurrentStream("");
    //console.log("got it");
    

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/stream-response`,
      {
        method: "POST",
        body: JSON.stringify({ messages: formattedMessages }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Parse SSE format
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));
      for (const line of lines) {
        // //console.log(line);

        const json = line.replace(/^data: /, "");
        if (json === "[DONE]") break;

        try {
          const parsed = JSON.parse(json);
          const token = parsed.choices?.[0]?.delta?.content || "";
          setCurrentStream((prev) => prev + token);
          //console.log(currentStream);
        } catch (err) {
          console.error("Error parsing chunk", err);
        }
      }
    }
  };
  const getLLMResponse = async (formattedMessages) => {
    // Intentionally delay for testing
    // await new Promise(resolve => setTimeout(resolve, 2000));
    // setCurrentStream("");
    // await streamLLMResponse(formattedMessages);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal; 
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
        signal,
      });

      const result = await response.json();
      //console.log(result);

      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || "Failed to get response");
      }
    } catch (error) {
      // console.error("Error in LLM call:", error);
      throw error; // Re-throw to be caught by calling function
    }
  };
  const handleSubtopicSelect = async (topicId, subtopicId, subtopicName) => {
    setStoppedThinking(false);
    setErrorMessage("");
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
      // //console.log(messageToScrollTo);

      if (messageToScrollTo) {
        setScrollToMessageId(messageToScrollTo.id);
      }
      return;
    }
    setIsThinking(true);
    setThinkingMessageActive(true);
    setRelatedTopicsByThread((prev) => ({ ...prev, [topicId]: [] }));
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
      [topicId]: [...previousMessages, userMessage],
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
      const llmReply = await getLLMResponse(formattedMessages);
      const llmResponseMessage = {
        id: Date.now() + 2,
        sender: "llm",
        text: llmReply.message.message,
        thinking: false,
      };

      if (llmReply.followup.show) {
        // setRelatedTopicsByThread((prev) => ({
        //   ...prev,
        //   [topicId]: llmReply.followup.prompts,
        // }));
        llmResponseMessage.prompts = llmReply.followup.prompts;
      }
      setChatThreads((prevThreads) => ({
        ...prevThreads,
        [topicId]: [...prevThreads[topicId], llmResponseMessage],
      }));
      setCompletedSubtopics((prev) => new Set(prev).add(subtopicId));
    } catch (error) {
      // console.error("Subtopic select LLM API error:", error);
      setErrorMessage("Sorry, an error occurred. Please try again.");
    } finally {
      setIsThinking(false);
      setThinkingMessageActive(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (messageText, quickAction = null) => {
    setStoppedThinking(false);
    setIsThinking(true);
    setThinkingMessageActive(true);
    setErrorMessage("");
    const { topicId, subtopicName } = currentChat;
    setRelatedTopicsByThread((prev) => ({ ...prev, [topicId]: [] }));

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
      [topicId]: [...previousMessages, userMessage],
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
      const llmReply = await getLLMResponse(formattedMessages);
      // //console.log(llmReply);

      const llmResponseMessage = {
        id: Date.now() + 2,
        sender: "llm",
        text: llmReply.message.message,
        thinking: false,
      };

      if (llmReply.followup.show) {
        // setRelatedTopicsByThread((prev) => ({
        //   ...prev,
        //   [topicId]: llmReply.followup.prompts,
        // }));
        // //console.log(llmReply.followup.prompts);

        llmResponseMessage.prompts = llmReply.followup.prompts;
      }
      // //console.log(llmResponseMessage);

      setChatThreads((prevThreads) => ({
        ...prevThreads,
        [topicId]: [...prevThreads[topicId], llmResponseMessage],
      }));
    } catch (error) {
      // console.error("LLM API error:", error);
      setErrorMessage("Sorry, an error occurred. Please try again.");
      setStoppedThinking(true);
    } finally {
      setIsThinking(false);
      setThinkingMessageActive(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setIsThinking(true);
    setStoppedThinking(false);
    setErrorMessage("");
    // Clear progress for the current course
    setCompletedSubtopics(new Set());
    setChatThreads({});
    setQuizzes({});
    setCurrentChat({ topicId: 1, subtopicId: null, subtopicName: "" });
    setRelatedTopicsByThread({});
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal; 
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/generate-course`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: currentTopicName }),
          signal,
        }
      );
      const result = await res.json();
      if (!result.success || !result.data || !result.data.data) {
        throw new Error(result.message || "Failed to generate subtopics.");
      }
      //console.log(result);
      setTopics(result.data.data); // This will trigger the save useEffect
      const successMessage = {
        id: Date.now() + 1,
        sender: "llm",
        text: `${result.data.introduction} What would you like to learn first? please select a subtopic from the sidebar to begin`,
        thinking: false,
      };
      // After regeneration, chatThreads is reset, so we set the initial message.
      setChatThreads({ 1:[{id:1,sender:"llm",text:result.data.introduction,thinking:false}] });
    } catch (error) {
      // console.error("Error generating subtopics:", error);
      const errorMessage = {
        id: thinkingMessage.id,
        sender: "llm",
        text: `Sorry, there was an error refreshing the content: ${error.message}. Please try again.`,
        thinking: false,
      };
      setChatThreads({ [null]: [errorMessage] });
      setStoppedThinking(true);
    } finally {
      setIsGenerating(false);
      setIsThinking(false);
      abortControllerRef.current = null;
    }
  };

  const totalSubtopics = calculateTotalSubtopics(topics);

  const progress =
    totalSubtopics > 0
      ? Math.round((completedSubtopics.size / totalSubtopics) * 100)
      : 0;

  const handleGenerateQuiz = async ({ quizType, id, title, subtopics, questionCount, messages = null }) => {
    setIsGeneratingQuiz(true);
    setActiveQuiz({ type: quizType, id, title, data: null }); // Show loading state in QuizComponent

    try {
      // console.log("got it");
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizType, title, subtopics, questionCount, messages }),
      });
     

      const result = await response.json();
      // console.log(result);
      if (result.success) {
        const quizResult = {
          questions: result.data.questions,
          userSelections: {},
          score: 0,
        };
        // console.log(quizResult);
        setQuizzes(prev => ({ ...prev, [id]: quizResult }));
        setActiveQuiz({ type: quizType, id, title, data: quizResult });
      } else {
        throw new Error(result.message || 'Failed to generate quiz');
      }
    } catch (error) {
      console.log(error);
      console.error("Error generating quiz:", error);
      setErrorMessage(`Failed to generate quiz for ${title}. Please try again.`);
      setActiveQuiz(null); // Close quiz component on error
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleRevisitQuiz = (id, title, type) => {
    const quizData = quizzes[id];
    if (quizData) {
      // console.log(quizData);
      setActiveQuiz({ type, id, title, data: quizData });
    }
  };

  const handleQuizSubmit = (quizId, score, userSelections) => {
    setQuizzes(prev => ({
      ...prev,
      [quizId]: {
        ...prev[quizId],
        score,
        userSelections,
      },
    }));
  };

  const handleQuizClose = () => {
    setActiveQuiz(null);
  };

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
        activeQuiz={activeQuiz}
        quizzes={quizzes}
        handleGenerateQuiz={handleGenerateQuiz}
        handleRevisitQuiz={handleRevisitQuiz}
        isGeneratingQuiz={isGeneratingQuiz}
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
          activeQuiz={activeQuiz}
          setActiveQuiz={setActiveQuiz}
          handleGenerateQuiz={handleGenerateQuiz}
          handleQuizClose={handleQuizClose}
          handleQuizSubmit={handleQuizSubmit}
          scrollToMessageId={scrollToMessageId}
          setScrollToMessageId={setScrollToMessageId}
          relatedTopics={relatedTopicsByThread[currentChat.topicId] || []}
          thinkingMessageActive={thinkingMessageActive}
          handleStopThinking={handleStopThinking}
          setStoppedThinking={setStoppedThinking}
          stoppedThinking={stoppedThinking}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      </div>
    </div>
  );
}

export default Learn;
