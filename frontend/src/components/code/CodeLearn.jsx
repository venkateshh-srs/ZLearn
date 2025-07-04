import React, { useState } from "react";
import { ChevronRight, Star, Clock, Users, Zap } from "lucide-react";
import { DiJavascript1, DiPython } from "react-icons/di";
import { FaReact } from "react-icons/fa";
import { TbBrandCpp } from "react-icons/tb";


const CodeLearn = ({ onSelectLanguage, onBack }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const languages = [
    {
      id: "javascript",
      name: "JavaScript",
      description:
        "The language of the web. Build interactive websites and modern applications.",
      difficulty: "Beginner",
      estimatedTime: "8 hours",
      students: 125000,
      rating: 4.8,
      color: "from-yellow-300 to-yellow-500",
      textColor: "text-white",
      icon: <DiJavascript1 className="h-8 w-8" />,
      features: [
        "Variables & Functions",
        "DOM Manipulation",
        "Async Programming",
        "Modern ES6+",
      ],
    },
    {
      id: "python",
      name: "Python",
      description:
        "Versatile and beginner-friendly. Perfect for data science, web development, and automation.",
      difficulty: "Beginner",
      estimatedTime: "10 hours",
      students: 98000,
      rating: 4.9,
      color: "from-blue-400 to-blue-600",
      textColor: "text-white",
      icon: <DiPython className="h-8 w-8" />,
      features: [
        "Data Types & Structures",
        "Object-Oriented Programming",
        "Libraries & Modules",
        "File Handling",
      ],
    },
    {
      id: "react",
      name: "React",
      description:
        "Build powerful user interfaces with the most popular JavaScript library.",
      difficulty: "Intermediate",
      estimatedTime: "12 hours",
      students: 87000,
      rating: 4.7,
      color: "from-cyan-400 to-cyan-600",
      textColor: "text-white",
      icon: <FaReact className="h-8 w-8" />,
      features: ["Components & JSX", "State Management", "Hooks", "Routing"],
    },
    {
      id: "c++",
      name: "C++",
      description:
        "A powerful, high-performance language used in game development, and system software.",
      difficulty: "Intermediate",
      estimatedTime: "15 hours",
      students: 75000,
      rating: 4.6,
      color: "from-indigo-400 to-indigo-600",
      textColor: "text-white",
      icon: <TbBrandCpp className="h-8 w-8" />,
      features: [
        "Pointers & Memory Management",
        "Object-Oriented Programming",
        "Standard Template Library (STL)",
        "Performance Optimization",
      ],
    },
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "text-green-700 bg-green-100";
      case "Intermediate":
        return "text-yellow-700 bg-yellow-100";
      case "Advanced":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>Back to Learning Platform</span>
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Choose Your Language
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start your coding journey with interactive lessons, hands-on
              challenges, and instant feedback
            </p>
          </div>
        </div>
      </div>

      {/* Language Cards */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {languages.map((language) => (
            <div
              key={language.id}
              className={`bg-white rounded-2xl shadow-md border transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-1 hover:shadow-lg ${
                selectedLanguage === language.id
                  ? `border-blue-500 ring-4 ring-blue-50`
                  : "border-gray-200"
              }`}
              onClick={() => setSelectedLanguage(language.id)}
            >
              <div className={`p-8 bg-gradient-to-r ${language.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-3xl font-bold ${language.textColor}`}>
                    {language.name}
                  </h3>
                  {React.cloneElement(language.icon, { className: `${language.textColor} h-8 w-8` })}
                </div>
                <p className={`${language.textColor} opacity-80 leading-relaxed`}>
                  {language.description}
                </p>
              </div>
              <div className="p-8">
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{language.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{`${(language.students / 1000).toFixed(0)}k+`}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span>{language.rating}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <h4 className="font-semibold text-gray-700 flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <span>What you'll learn:</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {language.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 text-sm text-gray-600"
                      >
                        <div className={`w-2 h-2 ${language.color.split(' ')[0].replace('from-', 'bg-')} rounded-full`}></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLanguage(language.id);
                  }}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105 ${
                    selectedLanguage === language.id
                      ? `bg-gradient-to-r ${language.color} text-white shadow-md`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>Start Learning</span>
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-lg">
            <h3 className="text-3xl font-bold text-gray-800 mb-6">
              Why Learn to Code with Us?
            </h3>
            <div className="grid md:grid-cols-3 gap-10 mt-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-xl text-gray-800 mb-2">
                  Interactive Coding
                </h4>
                <p className="text-gray-600">
                  Write real code in your browser with instant feedback.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-xl text-gray-800 mb-2">
                  Step-by-Step Guidance
                </h4>
                <p className="text-gray-600">
                  Learn at your own pace with structured, guided challenges.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-xl text-gray-800 mb-2">
                  AI Assistant
                </h4>
                <p className="text-gray-600">
                  Get unstuck fast with our integrated AI tutor and support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeLearn;
