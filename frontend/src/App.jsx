import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Card from "./components/Card";
import Learn from "./components/Learn";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { ToastContainer } from "react-toastify";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import CSS normally
import "react-toastify/dist/ReactToastify.css";

const ProtectedRoute = ({ children }) => {
  console.log("ProtectedRoute");
  const { userId, loading } = useAuth();

  if (loading) return null;

  if (!userId) {
    return <Navigate to="/" />;
  }

  return children;
};

const CheckToken = ({ children }) => {
  const { userId, loading } = useAuth();
  if (loading) return null;
  if (userId) {
    return <Navigate to="/" />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Card />} />
      <Route
        path="/learn/course/:publicId"
        element={
          <ProtectedRoute>
            <Learn />
          </ProtectedRoute>
        }
      />
      <Route path="/shared/learn/course/:publicId" element={<Learn />} />
      <Route
        path="/login"
        element={
          <CheckToken>
            <LoginPage />
          </CheckToken>
        }
      />
      <Route
        path="/signup"
        element={
          <CheckToken>
            <SignupPage />
          </CheckToken>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          autoClose={1500}
          position="top-center"
          pauseOnHover={false}
          hideProgressBar={true}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
