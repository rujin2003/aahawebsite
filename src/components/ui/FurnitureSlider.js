// components/FurnitureSlider.js
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

const slides = [
  {
    title: "High-Quality Furniture Just For You 3",
    description:
      "Our furniture is made from selected and best quality materials that are suitable for your dream home",
    buttonText: "Shop Now",
    image: "https://picsum.photos/500", // Replace with your actual image path
    product: {
      name: "Bohauss",
      subtitle: "Luxury big sofa 2-seat",
      price: "Rp 17.000.000",
    },
  },
   {
    title: "High-Quality Furniture Just For Youn 2",
    description:
      "Our furniture is made from selected and best quality materials that are suitable for your dream home",
    buttonText: "Shop Now",
    image: "https://picsum.photos/500", // Replace with your actual image path
    product: {
      name: "Bohauss",
      subtitle: "Luxury big sofa 2-seat",
      price: "Rp 17.000.000",
    },
  },
   {
    title: "High-Quality Furniture Just For You 1",
    description:
      "Our furniture is made from selected and best quality materials that are suitable for your dream home",
    buttonText: "Shop Now",
    image: "https://picsum.photos/500", // Replace with your actual image path
    product: {
      name: "Bohauss",
      subtitle: "Luxury big sofa 2-seat",
      price: "Rp 17.000.000",
    },
  },
  // You can add more slides here
];

export default function FurnitureSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="relative w-full h-[550px] bg-[#fef1e6] overflow-hidden px-10">
      <div className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 80}%)` }}>
        {slides.map((slide, index) => (
          <motion.div
            key={index}
            className={`min-w-[80%] shrink-0 flex items-center justify-between mx-2 bg-white/80 rounded-xl shadow px-8 py-12 ${
              index === currentIndex ? "z-10 scale-100" : "scale-95 opacity-70"
            }`}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-[45%] h-full flex flex-col justify-center">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                {slide.title}
              </h1>
              <p className="text-gray-500 mt-4">
                {slide.description}
              </p>
              <button className="mt-6 px-6 py-3 bg-orange-400 text-white rounded shadow hover:bg-orange-500">
                {slide.buttonText}
              </button>
            </div>

            <div className="w-[50%] flex flex-col items-center justify-center relative">
              <img
                src={slide.image}
                alt="Furniture"
                className="w-full h-auto max-h-[400px] object-contain"
              />
              <div className="absolute bottom-6 right-6 bg-white/70 px-6 py-4 rounded-xl shadow">
                <h3 className="text-xl font-semibold">
                  {slide.product.name}
                </h3>
                <p className="text-gray-500">
                  {slide.product.subtitle}
                </p>
                <p className="font-bold text-gray-800 mt-2">
                  {slide.product.price}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20">
        <button
          onClick={prevSlide}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
        >
          <ArrowLeft />
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20">
        <button
          onClick={nextSlide}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
