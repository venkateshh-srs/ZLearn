import { useState } from "react";
import CardHeader from "./CardHeader";
import TopicInput from "./TopicInput";
import PopularTopics from "./PopularTopics";
import ChatHistory from "./ChatHistory";
export default function Card() {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  return (
    <>
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-xl rounded-xl w-full max-w-2xl">
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
          <ChatHistory isGenerating={isGenerating} />
        </div>
      </div>
    </>
  );
}
