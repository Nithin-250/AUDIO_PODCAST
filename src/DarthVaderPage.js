import React from "react";
import { useNavigate } from "react-router-dom";

function DarthVaderPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-yellow-400 font-starwars">
      <h1 className="text-6xl md:text-8xl mb-8 drop-shadow-[2px_2px_0_black]">
        Darth Vader Awaits...
      </h1>
      <p className="text-2xl mb-12 text-center max-w-2xl drop-shadow-[2px_2px_0_black]">
        Join the dark side. We have cookies.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-8 py-4 bg-yellow-400 text-black font-starwars text-lg rounded-lg hover:bg-yellow-500 transition"
      >
        Return to Home
      </button>
    </div>
  );
}

export default DarthVaderPage;
