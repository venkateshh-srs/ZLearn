import React, { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
 

  // ✅ Check if user is authenticated by calling backend
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/me`, {
          credentials: "include", // 👈 send cookies
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          // console.log("data", data);
          setUserId(data.userId); // assuming your backend returns this
        } else {
          setUserId(null);
        }
      } catch (err) {
        // console.error("Error verifying token:", err);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (id) => {
    // console.log("id", id);
    setUserId(id);
  };

  const logout = async ({ setLoggingOut }) => {
    console.log("logging out");
    setLoggingOut(true);
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      localStorage.removeItem("token");
      toast.success("Logged out successfully!", {
        position: "top-center",
        autoClose: 1200,
        theme: "dark",
      });
    } catch (e) {
      console.error("Logout failed");
    } finally {
      setUserId(null);
      setLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
