// src/components/QuizComponent.jsx
import React, { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";

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

const Quiz = ({ quizData, title, onClose, onSubmit, isQuizActive, fontSize }) => {
  const [questions, setQuestions] = useState(quizData?.questions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(""); // Stores the index of the selected option as string for the CURRENT question
  const [userSelections, setUserSelections] = useState({}); // Stores { [questionId]: selectedOptionIndexString } for ALL questions
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset state if quizData changes (e.g., new quiz is loaded)
    setQuestions(quizData?.questions || []);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowResult(false);
    setScore(0);
    setUserSelections({});
  }, [quizData]);

  const handleAnswerSubmit = () => {
    if (selectedAnswer === "") return; // Ensure an answer is selected

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = parseInt(selectedAnswer) === currentQ.correct;

    // Store the user's selection for this question
    const updatedSelections = {
      ...userSelections,
      [currentQ.id]: selectedAnswer,
    };
    setUserSelections(updatedSelections);

    let currentScore = score;
    if (isCorrect) {
      currentScore = score + 1;
      setScore(currentScore);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIdx) => prevIdx + 1);
      setSelectedAnswer(""); // Reset selection for next question
    } else {
      setShowResult(true);
      setIsSubmitting(true);
      onSubmit(currentScore, updatedSelections); // Submit final results
    }
  };

  const resetQuiz = async () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowResult(false);
    setScore(0);
    setUserSelections({}); // Reset user selections
  };
  function replaceLatexInline(text) {
    //console.log(text);
    if (!text) return "";
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
    return text.replace(/\\\((.+?)\\\)/g, (_, inner) => {
      return `$${inner.trim()}$`;
    });
  }
  if (!quizData || questions.length === 0) {
    return (
<div
  className="p-8 mb-4 bg-white rounded-lg shadow min-w-full"
  style={{
    border: '1px solid transparent',
    backgroundImage:
      'linear-gradient(white, white), linear-gradient(to right, #4285F4, #DB4437, #F4B400, #0F9D58)',
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
    boxShadow: `
      0 0 6px rgba(66, 133, 244,1),  
      0 0 6px rgba(219, 68, 55,1),    
      0 0 6px rgba(244, 180, 0, 1), 
      0 0 6px rgba(15, 157, 88, 1),
 
    `,
    transition: 'box-shadow 0.3s ease-in-out',
  }}
>


    <p className="flex items-center justify-center gap-2 text-gray-600 text-md font-medium">
      {/* Assuming you have a Loader component */}
      {/* <Loader size={21} className="text-dark-gray animate-spin" /> */}
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin text-gray-600"
      >
        <path
          fill="currentColor"
          d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
          opacity=".25"
        />
        <path
          fill="currentColor"
          d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75A11,11,0,0,0,12,1Z"
        />
      </svg>
      {`Creating a quiz on ${title}`}
    </p>
</div>
    );
  }

  if (showResult) {
    return (
      <div className="p-4 md:p-6 mb-4 bg-white border border-gray-300 rounded-lg shadow-lg text-gray-700 ">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Quiz Completed Successfully: {title}
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
                <p className={`font-medium text-[${fontSize}px] text-gray-800 mb-2`}>
                  <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {replaceLatexInline(`${questionIdx + 1}. ${q.question}`)}
                  </ReactMarkdown>
                </p>
                <div className="space-y-1.5">
                  {q.options.map((optionText, optionIdx) => {
                    const isThisOptionCorrect = optionIdx === q.correct;
                    const didUserPickThisOption =
                      userPickedOptionIndex === optionIdx.toString();

                    let optionClasses =
                      `p-2.5 rounded-md text-[${fontSize}px] flex justify-between items-center transition-colors duration-150 ease-in-out`
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
                        <span>
                
                            {replaceLatexInline(optionText)}
                     
                        </span>
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
  // console.log(currentQ);
  // console.log("heyyyaaa");
  return (
    <div className="p-4 md:p-6 mb-4 bg-white border border-gray-300 rounded-lg shadow-lg text-gray-700 max-h-120 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Quiz: {title} (Question {currentQuestionIndex + 1} of{" "}
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
        <p className={`text-[${fontSize}em] font-medium min-h-[3em]`}>
  
            {replaceLatexInline(currentQ.question)}
        
        </p>
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
                className="form-radio h-4 w-4 border-gray-300 hover:cursor-pointer"
              />
         {console.log(fontSize)}
             
              <span className={`text-[${fontSize}px]`}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {replaceLatexInline(option)}
                </ReactMarkdown>
              </span>
            </label>
          ))}
        </div>
        <button
          onClick={handleAnswerSubmit}
          disabled={selectedAnswer === ""}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
