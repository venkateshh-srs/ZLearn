import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TopicInput({ input, setInput }) {
  const isDisabled = input.trim() === "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleClick = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/generate-course`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic: input }),
        }
      );

      const result = await res.json();
      // console.log(result);

      if (result.success) {
        // Optionally store in localStorage to survive refresh
        // console.log(result.data);

        navigate("/learn", {
          state: {
            data: result.data,
          },
        });
      } else {
        // Handle error — invalid topic, show message on current page
        // setError(
        //   result.message || "Could not generate content for this topic."
        // );
        // console.log(result.message);
        setError(result.message);

        // console.log("Some error");
      }
    } catch (err) {
      console.error("Failed to generate outline:", err);
      setError("An unexpected error occurred. Please try again later.");
      // console.log("Some error");

      // setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="e.g., Python Programming, Guitar Playing, Cooking..."
            className="w-full px-4 py-2 pr-10 rounded-md border-gray-300 border-2"
            value={input}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleClick();
              }
            }}
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Sparkles
              className={`w-5 ${
                isDisabled ? "text-gray-400" : " text-blue-400"
              }`}
            />
          </div>
        </div>

        <button
          disabled={isDisabled || loading}
          onClick={handleClick}
          className={`rounded-md py-2 px-4 font-medium transition flex items-center justify-center gap-2 text-white ${
            isDisabled || loading
              ? "bg-blue-400"
              : "bg-blue-500 hover:bg-blue-600 hover:cursor-pointer"
          }`}
        >
          {loading && <div className="loader" />}
          <span>
            {loading
              ? "Creating Personalized Learning"
              : "Start Learning Journey"}
          </span>
        </button>
        <div className="text-red-500 text-sm">{error && <p>{error}</p>}</div>
      </div>
      <style>{`
            .loader {
            width: 16px;
            aspect-ratio: 1;
            --c: no-repeat linear-gradient(#fff 0 0);
            background: 
                var(--c) 0%   50%,
                var(--c) 50%  50%,
                var(--c) 100% 50%;
            background-size: 20% 100%;
            animation: l1 1s infinite linear;
            }

            @keyframes l1 {
            0%  {background-size: 20% 100%,20% 100%,20% 100%}
            33% {background-size: 20% 10% ,20% 100%,20% 100%}
            50% {background-size: 20% 100%,20% 10% ,20% 100%}
            66% {background-size: 20% 100%,20% 100%,20% 10% }
            100%{background-size: 20% 100%,20% 100%,20% 100%}
            }
      `}</style>
    </>
  );
}
