import fs from 'fs';
import path from 'path';
import { Course, Chapter, CourseFolder, CourseStructure, CourseCategory } from '@/types/course';
import { DirectoryManager, getDirectoryFolders, initDatabase } from './database';

const directoryManager = new DirectoryManager();

// Initialize the database connection
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await directoryManager.init();
    dbInitialized = true;
  }
}

function naturalSort(a: string, b: string): number {
  // Extract the filename without path
  const aFilename = path.basename(a);
  const bFilename = path.basename(b);
  
  // Extract number from the beginning of the filename
  const aMatch = aFilename.match(/^(\d+)/);
  const bMatch = bFilename.match(/^(\d+)/);
  
  // If both have numbers at the beginning, compare numerically
  if (aMatch && bMatch) {
    const aNum = parseInt(aMatch[1], 10);
    const bNum = parseInt(bMatch[1], 10);
    
    if (aNum !== bNum) {
      return aNum - bNum;
    }
    // If numbers are the same, compare the rest of the string
    return aFilename.localeCompare(bFilename);
  }
  
  // If only one has a number at the beginning, number comes first
  if (aMatch && !bMatch) return -1;
  if (!aMatch && bMatch) return 1;
  
  // If neither has a number at the beginning, compare alphabetically
  return aFilename.localeCompare(bFilename);
}

function isVideoFile(filename: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.m4v', '.3gp', '.ogv'];
  const ext = path.extname(filename).toLowerCase();
  return videoExtensions.includes(ext);
}

function getFileType(filename: string): 'html' | 'video' {
  if (filename.endsWith('.html')) {
    return 'html';
  } else if (isVideoFile(filename)) {
    return 'video';
  }
  return 'html'; // Default fallback
}

export async function getCourseStructure(): Promise<CourseStructure> {
  await ensureDbInitialized();
  
  const courses: Course[] = [];
  const categories: CourseCategory[] = [];
  
  // Get categories
  try {
    const dbCategories = await directoryManager.getCategories();
    categories.push(...dbCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
  
  // Get courses from the original courses directory (for backward compatibility)
  const coursesDir = path.join(process.cwd(), 'courses');
  if (fs.existsSync(coursesDir)) {
    const courseItems = fs.readdirSync(coursesDir, { withFileTypes: true });
    
    for (const courseItem of courseItems) {
      if (courseItem.isDirectory()) {
        const coursePath = path.join(coursesDir, courseItem.name);
        const { chapters, folders } = getChaptersAndFoldersFromDirectory(coursePath);
        
        courses.push({
          name: courseItem.name,
          path: coursePath,
          chapters,
          folders,
          originalPath: coursePath
        });
      }
    }
  }
  
  // Get courses from selected directories with categories
  try {
    const selectedDirectories = await directoryManager.getDirectoriesWithCategories();
    
    for (const selectedDir of selectedDirectories) {
      if (fs.existsSync(selectedDir.original_path)) {
        // For selected directories, get folder structure from database instead of file system
        const dbFolders = await getDirectoryFolders(selectedDir.id);
        
        // Get chapters from database
        const db = await initDatabase();
        const dbChapters = await new Promise<any[]>((resolve, reject) => {
          db.all(
            'SELECT * FROM chapters WHERE directory_id = ? ORDER BY sort_order, name',
            [selectedDir.id],
            (err: any, rows: any) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });
        db.close();
        
        // If no chapters in database, scan directory and populate
        let chapters = dbChapters;
        if (chapters.length === 0) {
          const { chapters: scannedChapters } = getChaptersAndFoldersFromDirectory(selectedDir.original_path, selectedDir.id);
          chapters = scannedChapters;
        }
        
        // Transform database folders to match frontend interface and build hierarchy
        const folderMap = new Map<number, CourseFolder>();
        dbFolders.forEach((f: any) => {
          folderMap.set(f.id, {
            id: f.id,
            name: f.name || f.folder_name,
            displayName: f.displayName || f.display_name,
            path: f.path || f.folder_path,
            level: f.level || 0,
            parentId: f.parentId || f.parent_id,
            children: [],
            chapters: [],
            sortOrder: f.sortOrder || f.sort_order || 0
          });
        });
        
        // Build folder hierarchy
        const rootFolders: CourseFolder[] = [];
        folderMap.forEach((folder) => {
          if (folder.parentId) {
            const parent = folderMap.get(folder.parentId);
            if (parent) {
              parent.children.push(folder);
            }
          } else {
            rootFolders.push(folder);
          }
        });
        
        // Assign chapters to folders
        chapters.forEach((chapter: any) => {
          const normalizedChapter = {
            ...chapter,
            name: chapter.name,
            filename: chapter.filename,
            path: chapter.path,
            type: chapter.type || 'html',
            folderId: chapter.folder_id || chapter.folderId
          };
          
          if (normalizedChapter.folderId) {
            const folder = folderMap.get(normalizedChapter.folderId);
            if (folder) {
              folder.chapters.push(normalizedChapter);
            }
          }
        });
        
        // Get custom names and apply them
        const customNames = await directoryManager.getCustomNames(selectedDir.id);
        
        courses.push({
          name: selectedDir.display_name,
          path: selectedDir.original_path,
          chapters: await applyCustomNames(chapters.filter((c: any) => !c.folderId && !c.folder_id), customNames),
          folders: await applyCustomNamesToFolders(rootFolders, customNames),
          originalPath: selectedDir.original_path,
          directoryId: selectedDir.id,
          categoryId: selectedDir.category_id,
          category: selectedDir.category
        });
      }
    }
  } catch (error) {
    console.error('Error fetching selected directories:', error);
  }
  
  return { courses, categories };
}

function getChaptersAndFoldersFromDirectory(dirPath: string, directoryId?: number): { chapters: Chapter[], folders: CourseFolder[] } {
  const chapters: Chapter[] = [];
  const folderMap = new Map<string, CourseFolder>();
  
  function walkDirectory(currentPath: string, relativePath: string = '', level: number = 0) {
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        const relativeFilePath = path.join(relativePath, item.name);
        
        if (item.isDirectory()) {
          // Create folder entry
          const folderId = Math.random(); // Temporary ID for client-side organization
          const folder: CourseFolder = {
            id: folderId,
            name: item.name,
            displayName: getDisplayName(item.name),
            path: relativeFilePath.replace(/\\/g, '/'),
            level,
            children: [],
            chapters: [],
            sortOrder: 0
          };
          
          folderMap.set(relativeFilePath, folder);
          
          // Recursively walk subdirectories
          walkDirectory(fullPath, relativeFilePath, level + 1);
        } else if (item.name.endsWith('.html') || isVideoFile(item.name)) {
          // Add HTML files and video files as chapters
          const chapter: Chapter = {
            name: getDisplayName(relativeFilePath),
            path: fullPath,
            filename: relativeFilePath.replace(/\\/g, '/'), // Convert to forward slashes for URL compatibility
            originalPath: fullPath,
            type: getFileType(item.name)
          };
          
          // If this file is in a folder, add it to that folder's chapters
          if (relativePath) {
            const folder = folderMap.get(relativePath);
            if (folder) {
              folder.chapters.push(chapter);
            }
          } else {
            // File is in root, add to main chapters array
            chapters.push(chapter);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error);
    }
  }
  
  walkDirectory(dirPath);
  
  // Build folder hierarchy
  const folders = Array.from(folderMap.values());
  const rootFolders: CourseFolder[] = [];
  
  // Sort chapters in each folder and root chapters
  chapters.sort((a, b) => naturalSort(a.filename, b.filename));
  folders.forEach(folder => {
    folder.chapters.sort((a, b) => naturalSort(a.filename, b.filename));
  });
  
  // Organize folders into hierarchy
  folders.forEach(folder => {
    const pathParts = folder.path.split('/');
    if (pathParts.length === 1) {
      // Root level folder
      rootFolders.push(folder);
    } else {
      // Find parent folder
      const parentPath = pathParts.slice(0, -1).join('/');
      const parent = folderMap.get(parentPath);
      if (parent) {
        parent.children.push(folder);
        folder.parentId = parent.id;
      }
    }
  });
  
  return { chapters, folders: rootFolders };
}

async function applyCustomNamesToFolders(folders: CourseFolder[], customNames: any[]): Promise<CourseFolder[]> {
  const customNameMap = new Map();
  customNames.forEach(cn => {
    if (cn.is_directory) {
      customNameMap.set(cn.file_path, cn.custom_name);
    }
  });
  
  function updateFolderNames(folders: CourseFolder[]): CourseFolder[] {
    return folders.map(folder => ({
      ...folder,
      displayName: customNameMap.get(folder.path) || folder.displayName,
      children: updateFolderNames(folder.children),
      chapters: folder.chapters.map(chapter => ({
        ...chapter,
        name: customNameMap.get(chapter.filename) || chapter.name
      }))
    }));
  }
  
  return updateFolderNames(folders);
}

async function applyCustomNames(chapters: Chapter[], customNames: any[]): Promise<Chapter[]> {
  const customNameMap = new Map();
  customNames.forEach(cn => {
    customNameMap.set(cn.file_path, cn.custom_name);
  });
  
  return chapters.map(chapter => ({
    ...chapter,
    name: customNameMap.get(chapter.filename) || chapter.name
  }));
}

function getDisplayName(filename: string): string {
  // Convert filename to a more readable display name
  const nameWithoutExt = path.parse(filename).name;
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function getChapterContent(courseName: string, chapterFilename: string): string | null {
  try {
    // First try the original courses directory
    const coursesChapterPath = path.join(process.cwd(), 'courses', courseName, chapterFilename.replace(/\//g, path.sep));
    if (fs.existsSync(coursesChapterPath)) {
      return fs.readFileSync(coursesChapterPath, 'utf-8');
    }
    
    // If not found, it might be from a selected directory - we'll need to get the actual path
    // This will be handled by the new API endpoint
    return null;
  } catch (error) {
    console.error('Error reading chapter content:', error);
    return null;
  }
}

export async function getChapterContentFromSelectedDir(directoryId: number, chapterFilename: string): Promise<string | null> {
  try {
    await ensureDbInitialized();
    const selectedDirectories = await directoryManager.getSelectedDirectories();
    const directory = selectedDirectories.find(d => d.id === directoryId);
    
    if (!directory) {
      return null;
    }
    
    const normalizedChapterFilename = chapterFilename.replace(/\//g, path.sep);
    const chapterPath = path.join(directory.original_path, normalizedChapterFilename);
    
    if (fs.existsSync(chapterPath)) {
      return fs.readFileSync(chapterPath, 'utf-8');
    }
    
    return null;
  } catch (error) {
    console.error('Error reading chapter content from selected directory:', error);
    return null;
  }
}

export async function addSelectedDirectory(originalPath: string, displayName: string, categoryId?: number): Promise<number> {
  await ensureDbInitialized();
  return directoryManager.addDirectory(originalPath, displayName, categoryId);
}

export async function removeSelectedDirectory(id: number): Promise<void> {
  await ensureDbInitialized();
  return directoryManager.removeDirectory(id);
}

export async function setCustomFileName(directoryId: number, filePath: string, originalName: string, customName: string, isDirectory: boolean = false): Promise<void> {
  await ensureDbInitialized();
  return directoryManager.setCustomName(directoryId, filePath, originalName, customName, isDirectory);
}

// Category management functions
export async function createCategory(name: string, description?: string, color?: string): Promise<number> {
  await ensureDbInitialized();
  return directoryManager.createCategory(name, description, color);
}

export async function getCategories(): Promise<CourseCategory[]> {
  await ensureDbInitialized();
  return directoryManager.getCategories();
}

export async function updateCategory(id: number, name: string, description?: string, color?: string): Promise<void> {
  await ensureDbInitialized();
  return directoryManager.updateCategory(id, name, description, color);
}

export async function deleteCategory(id: number): Promise<void> {
  await ensureDbInitialized();
  return directoryManager.deleteCategory(id);
}