export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // URL to embed or MP4
  duration: string;
  thumbnail?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  heroImage?: string;
  tags: string[];
  modules: Module[];
}

export enum ViewState {
  HOME = 'HOME',
  PLAYER = 'PLAYER',
  ADMIN = 'ADMIN'
}

export interface PlayerState {
  courseId: string;
  moduleId: string;
  lessonId: string;
}