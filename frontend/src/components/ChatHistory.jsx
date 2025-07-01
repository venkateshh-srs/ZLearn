//add a chat history where there will be list if all the learnings visible in home page with progress,topicname,no.of topics completed ,no of topics left, and a button to go to the learn page

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Book, X, Trash2 } from "lucide-react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex gap-4 p-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onConfirm}
            className="w-full text-white px-1 py-2 border border-red-500 bg-red-600
             rounded-sm text-md font-medium
            hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Yes
          </button>
          <button
            onClick={onClose}
            className="w-full border border-gray-400 text-gray-800 px-1 py-2 rounded-sm text-md font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-100"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const CourseItem = ({ course, onContinue, onRemove }) => {
  const {
    title,
    lastAccessed,
    progress,
    topics,
    chatThreads,
    completedSubtopics,
  } = course;

  const formattedDate = `Last accessed: ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(lastAccessed))}`;

  const completedSubtopicsLength = completedSubtopics?.length || 0;

  const totalSubtopics = (topics || []).reduce((acc, topic) => {
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

  const remainingTopics = totalSubtopics - completedSubtopicsLength;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex-grow w-full">
        <div className="flex items-center gap-2">
          <Book size={20} className="text-gray-600" />
          <h3 className="font-semibold text-md text-gray-800">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        <div className="mt-4">
          <div className="flex justify-between w-full items-center mb-1">
            <span className="text-sm text-gray-500">Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {progress || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${progress || 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{`${totalSubtopics} topics • ${remainingTopics} remaining`}</p>
        </div>
      </div>
      <div className="flex items-center self-end sm:self-center flex-shrink-0 gap-2">
        <button
          onClick={onRemove}
          className="text-sm font-medium text-red-400 hover:text-red-500 flex items-center gap-1 bg-white px-4 py-2 rounded-md border border-red-200"
        >
          Remove
        </button>
        <button
          onClick={onContinue}
          className="bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const RecentCourseItem = ({
  course,
  onContinue,
  totalSubtopics,
  remainingTopics,
}) => {
  const { title, lastAccessed, progress } = course;
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(lastAccessed))
    .replace(",", " ,");

  return (
    <div className="p-4 rounded-lg border border-gray-300 bg-gray-50 mb-4 ">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Book size={20} className="text-gray-600" />
            <h3 className="font-semibold text-md text-gray-800">{title}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500">Progress</p>
          <p className="text-md font-medium text-gray-700">{progress || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">{`${totalSubtopics} topics • ${remainingTopics} remaining`}</p>
        </div>
        <button
          onClick={onContinue}
          className="bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 self-end"
        >
          Continue
        </button>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div
          className="bg-blue-500 h-1.5 rounded-full"
          style={{ width: `${progress || 0}%` }}
        ></div>
      </div>
    </div>
  );
};

function ChatHistory({ isGenerating }) {
  const [history, setHistory] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    onConfirm: null,
    title: "",
    message: "",
  });

  useEffect(() => {
    const storedHistory =
      JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
    const sortedHistory = Object.values(storedHistory).sort(
      (a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed)
    );
    setHistory(sortedHistory);
  }, []);

  useEffect(() => {
    const filtered = history.filter((course) =>
      course.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredHistory(filtered);
  }, [search, history]);

  const handleContinue = (topicId) => {
    if (isGenerating) return;
    navigate("/learn", { state: { topicId } });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, onConfirm: null, title: "", message: "" });
  };

  const handleConfirmAction = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  };

  const handleRemoveConfirmation = (courseId, courseTitle) => {
    setModalState({
      isOpen: true,
      onConfirm: () => {
        const allCourses =
          JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
        delete allCourses[courseId];
        localStorage.setItem(
          "learningJourneyHistory",
          JSON.stringify(allCourses)
        );
        setHistory((prev) => prev.filter((c) => c.id !== courseId));
      },
      title: "Confirm Deletion",
      message: `Are you sure you want to remove the course "${courseTitle}"? `,
    });
  };

  const handleClearAllConfirmation = () => {
    setModalState({
      isOpen: true,
      onConfirm: () => {
        localStorage.removeItem("learningJourneyHistory");
        localStorage.removeItem("lastActiveTopicId");
        setHistory([]);
      },
      title: "Clear All History",
      message: "Are you sure you want to remove all courses?",
    });
  };

  const handleViewAllClick = () => {
    if (isGenerating) return;
    const storedHistory =
      JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
    const sortedHistory = Object.values(storedHistory).sort(
      (a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed)
    );
    setHistory(sortedHistory);
    setShowAll(true);
  };

  if (history.length === 0) {
    return null;
  }

  const recentCourse = history[0];

  return (
    <>
      <div
        className={`mt-8 bg-white p-6 shadow-xl rounded-xl w-full max-w-2xl ${
          isGenerating
            ? "pointer-events-none cursor-not-allowed opacity-50"
            : ""
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Courses
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          {/* show 5 recent courses */}
          {history.slice(0, 5).map((course) => {
            const completedSubtopicsLength =
              course.completedSubtopics?.length || 0;
            const totalSubtopics = course.topics.reduce((acc, topic) => {
              return acc + topic.subtopics.length;
            }, 0);
            const remainingTopics = totalSubtopics - completedSubtopicsLength;
            return (
              <RecentCourseItem
                key={course.id}
                course={course}
                onContinue={() => handleContinue(course.id)}
                totalSubtopics={totalSubtopics}
                remainingTopics={remainingTopics}
              />
            );
          })}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleViewAllClick}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View All History
            </button>
          </div>
        </div>
      </div>

      {showAll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col h-[90vh]">
            <div className="p-6  flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Learning History
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAll(false);
                  setSearch("");
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="p-6 flex-shrink-0">
              <input
                type="text"
                placeholder="Type to search..."
                autoFocus
                className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleClearAllConfirmation}
                  className="text-sm font-medium text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Clear All History
                </button>
              </div>
            </div>
            <div className="px-6 pb-6 flex-grow overflow-y-auto space-y-4 bg-gray-50 rounded-xl">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((course) => (
                  <CourseItem
                    key={course.id}
                    course={course}
                    onContinue={() => handleContinue(course.id)}
                    onRemove={() =>
                      handleRemoveConfirmation(course.id, course.title)
                    }
                  />
                ))
              ) : (
                <p className="text-center text-gray-600 text-lg pt-10">
                  No learning history found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirmAction}
        title={modalState.title}
        message={modalState.message}
      />
    </>
  );
}

export default ChatHistory;
