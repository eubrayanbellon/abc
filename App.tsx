import React, { useState, useEffect } from 'react';
import { Course, ViewState, PlayerState, Module, Lesson } from './types';
import VideoPlayer from './components/VideoPlayer';
import AdminPanel from './components/AdminPanel';
import Hero from './components/Hero';
import CourseRow from './components/CourseRow';
import { Loader2 } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);

  // --- DATA FETCHING ---

  const fetchCourses = async () => {
    try {
      // Fetch courses with nested modules and lessons
      // Note: Supabase returns flat JSON structure, we need to ensure relationships are set up
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            *,
            lessons (*)
          )
        `);

      if (coursesError) throw coursesError;

      if (coursesData) {
        // Sort modules and lessons by creation time or any other logic if needed
        const formattedCourses: Course[] = coursesData.map((c: any) => ({
           id: c.id,
           title: c.title,
           description: c.description,
           thumbnail: c.thumbnail,
           heroImage: c.hero_image,
           tags: c.tags || [],
           modules: (c.modules || [])
             .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
             .map((m: any) => ({
               id: m.id,
               title: m.title,
               lessons: (m.lessons || [])
                 .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                 .map((l: any) => ({
                   id: l.id,
                   title: l.title,
                   description: l.description,
                   videoUrl: l.video_url,
                   duration: l.duration,
                   thumbnail: l.thumbnail
                 }))
             }))
        }));

        setCourses(formattedCourses);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // --- ACTIONS ---

  const handlePlayCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course && course.modules.length > 0 && course.modules[0].lessons.length > 0) {
      setPlayerState({
        courseId,
        moduleId: course.modules[0].id,
        lessonId: course.modules[0].lessons[0].id
      });
      setView(ViewState.PLAYER);
    }
  };

  const handleNavigateLesson = (moduleId: string, lessonId: string) => {
    if (playerState) {
      setPlayerState({ ...playerState, moduleId, lessonId });
    }
  };

  const handleAddCourse = async (course: Course) => {
    const { error } = await supabase.from('courses').insert({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      hero_image: course.thumbnail, // Using thumbnail as hero for now if not provided
      tags: course.tags
    });

    if (!error) await fetchCourses();
  };

  const handleAddLesson = async (courseId: string, moduleId: string, lesson: Lesson) => {
    const { error } = await supabase.from('lessons').insert({
      id: lesson.id,
      module_id: moduleId,
      title: lesson.title,
      description: lesson.description,
      video_url: lesson.videoUrl,
      duration: lesson.duration,
      thumbnail: lesson.thumbnail
    });

    if (!error) await fetchCourses();
  };

  const handleAddModule = async (courseId: string, module: Module) => {
    const { error } = await supabase.from('modules').insert({
      id: module.id,
      course_id: courseId,
      title: module.title
    });

    if (!error) await fetchCourses();
  };

  const handleEditModule = async (courseId: string, moduleId: string, updatedModule: Partial<Module>) => {
    const { error } = await supabase
      .from('modules')
      .update({ title: updatedModule.title })
      .eq('id', moduleId);
      
    if (!error) await fetchCourses();
  };

  const handleDeleteModule = async (courseId: string, moduleId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este módulo e todas as suas aulas?")) return;
    const { error } = await supabase.from('modules').delete().eq('id', moduleId);
    if (!error) await fetchCourses();
  };

  const handleEditLesson = async (courseId: string, moduleId: string, lessonId: string, updatedLesson: Partial<Lesson>) => {
    const { error } = await supabase
      .from('lessons')
      .update({
        title: updatedLesson.title,
        description: updatedLesson.description,
        video_url: updatedLesson.videoUrl,
        duration: updatedLesson.duration,
        thumbnail: updatedLesson.thumbnail
      })
      .eq('id', lessonId);

    if (!error) await fetchCourses();
  };

  const handleDeleteLesson = async (courseId: string, moduleId: string, lessonId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta aula?")) return;
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (!error) await fetchCourses();
  };

  // --- RENDER HELPERS ---

  const renderNavbar = () => (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${window.scrollY > 20 ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="px-4 md:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-red-600 text-3xl font-black tracking-tighter cursor-pointer" onClick={() => setView(ViewState.HOME)}>
            METEFLIX
          </h1>
        </div>
        
        {/* Buttons removed as requested */}
      </div>
    </nav>
  );

  // --- MAIN RENDER ---

  if (loading) {
    return (
      <div className="h-screen bg-[#141414] text-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <p>Carregando conteúdo...</p>
      </div>
    );
  }

  if (view === ViewState.PLAYER && playerState) {
    const activeCourse = courses.find(c => c.id === playerState.courseId);
    if (!activeCourse) return null;
    return (
      <VideoPlayer 
        course={activeCourse} 
        initialModuleId={playerState.moduleId}
        initialLessonId={playerState.lessonId}
        onBack={() => setView(ViewState.HOME)}
        onNavigate={handleNavigateLesson}
      />
    );
  }

  if (view === ViewState.ADMIN) {
    return (
      <AdminPanel 
        courses={courses}
        onAddCourse={handleAddCourse}
        onAddLesson={handleAddLesson}
        onAddModule={handleAddModule}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
        onEditLesson={handleEditLesson}
        onDeleteLesson={handleDeleteLesson}
        onClose={() => setView(ViewState.HOME)}
      />
    );
  }

  // HOME VIEW
  // If no courses from DB, show empty state or specific fallback
  const featuredCourse = courses[0];

  return (
    <div className="min-h-screen text-white relative">
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://messages-prod.27c852f3500f38c1e7786e2c9ff9e48f.r2.cloudflarestorage.com/5bd0fea1-f6fe-4026-b483-3a8976ed89e8/1770431112536-019c35ea-88cb-748e-8548-7fe8c8db6eb8.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=af634fe044bd071ab4c5d356fdace60f%2F20260207%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260207T022513Z&X-Amz-Expires=3600&X-Amz-Signature=6fa064380c3518db9146438c84bac2ab6e4ae232845c51837f23cf38f052f73f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject"
          alt="Background" 
          className="w-full h-full object-cover"
        />
        {/* Overlay to dim the background for text readability */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px]" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        {renderNavbar()}
        
        {featuredCourse ? (
          <>
            <Hero 
              course={featuredCourse} 
            />

            <div className="pb-20 -mt-20 relative z-20">
              {featuredCourse.modules.map(module => (
                 <CourseRow 
                   key={module.id}
                   moduleId={module.id}
                   title={module.title}
                   items={module.lessons}
                   onSelectLesson={(modId, lessonId) => {
                     setPlayerState({ courseId: featuredCourse.id, moduleId: modId, lessonId });
                     setView(ViewState.PLAYER);
                   }}
                 />
              ))}
            </div>
          </>
        ) : (
           <div className="h-screen flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-2xl font-bold mb-4">Bem-vindo ao METEFLIX</h2>
              <p className="text-gray-400 mb-8">Nenhum curso encontrado no banco de dados.</p>
              <button 
                onClick={() => setView(ViewState.ADMIN)}
                className="bg-red-600 px-6 py-3 rounded font-bold hover:bg-red-700"
              >
                Criar Primeiro Curso no Admin
              </button>
           </div>
        )}
        
        <footer className="px-16 py-8 text-gray-500 text-sm mt-8 border-t border-zinc-900 text-center bg-black/40">
          <p className="mb-2">&copy; 2024 METEFLIX Education Inc.</p>
          <p>Desenvolvido com React + Tailwind + Gemini AI + Supabase</p>
        </footer>
      </div>
    </div>
  );
};

export default App;