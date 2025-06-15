import React, { useState, useEffect } from 'react';

const FeltCarousel = () => {
  // Initial images array
  const initialImages = [
    { src: "/hello.jpg", alt: "Handcrafted Felt Product" },
    { src: "/homedecor.jpg", alt: "Felt Wall Hanging" },
    { src: "/product2.jpg", alt: "Felt Accessories" }
  ];

  const [images, setImages] = useState(initialImages);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      // After animation starts, rotate the images
      setTimeout(() => {
        setImages(prevImages => {
          const newImages = [...prevImages];
          const mainImage = newImages.shift(); // Remove first (main) image
          newImages.push(mainImage); // Add it to the end
          return newImages;
        });
        setIsAnimating(false);
      }, 800); // Animation duration
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mt-8 py-20 bg-[rgb(240,236,226)] rounded-3xl mx-4 sm:mx-8 lg:mx-12 mb-16 overflow-hidden">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Large Product Image */}
          <div className="relative w-full h-[340px] md:h-[480px] rounded-2xl overflow-hidden shadow-lg">
            <div 
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isAnimating ? 'transform scale-95 opacity-0 rotate-3' : 'transform scale-100 opacity-100 rotate-0'
              }`}
            >
              <img
                src={images[0]?.src}
                alt={images[0]?.alt}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            
            {/* Overlay during animation */}
            <div 
              className={`absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 transition-opacity duration-300 ${
                isAnimating ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Loading animation dots */}
            <div 
              className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 transition-opacity duration-300 ${
                isAnimating ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-medium mb-6 tracking-tight text-[#8B7355]">
              Create Your Felt Piece Online
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-xl text-black">
              If you have your heart set on a certain color or style, our artisans can help you customize your own unique, bespoke felt creations. The magic at your very fingertips.
            </p>
            
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
              {/* Sub Images */}
              {images.slice(1).map((image, index) => (
                <div 
                  key={`${image.src}-${index}`}
                  className={`relative h-[160px] bg-[rgb(240,236,226)] rounded-xl p-4 flex flex-col items-center shadow-sm border border-black transition-all duration-700 ease-in-out ${
                    isAnimating && index === 0 
                      ? 'transform scale-110 rotate-1 shadow-xl border-2 border-purple-400' 
                      : 'transform scale-100 rotate-0 hover:scale-105'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className={`w-full h-full object-cover rounded-lg transition-all duration-500 ${
                        isAnimating && index === 0 ? 'brightness-110 contrast-105' : ''
                      }`}
                    />
                    
                    {/* Promotion indicator */}
                    {isAnimating && index === 0 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Progress indicator */}
            <div className="mt-8 flex space-x-2">
              {images.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === 0 
                      ? 'w-8 bg-[#8B7355]' 
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeltCarousel;