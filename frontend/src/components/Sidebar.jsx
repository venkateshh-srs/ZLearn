import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle,
  BrainCircuit,
  Loader,
  ChevronUp,
  Pencil,
  X
} from "lucide-react";
import customPrompt from "../data/customPrompt";
const QuizActions = ({
  topic,
  quizId,
  isOverall,
  allTopics,
  quizzes,
  handleGenerateQuiz,
  handleRevisitQuiz,
  isGeneratingQuiz,
  activeQuiz
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const existingQuiz = quizzes[quizId];
  const isThisQuizGenerating = isGeneratingQuiz && activeQuiz?.id === quizId;

  const getAllSubtopicNamesForTopic = (targetTopic) => {
    let names = [];
    targetTopic.subtopics?.forEach(st => {
      if (st.subtopics && st.subtopics.length > 0) {
        st.subtopics.forEach(sst => names.push(sst.name));
      } else {
        names.push(st.name);
      }
    });
    // console.log(names);
    return names;
  };

  const getAllSubtopicsForCourse = (courseTopics) => {
    let allNames = [];
    courseTopics.forEach(t => {
      allNames.push(...getAllSubtopicNamesForTopic(t));
    });
    // console.log(allNames);
    return allNames;
  };

  const handleGenerateClick = () => {
    // console.log("clicked");
    
    const subtopics = isOverall ? getAllSubtopicsForCourse(allTopics) : getAllSubtopicNamesForTopic(topic);
    handleGenerateQuiz({
      quizType: isOverall ? 'overall' : 'topic',
      id: quizId,
      title: isOverall ? 'Overall Review' : topic.name,
      subtopics,
      questionCount: isOverall ? 15 : 10,
    });
    setIsMenuOpen(false);
  };

  const handleRevisitClick = () => {
    handleRevisitQuiz(quizId, isOverall ? 'Overall Review' : topic.name, isOverall ? 'overall' : 'topic');
    setIsMenuOpen(false);
  };
  
  const handleToggleMenu = () => {
    if (existingQuiz) {
      setIsMenuOpen(prev => !prev);
    } else {
      handleGenerateClick();
    }
  };

  const buttonDisabled = !!activeQuiz || isGeneratingQuiz;

  return (
    <div className="relative">
      <button
        onClick={handleToggleMenu}
        disabled={buttonDisabled}
        className={`flex items-center flex-start gap-2 w-content text-sm font-medium px-3 py-2 mt-1 rounded-md transition-colors
          ${isThisQuizGenerating ? 'bg-blue-100 text-sky-800 animate-pulse' : 'bg-sky-50 hover:bg-sky-100 text-sky-700'}
          ${buttonDisabled && !isThisQuizGenerating ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        {isThisQuizGenerating ? <Loader size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
        <span>{isThisQuizGenerating ? 'Generating...' : (isOverall ? 'Overall Quiz' : 'Topic Quiz')}</span>
        {existingQuiz && (isMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
      </button>

      {isMenuOpen && existingQuiz && (
        <div className="absolute z-10 right-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-1.5">
          <button
            onClick={handleRevisitClick}
            className="w-full text-left text-sm px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            Revisit Previous Quiz
          </button>
          <button
            onClick={handleGenerateClick}
            className="w-full text-left text-sm px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            Generate New One
          </button>
        </div>
      )}
    </div>
  );
};

// The primary changes are in this component
const SubtopicItem = ({
  topic,
  subtopic,
  isThinking,
  handleSubtopicClick,
  completedSubtopics,
  toggleAccordion,
  openTopicIds,
  activeQuiz,
}) => {
  const hasSubSubtopics = subtopic.subtopics && subtopic.subtopics.length > 0;
  const isSubtopicOpen = openTopicIds.has(subtopic.id);

  // If the subtopic itself has more subtopics, render it like a main topic
  if (hasSubSubtopics) {
    return (
      <div key={subtopic.id}>
        <button
          onClick={() => toggleAccordion(subtopic.id)}
          className={`w-full flex items-center text-left gap-3 p-2.5 rounded-md hover:bg-light-gray focus:outline-none focus:bg-light-gray transition-colors duration-150 ${
            isThinking || !!activeQuiz ? "opacity-70 cursor-not-allowed" : ""
          }`}
          disabled={isThinking || !!activeQuiz}
        >
          <span className="font-medium text-sm text-dark-gray whitespace-nowrap">
            {subtopic.name}
          </span>
          {isSubtopicOpen ? (
            <ChevronDown size={18} className="text-medium-gray" />
          ) : (
            <ChevronRight size={18} className="text-medium-gray" />
          )}
        </button>
        {isSubtopicOpen && (
          <div className="ml-4 my-1 space-y-1 border-l border-light-gray pl-3">
            {subtopic.subtopics.map((subSubtopic) => (
              // This is now the final, clickable item
              <button
                key={subSubtopic.id}
                onClick={() =>
                  handleSubtopicClick(
                    topic.id,
                    subSubtopic.id,
                    subSubtopic.name
                  )
                }
                className={`w-full flex items-center space-x-2.5 p-2 rounded-md text-left text-sm hover:bg-light-gray focus:outline-none focus:bg-light-gray transition-colors duration-150 ${
                  isThinking || !!activeQuiz ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isThinking || !!activeQuiz}
              >
                {completedSubtopics.has(subSubtopic.id) ? (
                  <CheckCircle size={16} className="text-accent" />
                ) : (
                  <Circle size={16} className="text-medium-gray" />
                )}
                <span className={`text-dark-gray opacity-90 whitespace-nowrap`}>
                  {subSubtopic.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render it as a standard, clickable subtopic item
  return (
    <button
      key={subtopic.id}
      onClick={() => handleSubtopicClick(topic.id, subtopic.id, subtopic.name)}
      className={`w-full flex items-center space-x-2.5 p-2 rounded-md text-left text-sm hover:bg-light-gray focus:outline-none focus:bg-light-gray transition-colors duration-150 ${
        isThinking || !!activeQuiz ? "opacity-70 cursor-not-allowed" : ""
      }`}
      disabled={isThinking || !!activeQuiz}
    >
      {completedSubtopics.has(subtopic.id) ? (
        <CheckCircle size={16} className="text-accent" />
      ) : (
        <Circle size={16} className="text-medium-gray" />
      )}
      <span className={`text-dark-gray opacity-90 whitespace-nowrap`}>
        {subtopic.name}
      </span>
    </button>
  );
};

const EditLLMPrompt = ({setIsEditingPrompt, isEditingPrompt}) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(customPrompt);
  useEffect(() => {
    const savedPrompt = localStorage.getItem("customPrompt");
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);
  // useEffect(() => {
  // console.log("prompt: " , prompt);
  //  localStorage.setItem("customPrompt", prompt);
  // }, []);
  const handleSave = () => {
    localStorage.setItem("customPrompt", prompt);
    setIsEditingPrompt(false);
  };
  return (
   <>
   {/* A modal with text area and a save button and a close button */}
   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
     <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-scroll">
       <div className="p-6 border-b border-gray-200">
         <h2 className="text-xl font-semibold text-gray-800">Edit LLM Prompt</h2>
        
       </div>
       
       <div className="p-6">
         <textarea 
           className="w-full resize-none border border-gray-400 rounded-lg p-4 text-sm transition-colors duration-200"
           rows={20}
           value={prompt} 
           onChange={(e) => setPrompt(e.target.value)} 
           placeholder="Enter your custom prompt here"
         />
       </div>
       {/* reset button */}
       <div className="flex justify-start mb-4">
         <button className="text-gray-500 hover:text-gray-800 bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setPrompt(customPrompt)}>
           Reset Prompt
         </button>
       </div>
       
       <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200">
         <button 
           className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none transition-colors duration-200"
            onClick={handleSave}
         >
           Save Changes
         </button>
         <button 
           className="flex-1 bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-300 focus:outline-none transition-colors duration-200"
           onClick={() => setIsEditingPrompt(false)}
         >
           Cancel
         </button>
       </div>
     </div>
   </div>
   </>
  );
};

const Sidebar = ({
  isOpen,
  toggleSidebar,
  topicName,
  setTopicName,
  availableTopics,
  topics,
  completedSubtopics,
  onSubtopicSelect,
  onRegenerate,
  progress,
  totalSubtopics,
  isGenerating,
  isThinking,
  activeQuiz,
  quizzes,
  handleGenerateQuiz,
  handleRevisitQuiz,
  isGeneratingQuiz,
  fontSize,
  setFontSize,
}) => {
  const [openTopicIds, setOpenTopicIds] = useState(new Set([]));
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const navigate = useNavigate();
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const toggleAccordion = (id) => {
    if (isThinking) return;
    setOpenTopicIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSubtopicClick = (topicId, subtopicId, subtopicName) => {
    if (isThinking) return;

    if (onSubtopicSelect) {
      onSubtopicSelect(topicId, subtopicId, subtopicName);
    }
    // toggleSidebar(); // Uncomment if you want the sidebar to close on selection
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-50 md:hidden"
          onClick={!isThinking ? toggleSidebar : undefined}
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white w-85 md:w-90 lg:w-90 space-y-4 p-4 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out border-r border-gray-200 shadow-lg`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 gap-2">
            <BookOpen
              size={30}
              className="text-blue-500 flex-shrink-0 cursor-pointer"
              onClick={() => navigate("/")}
            />
            <p className="text-lg font-semibold text-gray-800">
              {topicName || "My Course"}
            </p>
          </div>
         
        </div>

        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>
              {completedSubtopics.size}/{totalSubtopics}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-auto space-y-1 pr-1">
          <div className="inline-block min-w-full">
            {topics.map((topic) => (
              <div key={topic.id} className="mb-2">
                <button
                  onClick={() => toggleAccordion(topic.id)}
                  className={`w-full flex items-center gap-3 text-left p-2.5 rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors duration-150 ${
                    isThinking || !!activeQuiz
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={isThinking || !!activeQuiz}
                >
                  <span className="font-medium text-sm text-gray-700 whitespace-nowrap">
                    {topic.name}
                  </span>
                  {openTopicIds.has(topic.id) ? (
                    <ChevronDown size={18} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-500" />
                  )}
                </button>
                {openTopicIds.has(topic.id) && (
                  <div className="ml-4 my-1 space-y-1 border-l border-gray-200 pl-3">
                    {topic.subtopics.map((subtopic) => (
                      <SubtopicItem
                        key={subtopic.id}
                        topic={topic}
                        subtopic={subtopic}
                        isThinking={isThinking}
                        handleSubtopicClick={handleSubtopicClick}
                        completedSubtopics={completedSubtopics}
                        toggleAccordion={toggleAccordion}
                        openTopicIds={openTopicIds}
                        activeQuiz={activeQuiz}
                      />
                    ))}
                     <QuizActions
                      topic={topic}
                      quizId={`topic-${topic.id}`}
                      quizzes={quizzes}
                      handleGenerateQuiz={handleGenerateQuiz}
                      handleRevisitQuiz={handleRevisitQuiz}
                      isGeneratingQuiz={isGeneratingQuiz}
                      activeQuiz={activeQuiz}
                    />
                  </div>
                )}
              </div>
            ))}
             <div className="mt-4 pt-4 border-t border-gray-200">
              <QuizActions
                isOverall={true}
                allTopics={topics}
                quizId="overall"
                quizzes={quizzes}
                handleGenerateQuiz={handleGenerateQuiz}
                handleRevisitQuiz={handleRevisitQuiz}
                isGeneratingQuiz={isGeneratingQuiz}
                activeQuiz={activeQuiz}
              />
            </div>
          </div>
       
        </nav>
          {/* Fixed bottom actions: Edit Prompt & Regenerate */}
          <div className="sticky bottom-0 left-0 w-full bg-white z-20 flex flex-col space-y-2 px-4 py-3 border-t border-gray-200">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-small text-sm transition-colors"
              onClick={() => setIsEditingPrompt(true)}
            >
              <Pencil size={17} className="text-gray-500" />
              Edit Prompt
            </button>
         
            {showRegenerateModal && (
              <div className="fixed inset-0 bg-black/15 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 text-center">
                    Confirm Regeneration
                  </h3>
                  <p className="text-gray-600 mb-6 text-center ">
                    Are you sure?
                    <br />
                    The current chats will be deleted.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowRegenerateModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors w-full border border-gray-300 "
                    >
                      No
                    </button>
                    <button
                      onClick={() => {
                        setShowRegenerateModal(false);
                        onRegenerate();
                      }}
                      className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors w-full"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={!isThinking ? () => setShowRegenerateModal(true) : undefined}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-small transition-colors text-sm ${
                isThinking || !!activeQuiz
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              title="Regenerate Topics"
              disabled={isGenerating || isThinking || !!activeQuiz}
            >
              <RefreshCw
                size={18}
                className={`transition-transform duration-1000 ${
                  isGenerating ? "animate-spin" : ""
                }`}
              />
              Regenerate Topics
            </button>
               {/* Font Size Controls */}
            <div className="flex flex-col items-start mt-2">
              <label className="text-xs ml-2 text-gray-500 mb-1 font-medium">Font Size</label>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1 shadow-sm">
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-500 hover:bg-gray-200 transition disabled:opacity-40"
                  onClick={() => setFontSize(f => Math.max(15.0, Math.round((f - 0.5) * 10) / 10))}
                  disabled={fontSize <= 15.0}
                  aria-label="Decrease font size"
                  type="button"
                >
                  <span className="text-lg font-bold">–</span>
                </button>
                <span className="text-sm font-mono w-12 text-center text-gray-700 select-none">
                  {fontSize.toFixed(1)}px
                </span>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-500 hover:bg-gray-200 transition disabled:opacity-40"
                  onClick={() => setFontSize(f => Math.min(18.5, Math.round((f + 0.5) * 10) / 10))}
                  disabled={fontSize >= 18.5}
                  aria-label="Increase font size"
                  type="button"
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
            </div>
          </div>
      </div>
      
      {isEditingPrompt && <EditLLMPrompt setIsEditingPrompt={setIsEditingPrompt} isEditingPrompt={isEditingPrompt} />}
    </>
  );
};

export default Sidebar;
