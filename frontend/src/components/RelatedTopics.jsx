import React from "react";
import { ArrowRight } from "lucide-react";

function RelatedTopics({ relatedTopics, handleRelatedTopicClick, fontSize }) {
  return (
    <div className="pt-6 border-t border-gray-100">
      <div className="max-w-3xl">
        <h2 className="text-sm font-medium text-gray-800 mb-3">
          Explore Further
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relatedTopics.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                //console.log("Prompt clicked:", prompt); // Add this line
                handleRelatedTopicClick(prompt);
              }}
              className="flex w-full items-center gap-2 rounded-md bg-gray-50 p-3 text-left hover:cursor-pointer hover:bg-blue-50"
            >
              <ArrowRight className="flex-shrink-0 text-blue-500" size={15} />
              <span className={`text-[${fontSize}] text-gray-700`}>
                {prompt}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default RelatedTopics;
