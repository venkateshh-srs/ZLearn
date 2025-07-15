import { useState } from "react";
import { Link } from "react-router-dom";
import CardHeader from "./CardHeader";
import TopicInput from "./TopicInput";
import PopularTopics from "./PopularTopics";
import ChatHistory from "./ChatHistory";
import { useAuth } from "../contexts/AuthContext";
import Modal from "./Modal";
import { LogOutIcon, LogInIcon, UserPlusIcon } from "lucide-react";

export default function Card() {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { userId, logout, loading } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="absolute top-4 right-4">
        {userId ? (
          // logout lucid   
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            title="Logout"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 shadow border border-gray-200 text-white hover:bg-gray-900 transition"
          
          >
            Logout
            <LogOutIcon size={20} />
          </button>
        ) : loading ? (
          <div className="space-x-2 flex items-center">
            <h1 className="text-sm font-medium text-gray-500">
              Checking your session...
            </h1>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-full  bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium shadow hover:from-indigo-700 hover:to-blue-600 transition"
            >
              <LogInIcon size={18} />
              Login
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-indigo-700 border border-indigo-200 font-medium shadow hover:bg-indigo-50 transition"
            >
              <UserPlusIcon size={18} />
              Sign up
            </Link>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-start pt-16 sm:pt-24 pb-12 px-4">
        <div className="bg-white p-8 shadow-xl rounded-xl w-full max-w-2xl relative">
          <CardHeader />
          <div className="mt-4">
            <TopicInput
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              input={input}
              setInput={setInput}
            />
          </div>
          <PopularTopics setInput={setInput} />
        </div>
        <ChatHistory isGenerating={isGenerating} />
      </div>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      >
        <h3 className="text-lg font-bold">Logout</h3>
        <p className="py-4">Are you sure you want to log out?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setIsLogoutModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-transparent rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </Modal>
    </div>
  );
}
