import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle,
} from "lucide-react";

// The primary changes are in this component
const SubtopicItem = ({
  topic,
  subtopic,
  isThinking,
  handleSubtopicClick,
  completedSubtopics,
  toggleAccordion,
  openTopicIds,
  isZQuizActive,
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
            isThinking ? "opacity-70 cursor-not-allowed" : ""
          }`}
          disabled={isThinking || isZQuizActive}
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
                  isThinking ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isThinking || isZQuizActive}
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
        isThinking ? "opacity-70 cursor-not-allowed" : ""
      }`}
      disabled={isThinking || isZQuizActive}
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
  isZQuizActive,
}) => {
  const [openTopicIds, setOpenTopicIds] = useState(new Set([]));
  const navigate = useNavigate();

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
          <div className="flex items-center space-x-2 gap-2 cursor-pointer">
            <BookOpen
              size={34}
              className="text-blue-500"
              onClick={() => navigate("/")}
            />
            <p className="text-lg font-semibold text-gray-800">
              {topicName || "My Course"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={!isThinking ? onRegenerate : undefined}
              className={`text-gray-500 hover:text-gray-800 ${
                isThinking || isZQuizActive
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              title="Regenerate Topics"
              disabled={isGenerating || isThinking || isZQuizActive}
            >
              <RefreshCw
                size={20}
                className={`transition-transform duration-1000 ${
                  isGenerating ? "animate-spin" : ""
                }`}
              />
            </button>
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
              <div key={topic.id}>
                <button
                  onClick={() => toggleAccordion(topic.id)}
                  className={`w-full flex items-center gap-3 text-left p-2.5 rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors duration-150 ${
                    isThinking || isZQuizActive
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={isThinking || isZQuizActive}
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
                        isZQuizActive={isZQuizActive}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
