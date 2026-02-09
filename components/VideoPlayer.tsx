import React, { useState, useEffect } from 'react';
import { Course, Module, Lesson } from '../types';
import { ChevronLeft, PlayCircle, Menu, X, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  course: Course;
  initialModuleId: string;
  initialLessonId: string;
  onBack: () => void;
  onNavigate: (moduleId: string, lessonId: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  course, 
  initialModuleId, 
  initialLessonId, 
  onBack,
  onNavigate 
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [currentModuleId, setCurrentModuleId] = useState(initialModuleId);
  const [currentLessonId, setCurrentLessonId] = useState(initialLessonId);

  useEffect(() => {
    setCurrentModuleId(initialModuleId);
    setCurrentLessonId(initialLessonId);
  }, [initialModuleId, initialLessonId]);

  const currentModule = course.modules.find(m => m.id === currentModuleId);
  const currentLesson = currentModule?.lessons.find(l => l.id === currentLessonId);

  if (!currentLesson || !currentModule) return <div className="text-white flex items-center justify-center h-screen">Aula não encontrada</div>;

  // --- VIDEO PARSING LOGIC ---

  const isEmbedCode = (url: string) => url.trim().startsWith('<');
  
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    // Regex robusto para pegar ID de qualquer formato de link do YouTube (curto, longo, shorts, embed)
    const pattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  };

  const renderVideoContent = () => {
    const url = currentLesson.videoUrl;

    // 1. Caso seja código Embed HTML (Iframe colado direto)
    if (isEmbedCode(url)) {
      return (
        <div 
          className="w-full h-full flex items-center justify-center [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 bg-black"
          dangerouslySetInnerHTML={{ __html: url }} 
        />
      );
    }

    // 2. Caso seja YouTube (Extrai ID e monta iframe limpo)
    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
      return (
        <iframe
          key={youtubeId} // Força recriar o iframe se o vídeo mudar
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}`}
          title={currentLesson.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full object-contain"
        />
      );
    }

    // 3. Caso seja arquivo direto (MP4) ou outro formato nativo
    return (
       <video 
          key={url} // Força reload
          controls 
          autoPlay 
          className="w-full h-full object-contain"
          src={url}
       >
          <div className="flex flex-col items-center justify-center h-full text-white">
            <AlertCircle size={48} className="mb-4 text-red-600" />
            <p className="text-lg font-bold">Não foi possível carregar o vídeo.</p>
            <p className="text-gray-500 text-sm mt-2">Formato não reconhecido: {url}</p>
          </div>
       </video>
    );
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'mr-80' : 'mr-0'}`}>
        
        {/* Top Bar Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <button 
            onClick={onBack}
            className="flex items-center text-white hover:text-red-600 transition-colors pointer-events-auto"
          >
            <ChevronLeft size={24} />
            <span className="ml-2 font-bold text-lg">Voltar para Navegação</span>
          </button>
          
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-white hover:text-gray-300 p-2 rounded-full bg-black/50 backdrop-blur-sm pointer-events-auto"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Video Container */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          {renderVideoContent()}
        </div>

        {/* Lesson Info (Bottom) */}
        <div className="p-6 bg-zinc-900 border-t border-zinc-800 z-10">
          <h1 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h1>
          <p className="text-gray-400 max-w-4xl">{currentLesson.description}</p>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div 
        className={`fixed right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 transform transition-transform duration-300 z-30 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-5 border-b border-zinc-800 bg-zinc-900 z-10">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Módulos</h2>
          <p className="text-xs text-gray-500">{course.title}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {course.modules.map((module) => (
            <div key={module.id} className="mb-6">
              <h3 className="text-gray-400 text-xs font-bold uppercase mb-3 px-2 tracking-widest">
                {module.title}
              </h3>
              <div className="space-y-1">
                {module.lessons.map((lesson) => {
                  const isActive = lesson.id === currentLessonId;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onNavigate(module.id, lesson.id)}
                      className={`w-full text-left p-3 rounded-md flex items-start group transition-all ${
                        isActive 
                          ? 'bg-zinc-800 border-l-4 border-red-600' 
                          : 'hover:bg-zinc-800 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="mr-3 mt-1 text-gray-500 group-hover:text-white">
                        {isActive ? <PlayCircle size={16} className="text-red-600" /> : <PlayCircle size={16} />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{lesson.duration}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;