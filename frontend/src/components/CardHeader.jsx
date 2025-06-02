import { BookOpen } from "lucide-react";

export default function CardHeader() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-blue-500 text-white p-3 rounded-full">
        <BookOpen />
      </div>
      <h2 className="text-3xl text-blue-400 text-center font-bold">
        What would you like to learn today?
      </h2>
      <p className="text-center text-[18px] text-gray-600">
        Tell me any topic, and I'll create a personalized learning journey just
        for you.
      </p>
    </div>
  );
}
