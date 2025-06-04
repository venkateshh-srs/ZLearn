import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle,
  X,
} from "lucide-react";

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
}) => {
  const [openTopicIds, setOpenTopicIds] = useState(new Set());
  const navigate = useNavigate();
  const toggleTopicAccordion = (topicId) => {
    if (isThinking) return;
    setOpenTopicIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };
  // console.log(topics);

  const handleSubtopicClick = (topicId, subtopicId, subtopicName) => {
    if (isThinking) return;
    toggleSidebar();
    onSubtopicSelect(topicId, subtopicId, subtopicName);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-50 md:hidden"
          onClick={!isThinking ? toggleSidebar : undefined}
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar-bg w-72 md:w-80 lg:w-90 space-y-4 p-4 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out border-r border-light-gray shadow-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer">
            <BookOpen
              size={35}
              className="text-accent"
              onClick={() => navigate("/")}
            />
            <p className="text-xl font-semibold text-dark-gray bg-transparent border-none focus:ring-0 p-1">
              {topicName}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={!isThinking ? onRegenerate : undefined}
              className={`text-medium-gray hover:text-dark-gray ${
                isThinking ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title="Regenerate Topics"
              disabled={isGenerating || isThinking}
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

        {/* Progress */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-medium-gray mb-1">
            <span>Progress</span>
            <span>
              {completedSubtopics.size}/{totalSubtopics}
            </span>
          </div>
          <div className="w-full bg-light-gray rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Topics List */}
        <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
          {topics.map((topic) => (
            <div key={topic.id}>
              {/* // console.log(topic)} */}
              <button
                onClick={() => toggleTopicAccordion(topic.id)}
                className={`w-full flex items-center justify-between text-left p-2.5 rounded-md hover:bg-light-gray focus:outline-none focus:bg-light-gray transition-colors duration-150 ${
                  isThinking ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isThinking}
              >
                <span className="font-medium text-sm text-dark-gray">
                  {topic.name}
                </span>
                {openTopicIds.has(topic.id) ? (
                  <ChevronDown size={18} className="text-medium-gray" />
                ) : (
                  <ChevronRight size={18} className="text-medium-gray" />
                )}
              </button>
              {openTopicIds.has(topic.id) && (
                <div className="ml-4 my-1 space-y-1 border-l border-light-gray pl-3">
                  {topic.subtopics.map((subtopic) => (
                    <button
                      key={subtopic.id}
                      onClick={() =>
                        handleSubtopicClick(
                          topic.id,
                          subtopic.id,
                          subtopic.name
                        )
                      }
                      className={`w-full flex items-center space-x-2.5 p-2 rounded-md text-left text-sm hover:bg-light-gray focus:outline-none focus:bg-light-gray transition-colors duration-150 ${
                        isThinking ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      disabled={isThinking}
                    >
                      {completedSubtopics.has(subtopic.id) ? (
                        <CheckCircle size={16} className="text-accent" />
                      ) : (
                        <Circle size={16} className="text-medium-gray" />
                      )}
                      <span
                        className={`text-dark-gray opacity-90 ${
                          isThinking ? "text-gray-400" : ""
                        }`}
                      >
                        {subtopic.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
