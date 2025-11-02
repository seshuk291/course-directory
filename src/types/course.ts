export interface Chapter {
  name: string;
  path: string;
  filename: string;
  originalPath?: string; // The actual file path on disk
  type: 'html' | 'video'; // File type to determine how to render
}

export interface Course {
  name: string;
  path: string;
  chapters: Chapter[];
  originalPath?: string; // The actual directory path on disk
  directoryId?: number; // Database ID for selected directory
}

export interface CourseStructure {
  courses: Course[];
}

export interface SelectedDirectory {
  id: number;
  original_path: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}