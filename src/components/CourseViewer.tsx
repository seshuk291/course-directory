'use client';

import { useState } from 'react';
import { Course, Chapter, CourseFolder } from '@/types/course';
import { 
  ChevronLeftIcon,
  ChevronRightIcon, 
  ChevronDownIcon, 
  DocumentIcon, 
  PlayIcon,
  FolderIcon,
  FolderOpenIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ContentViewer from './ContentViewer';

interface CourseViewerProps {
  course: Course;
  onBackToDashboard: () => void;
}

export default function CourseViewer({ course, onBackToDashboard }: CourseViewerProps) {
  const [selectedChapter, setSelectedChapter] = useState<{
    course: string;
    chapter: string;
    title: string;
    type?: 'html' | 'video';
  } | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());

  const formatChapterTitle = (chapterName: string): string => {
    return chapterName
      .replace(/\.(html|htm|md|txt)$/i, '')
      .replace(/^\d+\s*[-.]?\s*/, '')
      .replace(/^\[.*?\]\s*/, '')
      .replace(/^\(.*?\)\s*/, '')
      .replace(/^(Build|Chapter|Lesson|Part|Section)\s*[-:]?\s*/i, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => {
        if (word.length <= 2) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ')
      .replace(/\bAi\b/g, 'AI')
      .replace(/\bApi\b/g, 'API')
      .replace(/\bUi\b/g, 'UI')
      .replace(/\bCss\b/g, 'CSS')
      .replace(/\bHtml\b/g, 'HTML')
      .replace(/\bJs\b/g, 'JavaScript')
      .replace(/\bReact\b/g, 'React');
  };

  const formatCourseTitle = (title: string): string => {
    return title
      .replace(/^(course-|mod-)/i, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\bAi\b/g, 'AI')
      .replace(/\bApi\b/g, 'API');
  };

  const handleChapterSelect = async (courseName: string, chapterFilename: string, chapterTitle: string, chapterType: 'html' | 'video' = 'html') => {
    setLoading(true);
    setSelectedChapter({ course: courseName, chapter: chapterFilename, title: chapterTitle, type: chapterType });
    
    if (chapterType === 'video') {
      setContent(null);
      setLoading(false);
    } else {
      try {
        const response = await fetch(`/api/courses/${courseName}/${encodeURIComponent(chapterFilename)}`);
        const data = await response.json();
        
        if (response.ok) {
          setContent(data.content);
        } else {
          console.error('Error fetching chapter content:', data.error);
          setContent('<div style="padding: 20px; color: red;">Error loading chapter content</div>');
        }
      } catch (error) {
        console.error('Error fetching chapter content:', error);
        setContent('<div style="padding: 20px; color: red;">Error loading chapter content</div>');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const markChapterComplete = (chapterKey: string) => {
    const newCompleted = new Set(completedChapters);
    if (newCompleted.has(chapterKey)) {
      newCompleted.delete(chapterKey);
    } else {
      newCompleted.add(chapterKey);
    }
    setCompletedChapters(newCompleted);
  };

  const getVideoUrl = () => {
    if (selectedChapter?.type === 'video') {
      return `/api/videos/${selectedChapter.course}/${encodeURIComponent(selectedChapter.chapter)}`;
    }
    return undefined;
  };

  const renderChapter = (chapter: Chapter, level: number = 0) => {
    const chapterKey = `${course.name}/${chapter.filename}`;
    const isSelected = selectedChapter?.course === course.name && selectedChapter?.chapter === chapter.filename;
    const isCompleted = completedChapters.has(chapterKey);
    
    return (
      <div
        key={chapter.filename}
        className={`flex items-start justify-between px-4 py-3 text-sm hover:bg-blue-50 transition-colors border-l-2 cursor-pointer ${
          isSelected
            ? 'bg-blue-100 text-blue-800 border-l-blue-500'
            : 'text-gray-600 border-l-transparent hover:border-l-blue-200'
        }`}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => handleChapterSelect(course.name, chapter.filename, chapter.name, chapter.type)}
      >
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex items-center space-x-2">
            {chapter.type === 'video' ? (
              <PlayIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            ) : (
              <DocumentIcon className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                markChapterComplete(chapterKey);
              }}
              className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {isCompleted && <CheckCircleIcon className="h-3 w-3" />}
            </button>
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-wrap leading-relaxed font-medium">
              {formatChapterTitle(chapter.name)}
            </span>
            {chapter.type === 'video' && (
              <span className="text-xs text-gray-500 mt-0.5">Video Content</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFolder = (folder: CourseFolder, level: number = 0) => {
    const isExpanded = expandedFolders.has(`${course.name}/${folder.path}`);
    const folderKey = `${course.name}/${folder.path}`;
    
    return (
      <div key={folderKey} style={{ marginLeft: `${level * 16}px` }}>
        <button
          onClick={() => toggleFolder(folderKey)}
          className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors w-full text-left rounded-md"
        >
          {isExpanded ? (
            <FolderOpenIcon className="h-4 w-4 text-blue-600 shrink-0" />
          ) : (
            <FolderIcon className="h-4 w-4 text-gray-600 shrink-0" />
          )}
          <span className="text-gray-700 font-medium flex-1">
            {formatCourseTitle(folder.displayName || folder.name)}
          </span>
          {isExpanded ? (
            <ChevronDownIcon className="h-3 w-3 text-gray-500 shrink-0" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 text-gray-500 shrink-0" />
          )}
        </button>
        
        {isExpanded && (
          <div>
            {folder.chapters.map((chapter: Chapter) => renderChapter(chapter, level + 1))}
            {folder.children.map((childFolder: CourseFolder) => 
              renderFolder(childFolder, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const getTotalChapters = () => {
    let total = course.chapters.length;
    const countInFolder = (folder: CourseFolder): number => {
      return folder.chapters.length + folder.children.reduce((sum, child) => sum + countInFolder(child), 0);
    };
    total += course.folders.reduce((sum, folder) => sum + countInFolder(folder), 0);
    return total;
  };

  const getCompletedCount = () => {
    return completedChapters.size;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onBackToDashboard}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-3"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            {formatCourseTitle(course.name)}
          </h1>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{getCompletedCount()} of {getTotalChapters()} completed</span>
            <span>{Math.round((getCompletedCount() / getTotalChapters()) * 100) || 0}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getCompletedCount() / getTotalChapters()) * 100 || 0}%` }}
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto">
          {course.chapters.length === 0 && course.folders.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-500 text-center">No content found</p>
          ) : (
            <div className="py-2">
              {/* Root-level chapters */}
              {course.chapters.map((chapter: Chapter) => renderChapter(chapter))}
              
              {/* Folders */}
              {course.folders.map((folder: CourseFolder) => renderFolder(folder))}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <ContentViewer 
          content={content} 
          title={selectedChapter?.title || `Welcome to ${formatCourseTitle(course.name)}`} 
          loading={loading}
          contentType={selectedChapter?.type || 'html'}
          videoUrl={getVideoUrl()}
        />
      </div>
    </div>
  );
}