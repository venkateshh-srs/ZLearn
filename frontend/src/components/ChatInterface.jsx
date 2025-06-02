// src/ChatInterface.js
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import {
  Send,
  HelpCircle,
  Edit3,
  Zap,
  BookCopy,
  User,
  Bot,
  Menu,
  Home,
  Loader,
} from "lucide-react";
import QuizComponent from "./Quiz"; // Import the new QuizComponent

const ChatInterface = ({
  messages,
  onSendMessage,
  currentSubtopicName,
  isTopicSelected,
  mainTopicName,
  toggleSidebar,
  isThinking,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // State for inline Quiz
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [activeQuizSubtopic, setActiveQuizSubtopic] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isQuizActive]); // Scroll to bottom if quiz appears/disappears too

  const handleSend = () => {
    if (inputValue.trim() && !isThinking) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleQuickAction = (actionType, actionText) => {
    if (!isThinking) {
      onSendMessage(actionText, actionType);
    }
  };

  const handleHomeNavigation = () => {
    navigate("/");
    // // console.log("Navigate to Home");
  };

  const getInitialLLMMessage = () => {
    if (
      messages.length === 0 &&
      !isTopicSelected &&
      !isQuizActive &&
      !isThinking
    ) {
      // Hide if quiz is active
      return (
        <div className="p-4 my-4 bg-blue-50 border border-blue-300 rounded-lg text-center text-l">
          <p className="text-sky-800">
            Welcome! Your personalized learning path is ready. Choose any
            subtopic from the sidebar to kickstart your journey!
          </p>
        </div>
      );
    }
    if (
      messages.length > 0 &&
      messages[0].sender === "system" &&
      messages.filter((m) => m.sender !== "system").length === 0
    ) {
      return null;
    }
    return null;
  };

  // Handler for "Take Quiz" button
  const handleTakeQuiz = () => {
    if (currentSubtopicName && !isThinking) {
      setActiveQuizSubtopic(currentSubtopicName);
      setIsQuizActive(true);
      // Optionally, send a message to log this action
      // onSendMessage(`Starting a quiz for "${currentSubtopicName}".`, 'system_info');
      // Or let the quiz appearance be the primary feedback.
      // For now, let's also disable regular quick actions when quiz is active.
    }
  };

  const handleQuizClose = () => {
    setIsQuizActive(false);
    setActiveQuizSubtopic("");
    // Optionally, send a message that quiz was closed
    // onSendMessage(`Quiz for "${activeQuizSubtopic}" closed.`, 'system_info');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b border-light-gray bg-sidebar-bg md:bg-white">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 mr-2 text-dark-gray hover:bg-light-gray rounded-full md:hidden"
            aria-label="Toggle sidebar"
            disabled={isThinking}
          >
            <Menu size={24} />
          </button>
        </div>
        <h1 className="text-lg font-semibold text-dark-gray truncate px-2">
          {mainTopicName}
          {currentSubtopicName && isTopicSelected && !isQuizActive ? (
            <span className="text-blue-400"> - {currentSubtopicName}</span>
          ) : isQuizActive && activeQuizSubtopic ? (
            <span className="text-sky-800"> - Quiz: {activeQuizSubtopic}</span>
          ) : (
            ""
          )}
        </h1>
        <button
          onClick={handleHomeNavigation}
          className="p-2 mr-5 text-dark-gray hover:bg-light-gray hover:cursor-pointer rounded-full "
          aria-label="Go to home"
          disabled={isThinking}
        >
          <Home size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4 md:p-8 sm:p-10 mb-4 pr-2 ">
        {getInitialLLMMessage()}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            } ${
              msg.sender === "system" || msg.sender === "system_info"
                ? "w-full justify-center"
                : ""
            } ${
              msg.text === "Generating new subtopics..." &&
              msg.sender === "llm" &&
              msg.thinking
                ? "w-full justify-center"
                : ""
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl p-3 rounded-lg shadow ${
                msg.sender === "user"
                  ? "bg-accent text-white rounded-br-none"
                  : msg.sender === "llm"
                  ? msg.text === "Generating new subtopics..." && msg.thinking
                    ? "bg-blue-100 border border-blue-300 text-blue-800 text-center w-full max-w-md mx-auto text-sm"
                    : "bg-light-gray text-dark-gray rounded-bl-none"
                  : msg.sender === "system" || msg.sender === "system_info" // Style for system messages
                  ? "bg-blue-100 border border-blue-300 text-blue-800 text-center w-full max-w-md mx-auto text-sm"
                  : ""
              }`}
            >
              {msg.sender !== "system" &&
                msg.sender !== "system_info" &&
                !(
                  msg.text === "Generating new subtopics..." &&
                  msg.sender === "llm" &&
                  msg.thinking
                ) && (
                  <div className="flex items-center mb-1">
                    {msg.sender === "user" ? (
                      <User size={16} className="mr-2 opacity-80" />
                    ) : (
                      <Bot size={16} className="mr-2 opacity-80" />
                    )}
                    <span className="font-semibold text-xs opacity-80">
                      {msg.sender === "user" ? "You" : "Zlearn"}
                    </span>
                  </div>
                )}
              <div
                className={`text-sm md:text-[15.3px] break-words text-justify gap-2 ${
                  msg.sender === "system" ||
                  msg.sender === "system_info" ||
                  (msg.text === "Generating new subtopics..." &&
                    msg.sender === "llm" &&
                    msg.thinking)
                    ? "justify-center"
                    : ""
                }`}
              >
                {msg.thinking ? (
                  <div className="flex flex-row gap-1 items-center justify-center">
                    {msg.text === "Generating new subtopics..." && (
                      <Loader
                        size={16}
                        className="animate-spin text-dark-gray mr-2"
                      />
                    )}

                    <span>{msg.text}</span>

                    {msg.text !== "Generating new subtopics..." && (
                      <Loader
                        size={16}
                        className="animate-spin text-dark-gray ml-2"
                      />
                    )}
                  </div>
                ) : (
                  <ReactMarkdown
                    components={{
                      pre: ({ node, ...props }) => (
                        <pre className="overflow-x-auto whitespace-pre rounded bg-gray-800 text-white p-4 text-sm">
                          {props.children}
                        </pre>
                      ),
                      code: ({ node, inline, className, children, ...props }) =>
                        inline ? (
                          <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ) : (
                          <code className={`text-sm ${className}`} {...props}>
                            {children}
                          </code>
                        ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Conditionally rendered Quiz Component */}
      {isQuizActive && activeQuizSubtopic && (
        <div className="px-4 md:px-6">
          {" "}
          {/* Wrapper for the quiz card */}
          <QuizComponent
            subtopicName={activeQuizSubtopic}
            onClose={handleQuizClose}
            messages={messages}
          />
        </div>
      )}

      {/* Quick actions (conditionally rendered AND not if quiz is active) */}
      {isTopicSelected && messages.length > 0 && !isQuizActive && (
        <div className="mb-3 flex flex-wrap gap-2 items-center px-4 md:px-6 ">
          <span className="text-sm text-medium-gray mr-1">Quick actions:</span>
          {[
            { type: "clarify", text: "Clarify", icon: HelpCircle },
            { type: "elaborate", text: "Elaborate", icon: Edit3 },
            { type: "example", text: "Example", icon: Zap },
          ].map((action) => (
            <button
              key={action.type}
              onClick={() =>
                handleQuickAction(
                  action.type,
                  action.type === "clarify"
                    ? `Can you clarify "${currentSubtopicName}"?`
                    : action.type === "elaborate"
                    ? `Elaborate more on "${currentSubtopicName}".`
                    : `Give me an example for "${currentSubtopicName}".`
                )
              }
              className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isThinking}
            >
              <action.icon size={14} className="mr-1.5" /> {action.text}
            </button>
          ))}
          <button
            onClick={handleTakeQuiz}
            className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isThinking || isQuizActive}
          >
            <BookCopy size={14} className="mr-1.5" /> Take Quiz
          </button>
        </div>
      )}

      {/* Input area - disabled if quiz is active */}
      <div className="border-t border-light-gray pt-4 px-4 md:px-6 pb-4">
        <div className="flex items-center gap-2 bg-white border border-light-gray rounded-lg shadow-sm">
          <div className="relative w-full">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                !isQuizActive &&
                !isThinking &&
                handleSend()
              }
              className="flex-1 w-full p-2.5 text-sm border-none focus:ring-0 bg-transparent z-10 placeholder:truncate "
              placeholder={
                isQuizActive
                  ? "Quiz in progress..."
                  : isTopicSelected
                  ? `Ask about ${currentSubtopicName}...`
                  : "Select a topic from sidebar to ask questions..."
              }
              disabled={
                isThinking ||
                (!isTopicSelected && messages.length === 0) ||
                isQuizActive ||
                !isTopicSelected
              }
            />
          </div>

          <button
            onClick={handleSend}
            disabled={
              isThinking ||
              !inputValue.trim() ||
              (!isTopicSelected && messages.length === 0) ||
              isQuizActive
            }
            className="p-2.5 text-white bg-accent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-medium-gray disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
