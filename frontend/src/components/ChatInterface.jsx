// src/ChatInterface.js
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { useNavigate } from "react-router-dom";
import { XSquare, ChevronLeft, ChevronRight } from "lucide-react";
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
import Quiz from "./Quiz";
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
  activeQuiz,
  setActiveQuiz,
  handleGenerateQuiz,
  handleQuizClose,
  handleQuizSubmit,
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
  onGetAnotherImage,
  isFetchingImage,
  fontSize,
}) => {
  //console.log("rendered");

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // Create a ref for the chat container
  const messageRefs = useRef({});
  const imageRefs = useRef({});
  const textAreaRef = useRef(null);
  const navigate = useNavigate();
  const [showRawText, setShowRawText] = useState(false);
  const [imageCarousels, setImageCarousels] = useState({}); // { messageId: currentIndex }
  const Spinner = () => (
    <Loader size={16} className="text-dark-gray animate-spin" />
  );

  const handleRelatedTopicClick = (prompt) => {
    //console.log(prompt);
    // //console.log(prompt[index]);
    onSendMessage(prompt);
  };
  
  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }
  const prevMessages = usePrevious(messages);

  const scrollToBottom = () => {
    if (messages.length > 0) {
      console.log(messageRefs.current);
      const lastMessageElement = messageRefs.current[messages[messages.length - 1].id];
      console.log(lastMessageElement);
      if (lastMessageElement) {
        lastMessageElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };
  
 
  useEffect(() => {
    if (prevMessages && messages.length === prevMessages.length) {
      return;
    }
    scrollToBottom();
  }, [messages, activeQuiz]);

  useEffect(() => {
    if (scrollToMessageId && messageRefs.current[scrollToMessageId]) {
      messageRefs.current[scrollToMessageId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setScrollToMessageId(null);
    }
  }, [scrollToMessageId, setScrollToMessageId]);
  useEffect(() => {
  messages.forEach((msg) => {
    const messageId = msg.id;
    const numImages = msg.images?.length || 0;
    const currentIndex = imageCarousels[messageId] || 0;

    // If new image added and not already scrolled to it
    if (numImages > 0 && currentIndex !== numImages - 1) {
      const lastImageRef = imageRefs.current[messageId]?.[numImages - 1];
      if (lastImageRef) {
        lastImageRef.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
        setImageCarousels((prev) => ({
          ...prev,
          [messageId]: numImages - 1,
        }));
      }
    }
  });
}, [messages]); // msgList should contain all messages and their images


  // useEffect(() => {
  //   // show recently added image which is added to the current message
  //   const lastMessage = messages[messages.length - 1];
  //   if (lastMessage?.images && lastMessage?.images.length > 0) {
  //     const lastImage = lastMessage.images[lastMessage.images.length - 1];
  //     const lastImageRef = imageRefs.current[lastMessage.id]?.[lastMessage.images.length - 1];
  //     if (lastImageRef) {
  //       lastImageRef.scrollIntoView({ behavior: "smooth", block: "nearest" });
  //     }
  //   }
 
  // }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isThinking) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      if (textAreaRef.current) {
    textAreaRef.current.style.height = "auto";
  }
    }
  };

  const handleCarouselPrev = (message) => {
    const messageId = message.id;
    const numImages = message.images.length;
    const prevIndex =
      (imageCarousels[messageId] || 0) === 0
        ? numImages - 1
        : (imageCarousels[messageId] || 0) - 1;

    const imageToScrollTo = imageRefs.current[messageId]?.[prevIndex];
    if (imageToScrollTo) {
      imageToScrollTo.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    console.log("imagecarousel: ",imageCarousels);

    setImageCarousels((prev) => ({
      ...prev,
      [messageId]: prevIndex,
    }));
  };

  const handleCarouselNext = (message) => {
    const messageId = message.id;
    const numImages = message.images.length;
    const nextIndex = ((imageCarousels[messageId] || 0) + 1) % numImages;

    const imageToScrollTo = imageRefs.current[messageId]?.[nextIndex];
    if (imageToScrollTo) {
      imageToScrollTo.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }

    setImageCarousels((prev) => ({
      ...prev,
      [messageId]: nextIndex,
    }));
  };

  const handleGetAnotherImage = (messageId) => {
    onGetAnotherImage(messageId);
  };

  const handleQuickAction = (actionType, actionText) => {
    if (!isThinking) {
      onSendMessage(actionText, actionType);
    }
  };

  // Handler for actions from the text selection menu
  const handleTextSelectionAction = (action, selectedText) => {
    // //console.log(isQuizActive);
    if (activeQuiz) {
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
      !activeQuiz &&
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
       const formattedMessages = [];
     messages.forEach((msg) => {
      if (msg.sender === 'user') {
      formattedMessages.push({
        role: 'user',
        parts: [{ text: msg.text }]
      });
    } else if (msg.sender === 'llm') {

          // Add the main LLM response
      formattedMessages.push({
        role: 'model',
        parts: [{ text: msg.text }]
      });
      // remove image context if it exists. Gemini not accpeting url string image links 
      // if (msg.images && msg.images.length > 0) {
      //   formattedMessages.push(...msg.images);
      // }
      
  
    }
  });
      handleGenerateQuiz({
        quizType: 'subtopic',
        id: currentChat.subtopicId,
        title: currentSubtopicName,
        messages: formattedMessages,
        questionCount: 10,
      });
    }
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
    text = text.replace(
      /\\text\{[^}]+\}(?:[_^]\{[^}]+\})*/g,
      (match) => `$${match}$`
    );
  
    return text;
    // return text.replace(/\\\((.+?)\\\)/g, (_, inner) => {
    //   return `$${inner.trim()}$`;
    // });
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-white z-1">
      {/* Add the TextSelectionMenu component here */}
      {/* {console.log(topics, currentChat)} */}
      {/* {console.log(currentChat)} */}
      <TextSelectionMenu
        onAction={handleTextSelectionAction}
        chatContainerRef={chatContainerRef}
        isQuizActive={!!activeQuiz}
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
         
          {currentSubtopicName && isTopicSelected && !activeQuiz ? (
            <span className="text-blue-500">
              {topics.find((t) => t.id === currentChat.topicId)?.name}
            </span>
          ) : activeQuiz ? (
            <span className="text-sky-700"> Quiz: {activeQuiz.title}</span>
          ) : (
            <span className="text-black">
              {mainTopicName}
            </span>
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
              className={`p-3 rounded-lg shadow overflow-hidden ${
                msg.sender === "user"
                  ? "bg-message-user text-gray-900 rounded-br-none border border-sky-100 max-w-[85vw] sm:max-w-md md:max-w-md lg:max-w-lg xl:max-w-2xl"
                  : msg.sender === "llm"
                  ? "bg-message-llm text-dark-gray border border-gray-100 rounded-bl-none max-w-[85vw] sm:max-w-md md:max-w-md lg:max-w-lg xl:max-w-2xl"
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
                style={msg.sender === "user" || msg.sender === "llm" ? { fontSize: fontSize + 'px' } : {}}
              >
                <div
                  className={msg.sender === "llm" ? "llm-message-content" : ""}
                >
                  {showRawText && msg.sender === "llm" ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                      {msg.text}
                    </pre>
                  ) : msg.sender === "llm" ? (
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
                          <pre className={`bg-gray-800 text-white p-4 rounded-md my-4 overflow-x-auto text-[${fontSize}]`}>
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
                          <td className= {`px-4 py-2 text-${fontSize} text-gray-800`}>
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {replaceLatexInline(msg.text)}
                    </ReactMarkdown>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  <div className="relative">
                    {msg.images && msg.images.length > 0 ? (
                      <div className="relative group flex flex-col items-center">
                        <div className="w-full flex justify-center overflow-hidden">
                          {/* 
                            We'll use a wrapper div with relative positioning and fixed height,
                            and absolutely position the images, fading them in/out with opacity and transition.
                          */}
                          <div className="relative w-full" style={{ minHeight: "200px" }}>
                            {msg.images.map((imgUrl, idx) => (
                              <img
                                key={imgUrl + idx}
                                ref={(el) => {
                                  if (!imageRefs.current[msg.id])
                                    imageRefs.current[msg.id] = [];
                                  imageRefs.current[msg.id][idx] = el;
                                }}
                                src={imgUrl}
                                loading="lazy"
                                alt={`LLM Generated Content ${idx + 1}`}
                                className={`w-full h-auto my-4 object-contain absolute left-0 top-0 transition-opacity duration-500 ease-in-out
                                  ${((imageCarousels[msg.id] || 0) === idx) ? "opacity-100 z-10 relative static" : "opacity-0 z-0"}
                                `}
                                style={{
                                  position: (imageCarousels[msg.id] || 0) === idx ? "relative" : "absolute",
                                  pointerEvents: (imageCarousels[msg.id] || 0) === idx ? "auto" : "none",
                                  transition: "opacity 0.5s ease-in-out",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        {msg.images.length > 1 && (
                          <div className="flex items-center justify-center gap-4 mt-2">
                            <button
                              onClick={() => handleCarouselPrev(msg)}
                              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 focus:outline-none cursor-pointer"
                              aria-label="Previous image"
                            >
                              <ChevronLeft size={24} />
                            </button>
                            <span className="text-xs text-gray-500 select-none">
                              {(imageCarousels[msg.id] || 0) + 1} / {msg.images.length}
                            </span>
                            <button
                              onClick={() => handleCarouselNext(msg)}
                              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 focus:outline-none cursor-pointer"
                              aria-label="Next image"
                            >
                              <ChevronRight size={24} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : msg.image ? (
                      <img
                        src={msg.image}
                        alt="LLM Image"
                        className="w-full h-auto my-4 object-contain"
                      />
                    ) : null}
{/* keet the loader until the imageUrl is completely loaded */}
                    {isFetchingImage.loading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center rounded-lg z-10">
                          <span className=" text-sm font-medium text-white select-none">Getting new image...</span>
                         <Loader className="animate-spin text-white" size={20}   />
                        </div>
                      )}
                  </div>
                  <div className="flex justify-end mt-8">
                    {(msg.image || (msg.images && msg.images.length > 0)) && (
                      <button
                        onClick={() => handleGetAnotherImage(msg.id)}
                        disabled={isFetchingImage.loading}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed "
                      >
                        {isFetchingImage.loading &&
                        isFetchingImage.messageId === msg.id
                          ? "Fetching..."
                          : "Get another image"}
                      </button>
                    )}
                  </div>
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
                      fontSize={fontSize}
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

      {activeQuiz && (
        <div className="px-4 md:px-6">
          <Quiz
            quizData={activeQuiz.data}
            title={activeQuiz.title}
            onClose={handleQuizClose}
            onSubmit={(score, selections) => handleQuizSubmit(activeQuiz.id, score, selections)}
            isQuizActive={!!activeQuiz}
          />
        </div>
      )}

      {isTopicSelected && messages.length > 0 && !activeQuiz && (
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
            disabled={isThinking || !!activeQuiz}
          >
            <BookCopy size={14} className="mr-1.5" /> Take Quiz
          </button>
        </div>
      )}

      <div className="pt-4 px-4 md:px-6 pb-4 z-10">
        <div className="flex items-end gap-1 bg-white rounded-lg ">
          <div className="w-full border border-gray-300 rounded-md">
            <textarea
              ref={textAreaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!activeQuiz && !isThinking) {
                    handleSend();
                  }
                }
              }}
              className="flex-1 w-full p-3 text-sm border-none z-10 placeholder:truncate resize-none overflow-hidden min-h-[44px] max-h-32 leading-5 rounded-md focus:outline-none"
              placeholder={
                activeQuiz
                  ? "Quiz in progress..."
                  : isTopicSelected
                  ? `Ask about ${currentSubtopicName}...`
                  : "Select a topic from sidebar to ask questions..."
              }
              disabled={
                isThinking ||
                (!isTopicSelected && messages.length === 0) ||
                !!activeQuiz ||
                !isTopicSelected
              }
              rows={1}
              style={{
                height: 'auto',
                minHeight: '44px',
                maxHeight: '128px'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={
              isThinking ||
              !inputValue.trim() ||
              (!isTopicSelected && messages.length === 0) ||
              !!activeQuiz
            }
            className="p-3 text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
    
  );
};

export default ChatInterface;