import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, BookOpen } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};

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

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        }
      );
      if (response.status === 201) {
        localStorage.setItem("token", response.data.token);
        login(response.data.userId);
        toast.success("Signup successful", {
          position: "top-center",
          autoClose: 1000,
          theme: "colored",
          hideProgressBar: true,
          closeOnClick: true,
        });
        navigate("/");
      }
    } catch (error) {
      if (error.response.status === 409) {
        setErrors({
          email: "Email already exists",
        });
      } else {
        setErrors({
          email: "Something went wrong. Please try again.",
        });
      }
      console.error("Signup error:", error.message);
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
          Create your account
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          Start your journey with us
        </p>
        <form className="space-y-2" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Email address
            </label>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setErrors({ ...errors, email: "" });
                  setEmail(e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.email ? "border-red-400" : "border-gray-200"
                } bg-gray-50 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm`}
                placeholder="you@email.com"
              />
              <div style={{ minHeight: "1.25rem" }}>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>
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
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setErrors({ ...errors, password: "" });
                  setPassword(e.target.value);
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
            <div style={{ minHeight: "1.25rem" }}>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setErrors({ ...errors, confirmPassword: "" });
                  setConfirmPassword(e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.confirmPassword ? "border-red-400" : "border-gray-200"
                } bg-gray-50 focus:border-indigo-400 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm pr-10`}
                placeholder="••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeIcon
                    className={`w-5 h-5 ${
                      showConfirmPassword ? "opacity-80" : "opacity-50"
                    }`}
                  />
                ) : (
                  <EyeOffIcon
                    className={`w-5 h-5 ${
                      showConfirmPassword ? "opacity-80" : "opacity-50"
                    }`}
                  />
                )}
              </button>
            </div>
            <div style={{ minHeight: "1.25rem" }}>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 ">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className={`w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold text-base shadow-md hover:from-indigo-700 hover:to-blue-600 transition-all duration-200 focus:outline-none ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              Sign up
            </button>
          </div>
        </form>
        <div className="mt-8 text-center text-gray-500 text-sm">
          Already have an account?{" "}
          <span
            className="text-indigo-600 hover:underline cursor-pointer transition"
            onClick={() => navigate("/login")}
          >
            Log in
          </span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
