import React, { useState, useRef } from "react";
import {
  ChevronRight,
  Clock,
  Zap,
  Send,
  Sparkles,
  BookOpen,
  GraduationCap,
  Brain,
  Target,
  Home,
  ChevronDown,
  Sidebar,
} from "lucide-react";
import { Icon } from "@iconify/react";
import CodeSidebar from "./CodeSidebar";

const CodeLearn = ({ onSelectLanguage, onBack, onViewLearnings }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const aiCourseGenerationRef = useRef(null);
  const languages = [
    {
      id: "javascript",
      name: "JavaScript",
      icon: "logos:javascript",
      description:
        "Master the language that powers the modern web and build dynamic applications.",
      difficulty: "Beginner",
      estimatedTime: "8 hours",
      color: "#F7DF1E",
      hoverColor: "hover:text-yellow-500",
      features: [
        "Variables & Functions",
        "DOM Manipulation",
        "Async Programming",
        "Modern ES6+",
        "Event Handling",
        "API Integration",
      ],
    },
    {
      id: "python",
      name: "Python",
      icon: "logos:python",
      description:
        "Learn the versatile language for AI, data science, and backend development.",
      difficulty: "Beginner",
      estimatedTime: "10 hours",
      color: "#3776AB",
      hoverColor: "hover:text-blue-600",
      features: [
        "Data Types & Structures",
        "Object-Oriented Programming",
        "Libraries & Modules",
        "File Handling",
        "Web Frameworks",
        "Machine Learning",
      ],
    },
    {
      id: "react",
      name: "React",
      icon: "logos:react",
      description:
        "Build powerful user interfaces with the most popular JavaScript library.",
      difficulty: "Intermediate",
      estimatedTime: "12 hours",
      color: "#61DAFB",
      hoverColor: "hover:text-cyan-500",
      features: [
        "Components & JSX",
        "State Management",
        "Hooks",
        "Routing",
        "Context API",
        "Performance Optimization",
      ],
    },
    {
      id: "html-css",
      name: "HTML & CSS",
      icon: "vscode-icons:file-type-html", // or logos:html5 if you prefer
      description:
        "Master the foundation of web development and create stunning websites.",
      difficulty: "Beginner",
      estimatedTime: "6 hours",
      color: "#E34F26",
      hoverColor: "hover:text-red-500",
      features: [
        "Semantic HTML",
        "CSS Flexbox & Grid",
        "Responsive Design",
        "Animations",
        "CSS Variables",
        "Modern Layouts",
      ],
    },
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "Intermediate":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "Advanced":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const handleAiCourseGeneration = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);

    // Simulate AI processing
    setTimeout(() => {
      console.log("Generating course for:", aiPrompt);
      setIsGenerating(false);
      setAiPrompt("");
    }, 2000);
  };

  const SimpleIcon = ({ path, className, style }) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CodeSidebar setActiveTab={setActiveTab} onBack={onBack} showMobileMenu={showMobileMenu} activeTab={activeTab} setShowMobileMenu={setShowMobileMenu} />
      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Sticky Compact Header - Desktop Only */}
        <div className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">
                      Programming Languages
                    </h1>
                    <p className="text-xs text-gray-500">
                      Choose your path to mastery
                    </p>
                  </div>
                </div>
              </div>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg shadow hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                onClick={() => setShowAiModal?.(true)}
                type="button"
              >
                <span>Create with AI</span>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Language Cards */}
        <div className="p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {languages.map((language, index) => (
                <div
                  key={language.id}
                  className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden group cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                    selectedLanguage === language.id
                      ? "border-blue-300 ring-2 ring-blue-100 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedLanguage(language.id)}
                >
                  <div className="p-7">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                        <Icon icon={`${language.icon}`} width={48} />
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium border ${getDifficultyColor(
                            language.difficulty
                          )}`}
                        >
                          {language.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {language.name}
                      </h3>
                      <p className="text-gray-600 text-base mb-5 leading-relaxed">
                        {language.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-5">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{language.estimatedTime}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                        <h4 className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-blue-500" />
                          <span>You'll learn:</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {language.features
                            .slice(0, 4)
                            .map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-3 text-sm text-gray-600"
                              >
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span>{feature}</span>
                              </div>
                            ))}
                          {language.features.length > 4 && (
                            <div className="flex items-center space-x-3 text-sm text-gray-500 italic">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <span>
                                ...and {language.features.length - 4} more
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLanguage(language.id);
                      }}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-all duration-200 flex items-center justify-center space-x-2 ${
                        selectedLanguage === language.id
                          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 group-hover:bg-blue-50 group-hover:text-blue-700"
                      }`}
                    >
                      <span>Start Learning</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Course Generation Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 lg:p-8 border border-purple-200" ref={aiCourseGenerationRef}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  AI-Powered Course Creation
                </h3>
                <p className="text-gray-600 text-base max-w-2xl mx-auto">
                  Describe your learning goals and let our AI create a
                  personalized curriculum just for you
                </p>
              </div>

              <form
                onSubmit={handleAiCourseGeneration}
                className="max-w-2xl mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., 'Mobile app development with React Native' or 'Advanced Python for data science'"
                      disabled={isGenerating}
                      className="w-full px-4 py-3 text-base border border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2 min-w-[120px]"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* AI Features */}
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <Brain className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 text-base mb-1">
                    AI-Powered
                  </h4>
                  <p className="text-sm text-gray-600">
                    Smart course generation
                  </p>
                </div>

                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 text-base mb-1">
                    Personalized
                  </h4>
                  <p className="text-sm text-gray-600">
                    Tailored to your goals
                  </p>
                </div>

                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 text-base mb-1">
                    Interactive
                  </h4>
                  <p className="text-sm text-gray-600">Hands-on learning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeLearn;
