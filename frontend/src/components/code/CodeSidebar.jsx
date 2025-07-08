import React from "react";
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

function CodeSidebar({ setActiveTab, onBack, showMobileMenu, activeTab, setShowMobileMenu }) {
  return (
    <>
      {/* Sidebar - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ZLearn
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <BookOpen className="mr-3 h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() => {
                setActiveTab("learnings");
                onViewLearnings?.();
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "learnings"
                  ? "bg-purple-50 text-purple-700 border-r-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Brain className="mr-3 h-5 w-5" />
              My Learnings
            </button>

            <button
              onClick={onBack}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <Home className="mr-3 h-5 w-5" />
              Home
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Header with Breadcrumb */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={onBack}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Home
                </button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  Choose Language
                </span>
              </nav>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "dashboard"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <BookOpen className="mr-3 h-4 w-4" />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setActiveTab("learnings");
                  onViewLearnings?.();
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "learnings"
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Brain className="mr-3 h-4 w-4" />
                My Learnings
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CodeSidebar;
