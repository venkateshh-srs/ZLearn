import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, BookOpen } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("Login request received:", { email, password });
    if (loading) {
      return;
    }

    if (!validate()) {
      return;
    }
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        }
      );
      // console.log(response);
      if (response.status === 200) {
        login(response.data.token);
        // console.log(response.data.token);
        toast.success("Logged in successfully ", {
          position: "top-center",
          autoClose: 2000,
          theme: "colored",
        });

        navigate("/");
      }
    } catch (error) {
      if (error.response.status === 401) {
        setErrors({
          password: "Invalid credentials.",
        });
      } else {
        setErrors({
          password: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-100">
      <div className="w-full max-w-md p-10 rounded-3xl shadow-xl bg-white/80 backdrop-blur-md border border-gray-200 transition-all duration-300">
        {/* back button to home page */}
        <button
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
          onClick={() => navigate("/")}
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-3xl font-extrabold text-center text-gray-700 mb-2 tracking-tight">
          Welcome back
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          Sign in to your account
        </p>
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: "" });
              }}
              className={`w-full px-4 py-3 rounded-md border ${
                errors.email ? "border-red-400" : "border-gray-200"
              } bg-gray-50 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm `}
              placeholder="you@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: "" });
                }}
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.password ? "border-red-400" : "border-gray-200"
                } bg-gray-50 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm pr-10`}
                placeholder="••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeIcon
                    className={`w-5 h-5 ${
                      showPassword ? "opacity-80" : "opacity-50"
                    }`}
                  />
                ) : (
                  <EyeOffIcon
                    className={`w-5 h-5 ${
                      showPassword ? "opacity-80" : "opacity-50"
                    }`}
                  />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 ">{errors.password}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className={`w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold text-base shadow-md hover:from-indigo-700 hover:to-blue-600 transition-all duration-200 focus:outline-none ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              Sign in
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-gray-500 text-sm">
          Don't have an account?{" "}
          <span
            className="text-indigo-600 hover:underline cursor-pointer transition"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
