import { useState } from "react";
import { Link } from "react-router-dom";
import CardHeader from "./CardHeader";
import TopicInput from "./TopicInput";
import PopularTopics from "./PopularTopics";
import ChatHistory from "./ChatHistory";
import { useAuth } from "../contexts/AuthContext";
import Modal from "./Modal";
import {
  LogOutIcon,
  LogInIcon,
  UserPlusIcon,
  XIcon,
  UserIcon,
  Loader2,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Card() {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { userId, logout, loading, login } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (loggingOut) return;
    await logout({ setLoggingOut });
    setIsLogoutModalOpen(false);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (loggingIn) return;
    // console.log(credentialResponse);
    // console.log("logging in");

    if (!credentialResponse.credential) {
      toast.error("No credential received from Google", {
        position: "top-center",
        autoClose: 2000,
        theme: "colored",
      });
      return;
    }

    try {
      setLoggingIn(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`,
        {
          token: credentialResponse.credential,
        },
        {
          withCredentials: true,
        }
      );
      const { token, userId } = data;
      // console.log("jwt", token);
      localStorage.setItem("token", token);
      // console.log("userId", userId);
      login(userId);
      toast.success("Logged in successfully!", {
        position: "top-center",
        autoClose: 1200,
        theme: "colored",
      });
      setIsAuthModalOpen(false); // Close auth modal on successful login
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        `Failed to login: ${error.response?.data?.message || error.message}`,
        {
          position: "top-center",
          autoClose: 2000,
          theme: "colored",
        }
      );
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Top Navigation */}
      <div className="absolute top-4 right-4">
        {userId ? (
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            title="Logout"
            className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 shadow border border-gray-200 text-white hover:bg-gray-900 transition ${
              loggingOut ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loggingOut}
          >
            <div className="flex items-center gap-2">
              {loggingOut ? "Logging out" : "Logout"}
              {loggingOut && <Loader2 className="animate-spin" size={16} />}
              <LogOutIcon size={20} />
            </div>
          </button>
        ) : loading || loggingOut || loggingIn ? (
          <div className="space-x-2 flex items-center">
            {loggingIn ? (
              <h1 className="text-sm font-medium text-gray-500">
                Logging in...
              </h1>
            ) : (
              <h1 className="text-sm font-medium text-gray-500">
                Checking your session...
              </h1>
            )}
          </div>
        ) : null}
      </div>
      {/* if user is not logged in show signup, login and google login */}
      {userId || loading || loggingIn ? null : (
        <div className="absolute top-4 right-4 flex items-center gap-3">
          {/* same as in modal */}
          <button
            onClick={() => navigate("/signup")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-indigo-700 border-2 border-indigo-200 font-medium shadow-md hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
          >
            <UserPlusIcon size={20} />
            Signup
          </button>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium shadow-md hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg transition-all duration-200"
          >
            <LogInIcon size={20} />
            Login
          </button>
          <button className="">
            {/* Responsive GoogleLogin: "Sign in" on small screens, "Continue with" on md+ */}
            <span className="block md:hidden">
              <GoogleLogin
                text="signin"
                shape="circle"
                size="large"
                width="100"
                onSuccess={handleGoogleLogin}
                onError={() => {
                  toast.error("Failed to login", {
                    position: "top-center",
                    autoClose: 2000,
                    theme: "colored",
                  });
                }}
              />
            </span>
            <span className="hidden md:block">
              <GoogleLogin
                text="continue_with"
                shape="circle"
                size="large"
                width="100"
                onSuccess={handleGoogleLogin}
                onError={() => {
                  toast.error("Failed to login", {
                    position: "top-center",
                    autoClose: 2000,
                    theme: "colored",
                  });
                }}
              />
            </span>
          </button>
        </div>
      )}

      <div className="flex flex-col items-center justify-start pt-28 pb-12 px-4">
        <div className="bg-white p-8 shadow-xl rounded-xl w-full max-w-2xl relative">
          <CardHeader />

          {/* Main Content Area */}
          <div className="mt-6">
            <TopicInput
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              input={input}
              setInput={setInput}
              setIsAuthModalOpen={setIsAuthModalOpen}
            />
          </div>

          <PopularTopics setInput={setInput} />
        </div>

        <ChatHistory isGenerating={isGenerating} />
      </div>

      {/* Logout Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      >
        <h3 className="text-lg font-bold">Logout</h3>
        <p className="py-4">Are you sure you want to log out?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setIsLogoutModalOpen(false)}
            className={`px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-transparent rounded-md hover:bg-gray-300 ${
              loggingOut ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loggingOut}
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className={`px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 ${
              loggingOut ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loggingOut}
          >
            <div className="flex items-center gap-2">
              {loggingOut ? "Logging out" : "Logout"}
              {loggingOut && <Loader2 className="animate-spin" size={16} />}
            </div>
          </button>
        </div>
      </Modal>

      {/* Authentication Modal */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)}>
        <div className="text-center">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-xl p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <XIcon size={20} />
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Begin Your Learning Journey
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Create personalized courses, track your progress.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            {/* Login and Signup Row */}
            <div className="flex items-center space-x-3 flex-wrap justify-center">
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium shadow-md hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg transition-all duration-200"
                onClick={() => setIsAuthModalOpen(false)}
              >
                <LogInIcon size={18} />
                Login
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-indigo-700 border-2 border-indigo-200 font-medium shadow-md hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                onClick={() => setIsAuthModalOpen(false)}
              >
                <UserPlusIcon size={18} />
                Sign Up
              </Link>
            </div>

            {/* Separator Line with "or" */}
            <div className="flex items-center w-full max-w-sm">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm font-medium bg-white">
                or
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Google OAuth Row */}
            <div className="flex justify-center">
              <GoogleLogin
                text="continue_with"
                shape="rectangular"
                size="large"
                width="300"
                onSuccess={handleGoogleLogin}
                onError={() => {
                  toast.error("Failed to login", {
                    position: "top-center",
                    autoClose: 2000,
                    theme: "colored",
                  });
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
