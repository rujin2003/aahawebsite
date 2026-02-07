"use client";
import React from "react";

const MissionSection = () => {
  return (
    <section className="py-20 relative overflow-hidden gradient-background">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm z-10" />
      <div className="container text-center max-w-3xl relative z-20">
        <h2 className="text-2xl md:text-3xl mb-6 animate-on-scroll fade-up font-medium text-slate-800">
          <span className="text-[#8B7355] font-semibold italic">Aaha Felt</span> – Handmade with soul, crafted with care to bring warmth, beauty, and meaning into every space
        </h2>
        <div className="flex flex-wrap justify-center gap-3 mt-8 animate-on-scroll fade-up">
          {["quality craftsmanship", "sustainable materials", "heritage techniques", "unique designs"].map((text) => (
            <div
              key={text}
              className="flex items-center text-sm border-2 border-[#0000] bg-transparent rounded-full px-4 py-2  hover:bg-white/20 transition-all group shadow-sm hover:shadow-md"
            >
              <span className="text-black font-medium tracking-wide italic">
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Gradient animation: disabled on mobile for performance.
          Mobile gets a static gradient background instead. */}
      <style jsx>{`
        .gradient-background {
          background: linear-gradient(300deg, #f2d5e8, #d5e8f2, #f2e8d5);
          background-size: 180% 180%;
          animation: gradient-animation 18s ease infinite;
        }
        @keyframes gradient-animation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @media (max-width: 768px) {
          .gradient-background {
            background: linear-gradient(300deg, #f2d5e8, #d5e8f2, #f2e8d5);
            background-size: 100% 100%;
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default MissionSection;
