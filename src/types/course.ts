export interface Chapter {
  name: string;
  path: string;
  filename: string;
  originalPath?: string; // The actual file path on disk
  type: 'html' | 'video'; // File type to determine how to render
  folderId?: number; // Reference to folder hierarchy
}

export interface CourseFolder {
  id: number;
  name: string;
  displayName?: string;
  path: string;
  level: number;
  parentId?: number;
  children: CourseFolder[];
  chapters: Chapter[];
  sortOrder: number;
}

export interface Course {
  name: string;
  path: string;
  chapters: Chapter[];
  folders: CourseFolder[];
  originalPath?: string; // The actual directory path on disk
  directoryId?: number; // Database ID for selected directory
  categoryId?: number; // Category ID
  category?: CourseCategory;
}

export interface CourseCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CourseStructure {
  courses: Course[];
  categories: CourseCategory[];
}

export interface SelectedDirectory {
  id: number;
  original_path: string;
  display_name: string;
  category_id?: number;
  created_at: string;
  updated_at: string;
  category?: CourseCategory;
}