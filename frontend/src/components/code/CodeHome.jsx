import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Code2, ArrowLeft } from 'lucide-react';

const CodeHome = () => {
  return (
    <div className="min-h-screen bg-gray-50 bg-grid-pattern flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 m-4 relative border border-gray-200">
        <Link
          to="/"
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-colors duration-300 flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Home</span>
        </Link>
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Code2 className="text-white/80" size={60} />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-center text-gray-900 mb-4 tracking-wide">
          Learn to Code
        </h1>
        <p className="text-center text-gray-600 mb-8 text-lg">
          Interactive coding lessons with hands-on practice
        </p>
        <ul className="space-y-4 text-lg text-gray-700 mb-10">
          <li className="flex items-center">
            <Zap className="w-6 h-6 text-cyan-500 mr-4" />
            Interactive code editor
          </li>
          <li className="flex items-center">
            <Zap className="w-6 h-6 text-cyan-500 mr-4" />
            Instant feedback & testing
          </li>
          <li className="flex items-center">
            <Zap className="w-6 h-6 text-cyan-500 mr-4" />
            Step-by-step guidance
          </li>
          <li className="flex items-center">
            <Zap className="w-6 h-6 text-cyan-500 mr-4" />
            Ai assistant
          </li>
        </ul>
        <Link to="/code/learn">
          <button className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300/50">
            Start Coding Now
          </button>
        </Link>
        <p className="text-center text-gray-500 mt-8 text-sm">
          Languages: JavaScript, Python, HTML/CSS, React
        </p>
      </div>
      <style jsx>{`
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

export default CodeHome;
