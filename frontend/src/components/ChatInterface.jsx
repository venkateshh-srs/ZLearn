// src/ChatInterface.js
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { useNavigate } from "react-router-dom";
import { XSquare } from "lucide-react";
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
import QuizComponent from "./Quiz";
import TextSelectionMenu from "./TextSelectionMenu"; // Import the new component
import RelatedTopics from "./RelatedTopics";

const ChatInterface = ({
  messages,
  onSendMessage,
  currentSubtopicName,
  isTopicSelected,
  mainTopicName,
  toggleSidebar,
  isThinking,
  isZQuizActive,
  setIsZQuizActive,
  topics,
  currentChat,
  scrollToMessageId,
  setScrollToMessageId,
  relatedTopics,
  setRelatedTopics,
  thinkingMessageActive,
  handleStopThinking,
  setStoppedThinking,
  stoppedThinking,
  errorMessage,
  setErrorMessage,
  introduction,
}) => {
  //console.log("rendered");

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // Create a ref for the chat container
  const messageRefs = useRef({});
  const navigate = useNavigate();
  const [showRawText, setShowRawText] = useState(false);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [activeQuizSubtopic, setActiveQuizSubtopic] = useState("");
  const Spinner = () => (
    <Loader size={16} className="animate-spin text-dark-gray" />
  );

  const handleRelatedTopicClick = (prompt) => {
    //console.log(prompt);
    // //console.log(prompt[index]);
    onSendMessage(prompt);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // useEffect(scrollToBottom, [messages, isQuizActive]);

  useEffect(() => {
    if (scrollToMessageId && messageRefs.current[scrollToMessageId]) {
      messageRefs.current[scrollToMessageId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setScrollToMessageId(null);
    }
  }, [scrollToMessageId, setScrollToMessageId]);

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

  // Handler for actions from the text selection menu
  const handleTextSelectionAction = (action, selectedText) => {
    // //console.log(isQuizActive);
    if (isQuizActive) {
      return;
    }

    let prompt = "";
    if (action === "analogy") {
      prompt = `Explain "${selectedText}" with an analogy.`;
    } else if (action === "elaborate") {
      prompt = `Elaborate on "${selectedText}".`;
    } else if (action === "example") {
      prompt = `Give me an example of "${selectedText}".`;
    }
    onSendMessage(prompt);
  };

  const handleHomeNavigation = () => {
    navigate("/");
  };

  const getInitialLLMMessage = () => {
    if (
      messages.length === 0 &&
      !isTopicSelected &&
      !isQuizActive &&
      !isThinking
    ) {
      return (
        <div className="p-4 my-4 bg-blue-50 border border-blue-300 rounded-lg text-center text-l">
          <p className="text-sky-800">
            {introduction}
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

  const handleTakeQuiz = () => {
    if (currentSubtopicName && !isThinking) {
      setActiveQuizSubtopic(currentSubtopicName);
      setIsQuizActive(true);
      setIsZQuizActive(true);
    }
  };

  const handleQuizClose = () => {
    setIsQuizActive(false);
    setIsZQuizActive(false);
    setActiveQuizSubtopic("");
  };

  function replaceLatexInline(text) {
    if (!text) return "";
    // text = text.replace(/[\u007f-\u0018-\u0019]/g, "");
    text = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, inner) => {
      const cleaned = inner.replace(/\n+/g, " ").trim();
      return `$$${cleaned}$$`;
    });
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, inner) => {
      const cleanedInner = inner.trim();
      return `$$${cleanedInner}$$`;
    });
    text = text.replace(/\\\((.*?)\\\)/g, (match, inner) => {
      const cleanedInner = inner.trim();
      return `$${cleanedInner}$`;
    });
    // text = text.replace(
    //   /\\text\{[^}]+\}(?:[_^]\{[^}]+\})*/g,
    //   (match) => `$${match}$`
    // );

    return text.replace(/\\\((.+?)\\\)/g, (_, inner) => {
      return `$${inner.trim()}$`;
    });
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-white z-1">
      {/* Add the TextSelectionMenu component here */}
      {/* {//console.log(topics, currentChat)} */}
      {/* {//console.log(currentChat)} */}
      <TextSelectionMenu
        onAction={handleTextSelectionAction}
        chatContainerRef={chatContainerRef}
        isQuizActive={isQuizActive}
        isThinking={isThinking}
      />

      <div className="flex items-center justify-between p-4 border-b border-light-gray bg-sidebar-bg md:bg-white z-10">
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
            <span className="text-blue-400">
              - {topics.find((t) => t.id === currentChat.topicId).name}
            </span>
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

      {/* Attach the ref to the chat container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto min-h-0 space-y-4 p-4 md:p-8 sm:p-10 mb-4 pr-2 relative bg-chat"
      >

        {messages.map((msg) => (
          <div
            key={msg.id}
            ref={(el) => (messageRefs.current[msg.id] = el)}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            } ${msg.sender === "system" ? "w-full justify-center" : ""}`}
          >
            <div
              className={`max-w-lg sm:max-w-lg md:max-w-md lg:max-w-lg xl:max-w-2xl p-3 rounded-lg shadow overflow-hidden ${
                msg.sender === "user"
                  ? "bg-message-user text-gray-900 rounded-br-none border border-sky-100"
                  : msg.sender === "llm"
                  ? "bg-message-llm text-dark-gray border border-gray-100 rounded-bl-none"
                  : msg.sender === "system"
                  ? "bg-blue-100 border border-blue-300 text-blue-800 text-center w-full max-w-md mx-auto text-sm"
                  : ""
              }`}
            >
              {msg.sender !== "system" && (
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
                className={`text-sm md:text-[15.3px] break-words gap-2 ${
                  msg.sender === "system" ? "justify-center" : ""
                }`}
              >
                <div
                  className={msg.sender === "llm" ? "llm-message-content" : ""}
                >
                  {showRawText && msg.sender === "llm" ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                      {msg.text}
                    </pre>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="text-2xl font-bold my-4" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-xl font-bold my-3" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-lg font-bold my-1" {...props} />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 className="text-base font-bold my-1" {...props} />
                        ),
                        h5: ({ node, ...props }) => (
                          <h5 className="text-sm font-bold my-1" {...props} />
                        ),
                        h6: ({ node, ...props }) => (
                          <h6 className="text-xs font-bold my-1" {...props} />
                        ),
                        p: ({ children }) => (
                          <p className="mb-2 leading-relaxed">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold">{children}</strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-outside my-4 pl-4 list-disc">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="my-4 pl-6 list-decimal">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-2">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600">
                            {children}
                          </blockquote>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-800 text-white p-4 rounded-md my-4 overflow-x-auto text-sm">
                            {children}
                          </pre>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-gray-300">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-gray-100 border-b border-gray-300">
                            {children}
                          </thead>
                        ),
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => (
                          <tr className="border-b border-gray-200">
                            {children}
                          </tr>
                        ),
                        th: ({ children }) => (
                          <th className="px-4 py-2 text-left font-semibold text-sm text-gray-700">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-4 py-2 text-sm text-gray-800">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {replaceLatexInline(msg.text)}
                    </ReactMarkdown>
                  )}
                </div>
                {/* button to toggle raw text and markdown */}
                {msg.sender === "llm" && (
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                  >
                    {showRawText ? "Show Markdown" : "Show Raw Text"}
                  </button>
                )}

                {/* --- Related Topics Section moved inside the LLM message rendering --- */}
                {msg.sender === "llm" &&
                  msg.prompts &&
                  msg.prompts.length > 0 && (
                    <RelatedTopics
                      className="animate-in fade-in-0 duration-300 mt-4" // Added margin-top for spacing
                      relatedTopics={msg.prompts} // Use msg.prompts if it directly holds the topics
                      handleRelatedTopicClick={handleRelatedTopicClick}
                    />
                  )}
              </div>
            </div>
          </div>
        ))}
        {/* --- Standalone Thinking Message --- */}
        {thinkingMessageActive && isThinking && (
          <div className="flex w-full justify-start">
            <div className="max-w-lg pl-2 pt-2 pr-5 pb-4 rounded-lg shadow overflow-hidden bg-message-llm text-dark-gray border border-gray-100 rounded-bl-none">
              <div className="flex items-center mb-1">
                <Bot size={16} className="mr-2 opacity-80" />
                <span className="font-semibold text-xs opacity-80">Zlearn</span>
              </div>

              <div className="flex flex-row gap-2 items-center mt-2"> {/* Increased gap for better spacing */}
                <Spinner />
                <span>Thinking...</span>
                {/* Simple text button */}
                   <button
                    onClick={()=>{
                      handleStopThinking();
                      setStoppedThinking(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-md border border-gray-300 bg-gray-50 text-gray-800 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <XSquare size={14} className="opacity-80" /> {/* Stop icon */}
                    Stop
                  </button>

              </div>
            </div>
          </div>
        )}
        {stoppedThinking && !isThinking && (
          <div className="flex w-full justify-start">
            <div className="max-w-lg pl-2 pt-2 pr-5 pb-4 rounded-lg shadow overflow-hidden bg-message-llm text-dark-gray border border-gray-100 rounded-bl-none">
              <div className="flex items-center mb-1">
                <Bot size={16} className="mr-2 opacity-80" />{" "}
                {/* Bot icon for Zlearn */}
                <span className="font-semibold text-xs opacity-80">Zlearn</span>
              </div>
              <div className="flex flex-row gap-1 items-center mt-2">
                <span>Stopped thinking.</span>
              </div>
            </div>
          </div>
        )}
        {errorMessage && !isThinking && !stoppedThinking &&(
          <div className="flex w-full justify-start">
            <div className="max-w-lg pl-2 pt-2 pr-5 pb-4 rounded-lg shadow overflow-hidden bg-message-llm text-dark-gray border border-gray-100 rounded-bl-none">
              <div className="flex items-center mb-1">
                <Bot size={16} className="mr-2 opacity-80" />
                <span className="font-semibold text-xs opacity-80">Zlearn</span>
              </div>
              <div className="flex flex-row gap-1 items-center mt-2">
                <span>{errorMessage}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isQuizActive && activeQuizSubtopic && (
        <div className="px-4 md:px-6">
          <QuizComponent
            subtopicName={activeQuizSubtopic}
            onClose={handleQuizClose}
            messages={messages}
            isQuizActive={isQuizActive}
          />
        </div>
      )}

      {isTopicSelected && messages.length > 0 && !isQuizActive && (
        <div className="mb-3 flex flex-wrap gap-2 items-center px-4 md:px-6 z-10">
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

      <div className="border-t border-light-gray pt-4 px-4 md:px-6 pb-4 z-10">
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
