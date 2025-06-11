//add a chat history where there will be list if all the learnings visible in home page with progress,topicname,no.of topics completed ,no of topics left, and a button to go to the learn page

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Book, X, Trash2 } from "lucide-react";

const CourseItem = ({ course, onContinue, index, setHistory }) => {
  const {
    title,
    lastAccessed,
    progress,
    topics,
    chatThreads,
    completedSubtopics,
  } = course;
  const courseId = course.id;
  const handleRemoveTopic = (courseId) => {
    console.log(courseId);
    const allCourses =
      JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
    delete allCourses[courseId];
    localStorage.setItem("learningJourneyHistory", JSON.stringify(allCourses));
    const storedHistory =
      JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
    const sortedHistory = Object.values(storedHistory).sort(
      (a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed)
    );
    console.log(sortedHistory);
    setHistory(sortedHistory);
  };

  const formattedDate = `Last accessed: ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    // year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(lastAccessed))}`;
  //   console.log(formattedDate);

  const completedSubtopicsLength = completedSubtopics?.length || 0;

  const totalSubtopics = (topics || []).reduce((acc, topic) => {
    return (
      acc +
      (topic.subtopics || []).reduce((subAcc, subtopic) => {
        if (subtopic?.subtopics?.length > 0) {
          return subAcc + subtopic?.subtopics?.length;
        } else {
          return subAcc + 1;
        }
      }, 0)
    );
  }, 0);

  //   console.log(totalSubtopicsCompleted);
  const totalMessages = Object.values(chatThreads || {}).flat().length;
  const remainingTopics = totalSubtopics - completedSubtopicsLength;

  return (
    // create a modal and ask for confirmation before removing the course
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 flex items-center justify-between">
      <div className="flex-grow">
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
          <div className="flex justify-between items-center mt-2.5 flex-col sm:flex-row gap-3.5">
            <p className="text-xs text-gray-500 mt-2">{`${completedSubtopicsLength}/${totalSubtopics} topics completed • ${remainingTopics} remaining`}</p>

            <div className="flex items-center">
              <button
                onClick={() => handleRemoveTopic(courseId)}
                className="text-sm font-medium text-red-400 hover:text-red-500 flex items-center gap-1 bg-white px-5 py-2.5 rounded-md border border-red-200"
              >
                Remove
              </button>
              <button
                onClick={() => onContinue(title)}
                className="bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 self-center ml-6 flex-shrink-0"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentCourseItem = ({ course, onContinue }) => {
  console.log(course);
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
    <div className="p-4 rounded-lg border border-gray-200 bg-white ">
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
        <div>
          <p className="text-sm text-gray-500">Progress</p>
          <p className="text-md font-medium text-gray-700">{progress || 0}%</p>
        </div>

        <button
          onClick={() => onContinue(title)}
          className="bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 self-end"
        >
          Continue
        </button>
      </div>
      {/* show the progress in a bar */}
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
  useEffect(() => {
    const storedHistory =
      JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};

    const sortedHistory = Object.values(storedHistory).sort(
      (a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed)
    );
    console.log(sortedHistory);

    setHistory(sortedHistory);
    // setFilteredHistory(sortedHistory);
  }, []);
  useEffect(() => {
    const filtered = history.filter((course) =>
      course.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredHistory(filtered);
  }, [search, history]);
  //   console.log(filteredHistory);

  const handleContinue = (topicId) => {
    if (isGenerating) {
      return;
    }
    console.log(topicId);
    navigate("/learn", { state: { topicId } });
  };

  const handleViewAllClick = () => {
    // Re-fetch and sort history when opening modal to get latest data
    if (isGenerating) {
      return;
    }
    const storedHistory =
      JSON.parse(localStorage.getItem("learningJourneyHistory")) || {};
    console.log(storedHistory);
    const sortedHistory = Object.values(storedHistory).sort(
      (a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed)
    );
    setHistory(sortedHistory);
    setShowAll(true);
  };

  const handleClearAllHistory = () => {
    if (isGenerating) {
      return;
    }
    localStorage.removeItem("learningJourneyHistory");
    setHistory([]);
    setFilteredHistory([]);
  };

  if (history.length === 0) {
    return null;
  }

  const recentCourse = history[0];

  return (
    // disable the component if isGenerating is true
    <div
      className={`mt-8 ${
        isGenerating ? "pointer-events-none cursor-not-allowed opacity-50" : ""
      }`}
    >
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Courses
            </h2>
          </div>
          <button
            onClick={handleViewAllClick}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View All History
          </button>
        </div>

        <div className="space-y-2">
          {/* Ask for confirmation before clearing all history in a small cute modal with a yes and no button */}

          <div className="flex justify-end mt-3"></div>
          <RecentCourseItem
            course={recentCourse}
            onContinue={() => handleContinue(recentCourse.id)}
          />
          <button
            onClick={() => handleClearAllHistory()}
            className="text-sm font-medium text-red-600 hover:underline flex items-center gap-2"
          >
            Clear All History <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      </div>

      {showAll && (
        //close the modal if clicked outside
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {/* fixed height of the modal */}
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-full">
            {/* Learning histriry alson woth icon and title close symbol shoulbe in top rig*/}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 pt-8 pl-6 ">
                <Clock size={20} className="text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Learning History
                </h2>
              </div>
              <X
                size={28}
                className="text-gray-500 hover:text-gray-800 cursor-pointer mr-6 mt-8"
                onClick={() => {
                  setShowAll(false);
                  setSearch("");
                }}
              />
            </div>

            <div className="p-6 flex justify-between gap-4 items-center">
              {/* add a search bar to search the history */}

              <input
                type="text"
                placeholder="Type to search"
                autoFocus
                className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 "
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 bg-gray-50">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((course, index) => (
                  <CourseItem
                    key={course.id}
                    course={course}
                    onContinue={() => handleContinue(course.id)}
                    index={index}
                    setHistory={setHistory}
                  />
                ))
              ) : (
                <p className="text-center text-gray-600 text-lg">
                  No learning history found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatHistory;
