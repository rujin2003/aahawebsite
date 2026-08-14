"use client";
import React from "react";

// The five wool dots echo the five hanging characters above; each promise
// chip is tinted like a dyed felt ball.
const FELT_DOTS = ["#9c5fa8", "#e8a13c", "#d8577a", "#4a93b8", "#8f8f8d"];

const CHIPS = [
  { text: "quality craftsmanship", color: "#c2571b" },
  { text: "sustainable materials", color: "#6f8a5e" },
  { text: "heritage techniques", color: "#9c5fa8" },
  { text: "unique designs", color: "#4a93b8" },
];

const MissionSection = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden gradient-background">
      <div className="absolute inset-0 bg-white/25 backdrop-blur-sm z-10" />
      <div className="container text-center max-w-3xl relative z-20">
        {/* a little row of dyed wool balls — one for each hanging character */}
        <div className="flex justify-center gap-3 mb-7 animate-on-scroll fade-up">
          {FELT_DOTS.map((c, i) => (
            <span
              key={c}
              className="rounded-full"
              style={{
                width: 12,
                height: 12,
                backgroundColor: c,
                boxShadow: `0 2px 4px ${c}55, inset -2px -2px 3px rgba(0,0,0,0.15)`,
                transform: `translateY(${i % 2 === 0 ? 0 : 4}px)`,
              }}
            />
          ))}
        </div>

        <h2 className="text-2xl md:text-3xl mb-8 animate-on-scroll fade-up font-medium text-foreground leading-relaxed">
          <span className="text-primary font-semibold italic">Aaha Felt</span> – Handmade with soul,
          crafted with care to bring{" "}
          <span className="font-playfair italic" style={{ color: "#c2571b" }}>warmth</span>,{" "}
          <span className="font-playfair italic" style={{ color: "#c05580" }}>beauty</span>, and{" "}
          <span className="font-playfair italic" style={{ color: "#6f8a5e" }}>meaning</span> into
          every space
        </h2>

        <div className="flex flex-wrap justify-center gap-3 mt-8 animate-on-scroll fade-up">
          {CHIPS.map(({ text, color }) => (
            <div
              key={text}
              className="flex items-center gap-2.5 text-sm rounded-full px-5 py-2.5 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: `${color}14`,
                border: `1px solid ${color}3d`,
                boxShadow: `0 2px 8px ${color}1a`,
              }}
            >
              <span
                className="rounded-full shrink-0"
                style={{
                  width: 9,
                  height: 9,
                  backgroundColor: color,
                  boxShadow: `inset -1.5px -1.5px 2px rgba(0,0,0,0.18)`,
                }}
              />
              <span className="text-foreground/80 font-medium tracking-wide italic text-xs sm:text-sm">
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .gradient-background {
          background: linear-gradient(300deg, #f6d9e6, #d8e9f2, #f4ead2, #e2eedd);
          background-size: 220% 220%;
          animation: gradient-animation 18s ease infinite;
        }
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (max-width: 768px) {
          .gradient-background {
            background: linear-gradient(300deg, #f6d9e6, #d8e9f2, #f4ead2);
            background-size: 100% 100%;
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default MissionSection;
