import React from "react";
import { useNavigate } from "react-router-dom";
import starwarsBg from "./assets/starwars-bg.jpg";
import darthVaderFull from "./assets/darth-vader-full.jpg";

const DarthVader = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen text-yellow-400 flex flex-col items-center justify-center p-8 font-starwars bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${starwarsBg})` }}
    >
      {/* Right and left black transparent panels */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-black bg-opacity-60 z-0" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-black bg-opacity-60 z-0" />

      {/* Title */}
      <h1 className="text-6xl md:text-8xl font-starwars uppercase mb-6 text-center text-yellow-400 drop-shadow-[2px_2px_0_black] z-10">
  Darth Vader
</h1>

      {/* Darth Vader image */}
      <img
        src={darthVaderFull}
        alt="Darth Vader Full"
        className="w-64 h-auto mb-6 rounded-lg border-4 border-yellow-500 shadow-2xl z-10"
      />

      {/* Description */}
      <p className="max-w-3xl text-2xl text-center border-2 border-yellow-500 p-8 rounded-lg shadow-2xl bg-black bg-opacity-60 z-10">
        Darth Vader, once Anakin Skywalker, was a legendary Jedi Knight who turned to the dark side of the Force and became a Sith Lord.
        He served as the right hand of Emperor Palpatine and hunted down the Jedi during the Great Jedi Purge. Ultimately, he found
        redemption through his son, Luke Skywalker, by destroying the Emperor and bringing balance to the Force.
      </p>

      {/* Back Button */}
      <button
  onClick={() => navigate("/")}
  className="mt-12 px-6 py-4 bg-yellow-400 text-black font-starwars text-lg rounded-lg hover:bg-yellow-500 transition z-10"
>
  Return to the Dark (Home)
</button>
    </div>
  );
};

export default DarthVader;