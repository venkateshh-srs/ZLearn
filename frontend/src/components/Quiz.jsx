// src/components/QuizComponent.jsx
import React, { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Loader } from "lucide-react";

// Mock quiz data - adjust as needed, ideally fetch or pass based on subtopicName
const allQuizData = {
  Default: [
    {
      id: "default1",
      question: " What is 2+2?",
      options: ["2", "4", "5", "6"],
      correct: 1,
    },
    {
      id: "default2",
      question: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      correct: 1,
    },
  ],
  "Introduction to Machine Learning": [
    {
      id: "ml1",
      question: "What is the primary goal of Machine Learning?",
      options: [
        "To explicitly program computers for every task",
        "To enable systems to learn from data and improve with experience",
        "To replace human intelligence entirely",
        "To design faster computer hardware",
      ],
      correct: 1,
    },
    {
      id: "ml2",
      question: "Which of these is a common type of Machine Learning?",
      options: [
        "Supervised Learning",
        "Submerged Learning",
        "Solar Learning",
        "Surface Learning",
      ],
      correct: 0,
    },
  ],
  "Supervised Learning": [
    {
      id: "sl1",
      question: "What does 'labeled data' refer to in Supervised Learning?",
      options: [
        "Data that has been encrypted for security",
        "Data where the output or target variable is already known",
        "Data that is sorted alphabetically",
        "Data that has no clear patterns",
      ],
      correct: 1,
    },
    {
      id: "sl2",
      question: "Classification is a type of:",
      options: [
        "Unsupervised Learning problem",
        "Reinforcement Learning problem",
        "Supervised Learning problem",
        "Dimensionality Reduction technique",
      ],
      correct: 2,
    },
  ],
  // Add more subtopics and their respective questions here
};

const Quiz = ({ subtopicName, onClose, messages }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(""); // Stores the index of the selected option as string for the CURRENT question
  const [userSelections, setUserSelections] = useState({}); // Stores { [questionId]: selectedOptionIndexString } for ALL questions
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const formattedMessages = messages.map((msg) => ({
          role: msg.sender === "llm" ? "assistant" : "user",
          content: msg.text,
        }));
        const response = await generateQuiz(subtopicName, formattedMessages);
        // console.log(response.data);
        const newQuestions = response.data.data.questions;
        setQuestions(newQuestions);

        // Reset quiz state when subtopic changes or quiz initially loads
        setCurrentQuestionIndex(0);
        setSelectedAnswer("");
        setShowResult(false);
        setScore(0);
        setUserSelections({}); // Reset user selections
      } catch (error) {
        console.error("Failed to fetch quiz:", error);
      }
    };

    if (subtopicName) {
      fetchQuiz();
    }
  }, []);

  const handleAnswerSubmit = () => {
    if (selectedAnswer === "") return; // Ensure an answer is selected

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = parseInt(selectedAnswer) === currentQ.correct;

    // Store the user's selection for this question
    setUserSelections((prevSelections) => ({
      ...prevSelections,
      [currentQ.id]: selectedAnswer,
    }));

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIdx) => prevIdx + 1);
      setSelectedAnswer(""); // Reset selection for next question
    } else {
      setShowResult(true);
    }
  };
  const generateQuiz = async (subtopicName, messages) => {
    // console.log(subtopicName, messages);

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/generate-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subtopicName, messages }),
    });

    // console.log(response);

    return response.json();
  };
  const resetQuiz = async () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowResult(false);
    setScore(0);
    setUserSelections({}); // Reset user selections
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 mb-4 bg-white border border-gray-300 rounded-lg shadow min-w-full">
        <p className="flex items-center justify-center gap-2 text-gray-600 text-md font-medium">
          <Loader size={21} className="text-dark-gray animate-spin" />
          {`Creating a quiz on ${subtopicName}...`}
        </p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="p-4 md:p-6 mb-4 bg-white border border-gray-300 rounded-lg shadow-lg text-gray-700 ">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Quiz Complete: {subtopicName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            Your Score: {score}/{questions.length}
          </div>
          <p className="text-gray-600 text-sm">
            {score === questions.length
              ? "Excellent! You've mastered this topic!"
              : score >= questions.length * 0.7
              ? "Great job! You have a good understanding."
              : "Good effort! Review the answers below to learn more."}
          </p>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 border-t border-gray-200 pt-4">
          <h3 className="text-md font-semibold text-gray-800 mb-2">
            Review Your Answers:
          </h3>
          {questions.map((q, questionIdx) => {
            const userPickedOptionIndex = userSelections[q.id]; // This is a string
            const userPickedThisQuestion = userPickedOptionIndex !== undefined;

            return (
              <div
                key={q.id}
                className="p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <p className="font-medium text-[15px] text-gray-800 mb-2">
                  {questionIdx + 1}. {q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((optionText, optionIdx) => {
                    const isThisOptionCorrect = optionIdx === q.correct;
                    const didUserPickThisOption =
                      userPickedOptionIndex === optionIdx.toString();

                    let optionClasses =
                      "p-2.5 rounded-md text-sm flex justify-between items-center transition-colors duration-150 ease-in-out ";
                    let correctnessIndicator = null;

                    if (didUserPickThisOption) {
                      if (isThisOptionCorrect) {
                        optionClasses +=
                          "bg-green-100 text-green-800 border border-green-400 shadow-sm";
                        correctnessIndicator = (
                          <CheckCircle
                            size={18}
                            className="text-green-600 flex-shrink-0"
                          />
                        );
                      } else {
                        optionClasses +=
                          "bg-red-100 text-red-800 border border-red-400 shadow-sm";
                        correctnessIndicator = (
                          <XCircle
                            size={18}
                            className="text-red-600 flex-shrink-0"
                          />
                        );
                      }
                    } else if (isThisOptionCorrect) {
                      optionClasses +=
                        "bg-white text-gray-900 border border-green-500"; // Highlight correct answer if not picked by user or user was wrong
                      correctnessIndicator = (
                        <span className="text-xs text-green-700 font-medium items-center flex gap-1">
                          <CheckCircle
                            size={16}
                            className="text-green-600 flex-shrink-0"
                          />{" "}
                          Correct
                        </span>
                      );
                    } else {
                      optionClasses +=
                        "bg-white text-gray-700 border border-gray-300";
                    }

                    return (
                      <div key={optionIdx} className={optionClasses}>
                        <span>{optionText}</span>
                        {correctnessIndicator}
                      </div>
                    );
                  })}
                  {!userPickedThisQuestion && (
                    <p className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded-md mt-1 border border-yellow-300">
                      You did not answer this question.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-center pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={resetQuiz}
            className="px-5 py-2 text-sm font-medium text-blue-600 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors cursor-pointer"
          >
            Retake Quiz
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  // Current question display (remains largely the same)
  const currentQ = questions[currentQuestionIndex];
  return (
    <div className="p-4 md:p-6 mb-4 bg-white border border-gray-300 rounded-lg shadow-lg text-gray-700 max-h-120 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Quiz: {subtopicName} (Question {currentQuestionIndex + 1} of{" "}
          {questions.length})
        </h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      <div className="space-y-4">
        <p className="text-md font-medium min-h-[3em]">{currentQ.question}</p>{" "}
        {/* Added min-h for consistency */}
        <div className="space-y-2">
          {currentQ.options.map((option, index) => (
            <label
              key={index}
              htmlFor={`option-${currentQ.id}-${index}`}
              className={`flex items-center p-3.5 space-x-3 border-2 rounded-lg hover:cursor-pointer transition-all duration-150 ease-in-out 
                          ${
                            selectedAnswer === index.toString()
                              ? "bg-blue-100 border-blue-200 ring-2 ring-blue-400 shadow-md"
                              : "border-gray-300"
                          }`}
            >
              <input
                type="radio"
                id={`option-${currentQ.id}-${index}`}
                name={`question-${currentQ.id}`}
                value={index.toString()}
                checked={selectedAnswer === index.toString()}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="form-radio h-4 w-4 focus:ring-blue-500 border-gray-300 hover:cursor-pointer"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleAnswerSubmit}
          disabled={selectedAnswer === ""}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {currentQuestionIndex < questions.length - 1
            ? "Next Question"
            : "Finish Quiz"}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
