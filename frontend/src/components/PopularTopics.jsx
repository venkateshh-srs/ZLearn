const topics = [
  "Data Science",
  "Machine Learning",
  "React Development",
  "Digital Marketing",
  "Photography",
  "Calculus & Mathematics",
  "Angular",
];

export default function PopularTopics({ setInput }) {
  return (
    <div className=" text-center mt-4">
      <p className="text-gray-500 mb-2">Or try one of these popular topics:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {topics.map((topic) => (
          <button
            key={topic}
            className="border border-gray-300 rounded-[6px] px-4 py-1.5 text-xs hover:bg-blue-100 hover:border-blue-400 hover:cursor-pointer transition text-gray-700"
            onClick={() => {
              setInput(topic);
            }}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
