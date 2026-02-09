import React, { useState, useEffect } from 'react';
import { Course, Module, Lesson } from '../types';
import { Loader2, Sparkles, X, FolderPlus, Video, Upload, Link as LinkIcon, FileVideo, Edit2, Trash2, Save, RotateCcw, PlusCircle, Image, Code } from 'lucide-react';
import { generateLessonDetails } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

interface AdminPanelProps {
  courses: Course[];
  onAddCourse: (course: Course) => Promise<void>;
  onAddLesson: (courseId: string, moduleId: string, lesson: Lesson) => Promise<void>;
  onAddModule: (courseId: string, module: Module) => Promise<void>;
  onEditModule: (courseId: string, moduleId: string, updatedModule: Partial<Module>) => Promise<void>;
  onDeleteModule: (courseId: string, moduleId: string) => Promise<void>;
  onEditLesson: (courseId: string, moduleId: string, lessonId: string, updatedLesson: Partial<Lesson>) => Promise<void>;
  onDeleteLesson: (courseId: string, moduleId: string, lessonId: string) => Promise<void>;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  courses, 
  onAddCourse,
  onAddLesson, 
  onAddModule, 
  onEditModule, 
  onDeleteModule, 
  onEditLesson, 
  onDeleteLesson, 
  onClose 
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  
  // States for Course
  const [isCreatingCourse, setIsCreatingCourse] = useState(courses.length === 0);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseThumb, setNewCourseThumb] = useState('');

  // States for Module
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  
  // States for Lesson
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonThumb, setNewLessonThumb] = useState(''); // State for Lesson Thumbnail
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  
  // Video Source State
  const [videoSourceType, setVideoSourceType] = useState<'url' | 'file' | 'embed'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  
  // Thumbnail File State
  const [selectedThumbFile, setSelectedThumbFile] = useState<File | null>(null);
  const [thumbFileName, setThumbFileName] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If we have courses and no selection, select the first one
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
    // If no courses, force create mode
    if (courses.length === 0) {
      setIsCreatingCourse(true);
    }
  }, [courses, selectedCourseId]);

  const activeCourse = courses.find(c => c.id === selectedCourseId);
  const activeModule = activeCourse?.modules.find(m => m.id === selectedModuleId);

  // --- COURSE HANDLERS ---
  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newCourse: Course = {
        id: crypto.randomUUID(),
        title: newCourseTitle,
        description: newCourseDesc,
        thumbnail: newCourseThumb,
        tags: [],
        modules: []
      };
      
      await onAddCourse(newCourse);
      
      setNewCourseTitle('');
      setNewCourseDesc('');
      setNewCourseThumb('');
      setIsCreatingCourse(false);
    } catch (error: any) {
      console.error("Error saving course:", error);
      alert(`Erro ao criar curso: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MODULE HANDLERS ---

  const handleEditModuleClick = (module: Module) => {
    setEditingModuleId(module.id);
    setNewModuleTitle(module.title);
  };

  const handleCancelModuleEdit = () => {
    setEditingModuleId(null);
    setNewModuleTitle('');
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
        alert("Selecione um curso primeiro.");
        return;
    }

    setIsSubmitting(true);
    try {
      if (editingModuleId) {
        await onEditModule(selectedCourseId, editingModuleId, { title: newModuleTitle });
        handleCancelModuleEdit();
      } else {
        const newModule: Module = {
          id: crypto.randomUUID(),
          title: newModuleTitle,
          lessons: []
        };
        await onAddModule(selectedCourseId, newModule);
        setNewModuleTitle('');
      }
    } catch (error: any) {
      console.error("Error saving module:", error);
      alert(`Erro ao salvar módulo: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LESSON HANDLERS ---

  const handleEditLessonClick = (lesson: Lesson) => {
    const url = lesson.videoUrl || '';
    setEditingLessonId(lesson.id);
    setNewLessonTitle(lesson.title);
    setNewLessonDesc(lesson.description);
    setNewLessonDuration(lesson.duration);
    setNewLessonUrl(url);
    setNewLessonThumb(lesson.thumbnail || '');
    
    // Determine source type based on URL content
    if (url.trim().startsWith('<')) {
       setVideoSourceType('embed');
       setFileName('');
    } else if ((url.includes('supabase.co') && !url.includes('youtube')) || (url && !url.includes('http'))) {
       // Assuming internal file if supabase or no protocol (local path?)
       setVideoSourceType('file');
       setFileName('Vídeo Salvo no Banco (Re-upload para alterar)');
    } else {
       setVideoSourceType('url');
       setFileName('');
    }
  };

  const handleCancelLessonEdit = () => {
    setEditingLessonId(null);
    setNewLessonTitle('');
    setNewLessonDesc('');
    setNewLessonDuration('');
    setNewLessonUrl('');
    setNewLessonThumb('');
    setFileName('');
    setThumbFileName('');
    setSelectedFile(null);
    setSelectedThumbFile(null);
    setVideoSourceType('url');
  };

  const handleGenerateMetadata = async () => {
    if (!newLessonTitle || !activeCourse) return;
    
    setIsGenerating(true);
    const details = await generateLessonDetails(newLessonTitle, activeCourse.title + " - " + activeCourse.description);
    setNewLessonDesc(details.description);
    setNewLessonDuration(details.durationEstimate);
    setIsGenerating(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      if (!newLessonDuration) setNewLessonDuration("00:00");
    }
  };

  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedThumbFile(file);
      setThumbFileName(file.name);
    }
  };

  const uploadVideoToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${selectedCourseId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    // Putting thumbs in a 'thumbnails' folder inside the videos bucket for simplicity, or root
    const filePath = `thumbnails/${selectedCourseId}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('videos') // Using same bucket as videos for now
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedModuleId) return;

    setIsSubmitting(true);
    try {
      let finalVideoUrl = newLessonUrl;
      let finalThumbUrl = newLessonThumb;

      // Handle Video Upload
      if (videoSourceType === 'file' && selectedFile) {
        finalVideoUrl = await uploadVideoToSupabase(selectedFile);
      }

      // Handle Thumbnail Upload
      if (selectedThumbFile) {
        finalThumbUrl = await uploadImageToSupabase(selectedThumbFile);
      }

      const lessonData = {
        title: newLessonTitle,
        description: newLessonDesc,
        videoUrl: finalVideoUrl,
        duration: newLessonDuration,
        thumbnail: finalThumbUrl
      };

      if (editingLessonId) {
        await onEditLesson(selectedCourseId, selectedModuleId, editingLessonId, lessonData);
        handleCancelLessonEdit();
      } else {
        const newLesson: Lesson = {
          id: crypto.randomUUID(),
          ...lessonData
        };
        await onAddLesson(selectedCourseId, selectedModuleId, newLesson);
        
        // Reset form but keep module selected
        setNewLessonTitle('');
        setNewLessonUrl('');
        setNewLessonDesc('');
        setNewLessonDuration('');
        setNewLessonThumb('');
        setFileName('');
        setThumbFileName('');
        setSelectedFile(null);
        setSelectedThumbFile(null);
        setVideoSourceType('url');
      }
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      alert(`Erro ao salvar aula: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModuleWrapper = async (courseId: string, moduleId: string) => {
      setIsSubmitting(true);
      await onDeleteModule(courseId, moduleId);
      setIsSubmitting(false);
  }

  const handleDeleteLessonWrapper = async (courseId: string, moduleId: string, lessonId: string) => {
      setIsSubmitting(true);
      await onDeleteLesson(courseId, moduleId, lessonId);
      setIsSubmitting(false);
  }


  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-red-600">Gestão de Conteúdo (Supabase)</h1>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Course Section */}
        <div className="bg-zinc-900 p-6 rounded-lg mb-8 border border-zinc-800">
           {!isCreatingCourse ? (
             <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400 text-sm font-bold">Selecione o Curso</label>
                    <button 
                      onClick={() => setIsCreatingCourse(true)}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 font-bold"
                    >
                      <PlusCircle size={14} /> NOVO CURSO
                    </button>
                  </div>
                  <select 
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedModuleId('');
                      handleCancelModuleEdit();
                      handleCancelLessonEdit();
                    }}
                    className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                  >
                    {courses.length === 0 && <option value="">Nenhum curso disponível</option>}
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
             </div>
           ) : (
             <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                   <h2 className="text-lg font-bold text-white flex items-center gap-2">
                     <PlusCircle size={20} className="text-red-600"/> 
                     Criar Novo Curso
                   </h2>
                   {courses.length > 0 && (
                     <button onClick={() => setIsCreatingCourse(false)} className="text-gray-400 hover:text-white text-sm">
                       Cancelar
                     </button>
                   )}
                </div>
                <form onSubmit={handleSubmitCourse} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Título do Curso</label>
                      <input 
                        type="text" 
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                        placeholder="Ex: Masterclass de React"
                        required
                      />
                    </div>
                    <div>
                       <label className="block text-gray-400 text-xs uppercase mb-1">URL da Imagem de Capa</label>
                       <div className="flex gap-2">
                          <input 
                            type="url" 
                            value={newCourseThumb}
                            onChange={(e) => setNewCourseThumb(e.target.value)}
                            className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                            placeholder="https://..."
                            required
                          />
                          {newCourseThumb && (
                            <img src={newCourseThumb} alt="Preview" className="w-12 h-12 rounded object-cover border border-zinc-700" />
                          )}
                       </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs uppercase mb-1">Descrição</label>
                    <textarea 
                      value={newCourseDesc}
                      onChange={(e) => setNewCourseDesc(e.target.value)}
                      className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none h-20"
                      placeholder="Sobre o que é este curso?"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-white text-black font-bold py-2 px-6 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin inline mr-2" size={16}/> : null}
                    Criar Curso
                  </button>
                </form>
             </div>
           )}
        </div>

        {/* Modules and Lessons Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${isCreatingCourse || !selectedCourseId ? 'opacity-50 pointer-events-none filter blur-sm' : ''}`}>
          
          {/* --- LEFT COLUMN: MODULES --- */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 h-fit">
            <div className="flex items-center mb-4 text-red-500">
              <FolderPlus size={24} className="mr-2" />
              <h2 className="text-xl font-bold text-white">
                {editingModuleId ? 'Editar Módulo' : 'Gerenciar Módulos'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmitModule} className="space-y-4 mb-8 border-b border-zinc-800 pb-8">
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Nome do Módulo</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                    placeholder="Ex: Módulo 1: Introdução"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingModuleId ? <Save size={18}/> : <FolderPlus size={18}/>)}
                  {editingModuleId ? 'Salvar Alteração' : 'Criar Módulo'}
                </button>
                {editingModuleId && (
                  <button 
                    type="button" 
                    onClick={handleCancelModuleEdit}
                    className="px-4 bg-zinc-700 text-white rounded hover:bg-zinc-600 transition-colors"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
            </form>

            {/* List Existing Modules */}
            {activeCourse && (
              <div>
                <h3 className="text-gray-500 text-sm mb-3 uppercase font-bold tracking-wider">Módulos Existentes</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {activeCourse.modules.length === 0 && <p className="text-gray-500 text-sm italic">Nenhum módulo criado.</p>}
                  {activeCourse.modules.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => {
                        setSelectedModuleId(m.id);
                        handleCancelLessonEdit();
                      }}
                      className={`p-3 rounded text-sm flex justify-between items-center group transition-colors cursor-pointer border-l-4 ${
                        selectedModuleId === m.id 
                          ? 'bg-zinc-800 border-red-600' 
                          : 'bg-zinc-800 hover:bg-zinc-750 border-transparent'
                      } ${editingModuleId === m.id ? 'ring-1 ring-white' : ''}`}
                    >
                      <div className="flex-1 mr-2">
                         <span className={`font-medium block ${selectedModuleId === m.id ? 'text-white' : 'text-gray-300'}`}>{m.title}</span>
                         <span className="text-gray-500 text-xs">{m.lessons.length} aulas</span>
                      </div>
                      <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditModuleClick(m); }}
                          className="p-2 hover:bg-blue-900/50 text-blue-400 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteModuleWrapper(selectedCourseId, m.id); }}
                          className="p-2 hover:bg-red-900/50 text-red-500 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN: LESSONS --- */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div className="flex items-center mb-4 text-red-500">
              <Video size={24} className="mr-2" />
              <h2 className="text-xl font-bold text-white">
                {editingLessonId ? 'Editar Aula' : 'Adicionar Aula'}
              </h2>
            </div>

            <form onSubmit={handleSubmitLesson} className="space-y-4">
               <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Módulo Selecionado</label>
                <select 
                  value={selectedModuleId}
                  onChange={(e) => {
                    setSelectedModuleId(e.target.value);
                    handleCancelLessonEdit();
                  }}
                  className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                  required
                >
                  <option value="">Selecione um módulo...</option>
                  {activeCourse?.modules.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Título da Aula</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="flex-1 bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                    placeholder="Ex: Aula 1: Configuração"
                    required
                  />
                  <button 
                    type="button"
                    onClick={handleGenerateMetadata}
                    disabled={isGenerating || !newLessonTitle}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                    title="Gerar com IA"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-2">Fonte do Vídeo</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('url')}
                    className={`flex-1 py-2 px-2 md:px-4 rounded text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      videoSourceType === 'url' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                    }`}
                  >
                    <LinkIcon size={16} />
                    Link YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('embed')}
                    className={`flex-1 py-2 px-2 md:px-4 rounded text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      videoSourceType === 'embed' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                    }`}
                  >
                    <Code size={16} />
                    Código Embed
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('file')}
                    className={`flex-1 py-2 px-2 md:px-4 rounded text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      videoSourceType === 'file' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                    }`}
                  >
                    <Upload size={16} />
                    Upload Arquivo
                  </button>
                </div>

                {videoSourceType === 'url' && (
                  <input 
                    type="url" 
                    value={newLessonUrl}
                    onChange={(e) => setNewLessonUrl(e.target.value)}
                    className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                    placeholder="https://youtube.com/..."
                    required={videoSourceType === 'url'}
                  />
                )}
                
                {videoSourceType === 'embed' && (
                   <textarea
                    value={newLessonUrl}
                    onChange={(e) => setNewLessonUrl(e.target.value)}
                    className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none h-32 font-mono text-xs"
                    placeholder={'<iframe src="..." width="100%" height="100%"></iframe>'}
                    required={videoSourceType === 'embed'}
                  />
                )}

                {videoSourceType === 'file' && (
                  <div className="bg-zinc-800 border border-zinc-700 rounded p-4 text-center border-dashed hover:border-red-600 transition-colors relative group">
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required={videoSourceType === 'file' && !newLessonUrl}
                    />
                    <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                      {fileName ? (
                        <>
                          <FileVideo size={32} className="text-red-600 mb-2" />
                          <span className="text-white font-medium text-sm break-all">{fileName}</span>
                          <span className="text-xs mt-1 text-gray-500">
                             {selectedFile ? 'Pronto para enviar' : 'Clique para alterar'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload size={32} className="mb-2" />
                          <span className="text-sm font-medium">Clique ou arraste o vídeo</span>
                          <span className="text-xs mt-1 text-gray-500">MP4, WebM, Ogg</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* NEW THUMBNAIL SECTION */}
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Imagem de Capa (Thumbnail)</label>
                <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={newLessonThumb}
                      onChange={(e) => setNewLessonThumb(e.target.value)}
                      className="flex-1 bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                      placeholder="https://... (URL da imagem)"
                    />
                    <div className="relative w-12 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center hover:bg-zinc-700 hover:border-red-600 cursor-pointer transition-colors" title="Upload Imagem">
                       <input 
                         type="file"
                         accept="image/*"
                         onChange={handleThumbFileChange}
                         className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                       {selectedThumbFile || newLessonThumb ? (
                          <div className="w-full h-full overflow-hidden rounded flex items-center justify-center">
                             {selectedThumbFile ? <Upload size={16} className="text-white"/> : <img src={newLessonThumb} className="w-full h-full object-cover" alt="thumb"/>}
                          </div>
                       ) : (
                          <Image size={20} className="text-gray-400" />
                       )}
                    </div>
                </div>
                {thumbFileName && <p className="text-xs text-green-500 mt-1">Arquivo selecionado: {thumbFileName}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-2">
                    <label className="block text-gray-400 text-xs uppercase mb-1">Descrição</label>
                    <textarea 
                      value={newLessonDesc}
                      onChange={(e) => setNewLessonDesc(e.target.value)}
                      className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none h-24 text-sm"
                      placeholder="Descrição da aula..."
                    />
                 </div>
                 <div>
                    <label className="block text-gray-400 text-xs uppercase mb-1">Duração</label>
                    <input 
                      type="text" 
                      value={newLessonDuration}
                      onChange={(e) => setNewLessonDuration(e.target.value)}
                      className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-red-600 focus:outline-none"
                      placeholder="00:00"
                    />
                 </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={!selectedModuleId || (!newLessonUrl && !selectedFile) || isSubmitting}
                  className="flex-1 bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingLessonId ? <Save size={18}/> : <Video size={18}/>)}
                  {editingLessonId ? 'Atualizar Aula' : 'Salvar Aula'}
                </button>
                {editingLessonId && (
                  <button 
                    type="button" 
                    onClick={handleCancelLessonEdit}
                    className="px-4 bg-zinc-700 text-white rounded hover:bg-zinc-600 transition-colors"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
            </form>

            {/* List Lessons in Selected Module */}
            {activeModule && (
              <div className="mt-8 border-t border-zinc-800 pt-6">
                 <h3 className="text-gray-500 text-sm mb-3 uppercase font-bold tracking-wider">
                   Aulas em: <span className="text-white">{activeModule.title}</span>
                 </h3>
                 <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                   {activeModule.lessons.length === 0 && <p className="text-gray-500 text-sm italic">Nenhuma aula neste módulo.</p>}
                   {activeModule.lessons.map(lesson => (
                     <div key={lesson.id} className={`p-3 rounded text-sm flex justify-between items-center group transition-colors ${editingLessonId === lesson.id ? 'bg-zinc-700 ring-1 ring-white' : 'bg-zinc-800 hover:bg-zinc-750'}`}>
                        <div className="flex gap-2 items-center flex-1 mr-2 overflow-hidden">
                           <div className="w-10 h-6 bg-zinc-900 rounded overflow-hidden flex-shrink-0">
                             {lesson.thumbnail ? (
                               <img src={lesson.thumbnail} alt="" className="w-full h-full object-cover"/>
                             ) : (
                               <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xs text-gray-500">IMG</div>
                             )}
                           </div>
                           <div className="overflow-hidden">
                             <span className="font-medium block truncate">{lesson.title}</span>
                             <span className="text-gray-500 text-xs block">{lesson.duration}</span>
                           </div>
                        </div>
                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditLessonClick(lesson)}
                            className="p-2 hover:bg-blue-900/50 text-blue-400 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteLessonWrapper(selectedCourseId, activeModule.id, lesson.id)}
                            className="p-2 hover:bg-red-900/50 text-red-500 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;