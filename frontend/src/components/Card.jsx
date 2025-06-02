import { useState } from "react";
import CardHeader from "./CardHeader";
import TopicInput from "./TopicInput";
import PopularTopics from "./PopularTopics";

export default function Card() {
  const [input, setInput] = useState("");
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 shadow-xl rounded-xl w-full max-w-2xl">
        <CardHeader />
        <div className="mt-4">
          <TopicInput input={input} setInput={setInput} />
        </div>
        <PopularTopics setInput={setInput} />
      </div>
    </div>
  );
}
