import React from 'react';
import { Course } from '../types';

interface HeroProps {
  course: Course;
}

const Hero: React.FC<HeroProps> = ({ course }) => {
  return (
    <div className="relative h-[80vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={course.heroImage || course.thumbnail} 
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-16 max-w-4xl">
        <div className="mb-4">
           {/* Series Logo or Title Style */}
           <h1 className="text-6xl font-black text-white drop-shadow-lg leading-tight mb-4">
             {course.title.toUpperCase()}
           </h1>
        </div>
        
        <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-md line-clamp-3 max-w-2xl">
          {course.description}
        </p>
      </div>
    </div>
  );
};

export default Hero;