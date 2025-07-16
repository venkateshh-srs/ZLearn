import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import ChatInterface from "./ChatInterface";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function Learn() {
  const navigate = useNavigate();
  const location = useLocation();
  const abortControllerRef = useRef(null);
  const isPublicView = location.pathname.startsWith("/shared");
  // console.log("isPublicView: ", isPublicView);
  // console.log("location.pathname: ", location.pathname);
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
  const { publicId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // console.log("publicId: ", publicId);
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [relatedTopicsByThread, setRelatedTopicsByThread] = useState({});
  const [stoppedThinking, setStoppedThinking] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState({
    loading: false,
    messageId: null,
  });

  // Font size state for chat messages
  const [fontSize, setFontSize] = useState(15.5);
  useEffect(() => {
    const fetchAndStoreCourse = async () => {
      try {
        setLoading(true);
        let res;
        if (!isPublicView) {
          res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/get-course/${publicId}`,
            { withCredentials: true }
          );
        } else {
          res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/public/get-course/${publicId}`
          );
        }

        if (!res.data.success) {
          throw new Error("Course fetch failed");
        }

        const course = res.data.data;
        const topicToLoad = course.publicId;

        // Save in localStorage for resume functionality
        const allCourses =
          JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};

        allCourses[topicToLoad] = course;
        localStorage.setItem(
          "learningJourneyHistory",
          JSON.stringify(allCourses)
        );
        localStorage.setItem("lastActiveTopicId", topicToLoad);

        // Set all frontend states
        setCurrentTopicName(course.title);
        setTopics(course.topics || []);
        setCompletedSubtopics(new Set(course.completedSubtopics || []));
        setChatThreads(course.chatThreads || {});
        setQuizzes(course.quizzes || {});
        setCurrentTopicId(course.publicId || null);
        setRelatedTopicsByThread(course.relatedTopicsByThread || {});
        setCurrentChat(
          course.currentChat || {
            topicId: 1,
            subtopicId: null,
            subtopicName: "",
          }
        );

        // Optional cleanup
        navigate(location.pathname, {
          replace: true,
          state: { topicId: topicToLoad },
        });
      } catch (err) {
        // console.error("Failed to fetch course:", err);
        setError("Could not load this course.");
        navigate("/"); // fallback to home
      } finally {
        setLoading(false);
      }
    };

    fetchAndStoreCourse();
  }, [publicId]);

  const handleGetAnotherImage = async (messageId) => {
    setIsFetchingImage({ loading: true, messageId });
    const currentMessages = chatThreads[currentChat.topicId] || [];
    const messageIndex = currentMessages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) {
      // console.error("Message not found");
      setIsFetchingImage({ loading: false, messageId: null });
      return;
    }

    const messagesForContext = [];
    for (const msg of currentMessages) {
      if (msg.sender === "user") {
        messagesForContext.push({
          role: "user",
          parts: [{ text: msg.text }],
        });
      } else if (msg.sender === "llm") {
        messagesForContext.push({
          role: "model",
          parts: [{ text: msg.text }],
        });

        if (msg.imageContext && msg.imageContext.length > 0) {
          messagesForContext.push(...msg.imageContext);
        }
      }

      if (msg.id === messageId) {
        break; // Stop iterating once we reach the target message
      }
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/get-another-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: messagesForContext }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { imageUrl } = await response.json();

      setChatThreads((prevChatThreads) => {
        const newChatThreads = { ...prevChatThreads };
        const thread = [...(newChatThreads[currentChat.topicId] || [])];
        const msgIndex = thread.findIndex((m) => m.id === messageId);

        if (msgIndex !== -1) {
          const updatedMessage = { ...thread[msgIndex] };
          if (updatedMessage.images) {
            updatedMessage.images = [...updatedMessage.images, imageUrl];
          } else if (updatedMessage.image) {
            updatedMessage.images = [updatedMessage.image, imageUrl];
            delete updatedMessage.image;
          }
          thread[msgIndex] = updatedMessage;
          newChatThreads[currentChat.topicId] = thread;
        }
        return newChatThreads;
      });
    } catch (error) {
      // console.error("Error getting another image:", error);
      // You might want to set an error message state here
    } finally {
      setIsFetchingImage({ loading: false, messageId: null });
    }
  };

  useEffect(() => {
    if (!currentTopicName || !currentTopicId) return;

    const totalSubtopics = calculateTotalSubtopics(topics);
    const progress =
      totalSubtopics > 0
        ? Math.round((completedSubtopics.size / totalSubtopics) * 100)
        : 0;

    const courseData = {
      publicId: currentTopicId, // previously you were using it as ID
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

    // ✅ Save current course only to localStorage
    const allCourses =
      JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};

    allCourses[currentTopicId] = courseData;

    localStorage.setItem("learningJourneyHistory", JSON.stringify(allCourses));
    localStorage.setItem("lastActiveTopicId", currentTopicId);
    if (!isPublicView) {
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/save-course-progress`,
        courseData,
        {
          withCredentials: true,
        }
      );
    }
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
  const getLLMResponseFromDB = async (
    subtopicId,
    publicId,
    formattedMessages,
    currentTopicName,
    topics,
    customPrompt
  ) => {
    // console.log("getting LLM response from DB");
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/fetch-subtopic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formattedMessages,
            currentTopicName, // extra field
            topics,
            customPrompt,
            subtopicId,
            publicId,
          }),
          signal,
        }
      );
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error getting LLM response from DB:", error);
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  };
  const getLLMResponse = async (
    formattedMessages,
    subtopicId = null,
    publicId = null
  ) => {
    // Intentionally delay for testing
    // await new Promise(resolve => setTimeout(resolve, 2000));
    // setCurrentStream("");
    // await streamLLMResponse(formattedMessages);
    const customPrompt = localStorage.getItem("customPrompt");

    if (isPublicView && subtopicId) {
      // console.log("getting LLM response from DB");
      const llmResponse = await getLLMResponseFromDB(
        subtopicId,
        publicId,
        formattedMessages,
        currentTopicName,
        topics,
        customPrompt
      );
      return llmResponse;
    }

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
          customPrompt,
          subtopicId,
          publicId,
        }),
        credentials: "include",
        signal,
      });

      const result = await response.json();
      // console.log(result);

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
    const formattedMessages = [];
    chatContextForApi.forEach((msg) => {
      if (msg.sender === "user") {
        formattedMessages.push({
          role: "user",
          parts: [{ text: msg.text }],
        });
      } else if (msg.sender === "llm") {
        // Add the main LLM response
        formattedMessages.push({
          role: "model",
          parts: [{ text: msg.text }],
        });
        // Add image context if it exists
        if (msg.imageContext && msg.imageContext.length > 0) {
          formattedMessages.push(...msg.imageContext);
        }
      }
    });

    try {
      const llmReply = await getLLMResponse(
        formattedMessages,
        subtopicId,
        publicId
      );
      const llmResponseMessage = {
        id: Date.now() + 2,
        sender: "llm",
        text: llmReply.message.message,
        thinking: false,
        image: llmReply.message.image,
        imageContext: llmReply.message.imageContext,
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

    const formattedMessages = [];
    chatContextForApi.forEach((msg) => {
      if (msg.sender === "user") {
        formattedMessages.push({
          role: "user",
          parts: [{ text: msg.text }],
        });
      } else if (msg.sender === "llm") {
        formattedMessages.push({
          role: "model",
          parts: [{ text: msg.text }],
        });
        if (msg.imageContext && msg.imageContext.length > 0) {
          formattedMessages.push(...msg.imageContext);
        }
      }
    });

    if (quickAction && subtopicName) {
      formattedMessages.push({
        role: "user",
        parts: [
          { text: `Regarding "${subtopicName}", can you ${quickAction} it?` },
        ],
      });
    }

    try {
      const llmReply = await getLLMResponse(formattedMessages);
      // console.log(llmReply);

      const llmResponseMessage = {
        id: Date.now() + 2,
        sender: "llm",
        text: llmReply.message.message,
        thinking: false,
        image: llmReply.message.image,
        imageContext: llmReply.message.imageContext,
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
      // console.log(llmResponseMessage);
      setChatThreads((prevThreads) => ({
        ...prevThreads,
        [topicId]: [...prevThreads[topicId], llmResponseMessage],
      }));
    } catch (error) {
      console.error("LLM API error:", error);
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

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    // console.log("regenerating:");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/generate-course`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: currentTopicName, publicId }),
          signal,
          credentials: "include",
        }
      );
      const result = await res.json();
      setTopics(result.data.data); // This will trigger the save useEffect
      // After regeneration, chatThreads is reset, so we set the initial message.
      setChatThreads({
        1: [
          {
            id: 1,
            sender: "llm",
            text: result.data.introduction,
            thinking: false,
          },
        ],
      });
      //console.log(result);
      // setTopics(result.data.data); // This will trigger the save useEffect
      // After regeneration, chatThreads is reset, so we set the initial message.
      // setChatThreads({
      //   1: [
      //     {
      //       id: 1,
      //       sender: "llm",
      //       text: result.data.introduction,
      //       thinking: false,
      //     },
      //   ],
      // });
      setCompletedSubtopics(new Set());
      // setChatThreads({});
      setQuizzes({});
      setCurrentChat({ topicId: 1, subtopicId: null, subtopicName: "" });
      setRelatedTopicsByThread({});
    } catch (error) {
      // console.error("Error generating subtopics:", error);
      toast.error("Error generating subtopics", {
        position: "top-center",
        autoClose: 1000,
        theme: "colored",
      });
      const errorMessage = {
        id: Date.now(),
        sender: "llm",
        text: `Sorry, there was an error regenerating the content: ${error.message}. Please try again.`,
        thinking: false,
      };
      setChatThreads({
        [currentChat.topicId]: [
          ...chatThreads[currentChat.topicId],
          errorMessage,
        ],
      });
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

  const handleGenerateQuiz = async ({
    quizType,
    id,
    title,
    subtopics,
    questionCount,
    messages = null,
  }) => {
    setIsGeneratingQuiz(true);
    setActiveQuiz({ type: quizType, id, title, data: null }); // Show loading state in QuizComponent

    try {
      // console.log("got it");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/generate-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizType,
            title,
            subtopics,
            questionCount,
            messages,
          }),
        }
      );

      const result = await response.json();
      // console.log(result);
      if (result.success) {
        const quizResult = {
          questions: result.data.questions,
          userSelections: {},
          score: 0,
        };
        // console.log(quizResult);
        setQuizzes((prev) => ({ ...prev, [id]: quizResult }));
        setActiveQuiz({ type: quizType, id, title, data: quizResult });
      } else {
        throw new Error(result.message || "Failed to generate quiz");
      }
    } catch (error) {
      // console.log(error);
      console.error("Error generating quiz:", error);
      setErrorMessage(
        `Failed to generate quiz for ${title}. Please try again.`
      );
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
    setQuizzes((prev) => ({
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
    <div>
      {loading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
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
          fontSize={fontSize}
          setFontSize={setFontSize}
          isPublicView={isPublicView}
          currentChat={currentChat}
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
            introduction={
              (topics[0] && topics[0].subtopics[0].introduction) || ""
            }
            onGetAnotherImage={handleGetAnotherImage}
            isFetchingImage={isFetchingImage}
            fontSize={fontSize}
            publicId={publicId}
          />
        </div>
      </div>
    </div>
  );
}

export default Learn;
