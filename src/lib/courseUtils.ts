import fs from 'fs';
import path from 'path';
import { Course, Chapter } from '@/types/course';
import { DirectoryManager } from './database';

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

export async function getCourseStructure(): Promise<Course[]> {
  await ensureDbInitialized();
  
  const courses: Course[] = [];
  
  // Get courses from the original courses directory (for backward compatibility)
  const coursesDir = path.join(process.cwd(), 'courses');
  if (fs.existsSync(coursesDir)) {
    const courseItems = fs.readdirSync(coursesDir, { withFileTypes: true });
    
    for (const courseItem of courseItems) {
      if (courseItem.isDirectory()) {
        const coursePath = path.join(coursesDir, courseItem.name);
        const chapters = getChaptersFromDirectory(coursePath);
        
        courses.push({
          name: courseItem.name,
          path: coursePath,
          chapters,
          originalPath: coursePath
        });
      }
    }
  }
  
  // Get courses from selected directories
  try {
    const selectedDirectories = await directoryManager.getSelectedDirectories();
    
    for (const selectedDir of selectedDirectories) {
      if (fs.existsSync(selectedDir.original_path)) {
        const chapters = getChaptersFromDirectory(selectedDir.original_path, selectedDir.id);
        const customNames = await directoryManager.getCustomNames(selectedDir.id);
        
        courses.push({
          name: selectedDir.display_name,
          path: selectedDir.original_path,
          chapters: await applyCustomNames(chapters, customNames),
          originalPath: selectedDir.original_path,
          directoryId: selectedDir.id
        });
      }
    }
  } catch (error) {
    console.error('Error fetching selected directories:', error);
  }
  
  return courses;
}

function getChaptersFromDirectory(dirPath: string, directoryId?: number): Chapter[] {
  const chapters: Chapter[] = [];
  
  function walkDirectory(currentPath: string, relativePath: string = '') {
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        const relativeFilePath = path.join(relativePath, item.name);
        
        if (item.isDirectory()) {
          // Recursively walk subdirectories
          walkDirectory(fullPath, relativeFilePath);
        } else if (item.name.endsWith('.html') || isVideoFile(item.name)) {
          // Add HTML files and video files as chapters
          chapters.push({
            name: getDisplayName(relativeFilePath),
            path: fullPath,
            filename: relativeFilePath.replace(/\\/g, '/'), // Convert to forward slashes for URL compatibility
            originalPath: fullPath,
            type: getFileType(item.name)
          });
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error);
    }
  }
  
  walkDirectory(dirPath);
  
  // Sort chapters naturally by extracting numbers from the beginning of filenames
  return chapters.sort((a, b) => naturalSort(a.filename, b.filename));
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

export async function addSelectedDirectory(originalPath: string, displayName: string): Promise<number> {
  await ensureDbInitialized();
  return directoryManager.addDirectory(originalPath, displayName);
}

export async function removeSelectedDirectory(id: number): Promise<void> {
  await ensureDbInitialized();
  return directoryManager.removeDirectory(id);
}

export async function setCustomFileName(directoryId: number, filePath: string, originalName: string, customName: string, isDirectory: boolean = false): Promise<void> {
  await ensureDbInitialized();
  return directoryManager.setCustomName(directoryId, filePath, originalName, customName, isDirectory);
}