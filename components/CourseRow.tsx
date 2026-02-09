import React from 'react';
import { Module, Lesson } from '../types';
import { PlayCircle } from 'lucide-react';

interface CourseRowProps {
  title: string;
  items: Lesson[];
  moduleId: string;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
}

const CourseRow: React.FC<CourseRowProps> = ({ title, items, moduleId, onSelectLesson }) => {
  return (
    <div className="mb-8 px-8 md:px-16">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 hover:text-red-500 transition-colors cursor-pointer inline-block">
        {title}
      </h2>
      
      <div className="relative group">
        <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 hide-scroll scroll-smooth">
          {items.map((lesson, index) => (
            <div 
              key={lesson.id} 
              className="flex-none w-64 md:w-80 cursor-pointer relative transition-transform duration-300 hover:scale-105 hover:z-10"
              onClick={() => onSelectLesson(moduleId, lesson.id)}
            >
              <div className="relative aspect-video bg-zinc-800 rounded-md overflow-hidden">
                <img 
                  src={lesson.thumbnail || `https://picsum.photos/seed/${lesson.id}/400/225`} 
                  alt={lesson.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Progress Bar placeholder */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div className="h-full bg-red-600 w-1/3" /> 
                </div>

                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                    <PlayCircle size={48} className="text-white" />
                </div>
              </div>
              
              <div className="mt-2 p-1">
                <h3 className="text-sm font-bold text-white truncate">{index + 1}. {lesson.title}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{lesson.description}</p>
                <span className="text-xs text-zinc-500 mt-1 block">{lesson.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseRow;