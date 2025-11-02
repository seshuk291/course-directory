'use client';

import { useState, useEffect } from 'react';
import { Course, CourseStructure, CourseCategory, CourseFolder } from '@/types/course';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  DocumentIcon, 
  PencilIcon, 
  TrashIcon, 
  PlayIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  TagIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import DirectoryManager from './DirectoryManager';
import CategoryManager from './CategoryManager';
import CourseEditModal from './CourseEditModal';
import SubdirectoryManager from './SubdirectoryManager';

interface SidebarProps {
  onChapterSelect: (courseName: string, chapterFilename: string, chapterTitle: string, chapterType?: 'html' | 'video') => void;
  selectedChapter?: { course: string; chapter: string } | null;
}

interface SidebarProps {
  onChapterSelect: (courseName: string, chapterFilename: string, chapterTitle: string, chapterType?: 'html' | 'video') => void;
  selectedChapter?: { course: string; chapter: string } | null;
}

export default function Sidebar({ onChapterSelect, selectedChapter }: SidebarProps) {
  const [courseStructure, setCourseStructure] = useState<CourseStructure>({ courses: [], categories: [] });
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ course: string; chapter: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCourseEditModal, setShowCourseEditModal] = useState(false);
  const [editingCourseData, setEditingCourseData] = useState<Course | null>(null);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [showSubdirectoryManager, setShowSubdirectoryManager] = useState(false);
  const [selectedCourseForSubdirs, setSelectedCourseForSubdirs] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Function to format chapter names into better titles
  const formatChapterTitle = (chapterName: string): string => {
    return chapterName
      // Remove file extensions
      .replace(/\.(html|htm|md|txt)$/i, '')
      // Remove common prefixes like numbers, brackets, and build indicators
      .replace(/^\d+\s*[-.]?\s*/, '')
      .replace(/^\[.*?\]\s*/, '')
      .replace(/^\(.*?\)\s*/, '')
      .replace(/^(Build|Chapter|Lesson|Part|Section)\s*[-:]?\s*/i, '')
      // Replace hyphens and underscores with spaces
      .replace(/[-_]/g, ' ')
      // Split camelCase and PascalCase
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
      // Capitalize first letter of each sentence
      .split('. ')
      .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase())
      .join('. ')
      // Fix common technical terms
      .replace(/\bAi\b/g, 'AI')
      .replace(/\bApi\b/g, 'API')
      .replace(/\bUi\b/g, 'UI')
      .replace(/\bUx\b/g, 'UX')
      .replace(/\bCss\b/g, 'CSS')
      .replace(/\bHtml\b/g, 'HTML')
      .replace(/\bJs\b/g, 'JavaScript')
      .replace(/\bTs\b/g, 'TypeScript');
  };

  // Function to format course names into better titles
  const formatCourseTitle = (courseName: string): string => {
    return courseName
      // Replace hyphens and underscores with spaces
      .replace(/[-_]/g, ' ')
      // Remove common prefixes like numbers and brackets
      .replace(/^\d+\s*[-.]?\s*/, '')
      .replace(/^\[.*?\]\s*/, '')
      // Split camelCase and PascalCase
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Capitalize each word properly
      .split(' ')
      .map(word => {
        // Don't capitalize common small words unless they're the first word
        const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with'];
        const lowerWord = word.toLowerCase();
        return smallWords.includes(lowerWord) ? lowerWord : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ')
      // Capitalize first word always
      .replace(/^./, str => str.toUpperCase())
      // Fix common technical terms
      .replace(/\bAi\b/g, 'AI')
      .replace(/\bApi\b/g, 'API')
      .replace(/\bUi\b/g, 'UI')
      .replace(/\bUx\b/g, 'UX')
      .replace(/\bCss\b/g, 'CSS')
      .replace(/\bHtml\b/g, 'HTML')
      .replace(/\bJs\b/g, 'JavaScript')
      .replace(/\bTs\b/g, 'TypeScript')
      .replace(/\bReact\b/g, 'React')
      .replace(/\bNode\b/g, 'Node.js')
      .replace(/\bVue\b/g, 'Vue.js')
      .replace(/\bAngular\b/g, 'Angular');
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourseStructure(data);
      
      // Auto-expand first category and first course by default
      if (data.categories.length > 0) {
        setExpandedCategories(new Set([data.categories[0].id]));
      }
      if (data.courses.length > 0) {
        setExpandedCourses(new Set([data.courses[0].name]));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseName: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseName)) {
      newExpanded.delete(courseName);
    } else {
      newExpanded.add(courseName);
    }
    setExpandedCourses(newExpanded);
  };

  const handleRemoveDirectory = async (courseId: number) => {
    if (!confirm('Are you sure you want to remove this directory?')) {
      return;
    }

    try {
      const response = await fetch(`/api/directories/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCourses(); // Refresh the list
      } else {
        alert('Failed to remove directory');
      }
    } catch (error) {
      console.error('Error removing directory:', error);
      alert('Failed to remove directory');
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourseData(course);
    setShowCourseEditModal(true);
  };

  const handleCourseUpdate = () => {
    fetchCourses();
    setShowCourseEditModal(false);
    setEditingCourseData(null);
  };

  const handleRename = async (type: 'course' | 'chapter', courseName: string, chapterFilename?: string) => {
    if (!editValue.trim()) {
      alert('Name cannot be empty');
      return;
    }

    try {
      const course = courseStructure.courses.find((c: Course) => c.name === courseName);
      if (!course || !course.directoryId) {
        alert('Can only rename items from selected directories');
        return;
      }

      const response = await fetch('/api/custom-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          directoryId: course.directoryId,
          filePath: chapterFilename || '',
          originalName: type === 'course' ? courseName : chapterFilename || '',
          customName: editValue.trim(),
          isDirectory: type === 'course',
        }),
      });

      if (response.ok) {
        fetchCourses(); // Refresh the list
        setEditingCourse(null);
        setEditingChapter(null);
        setEditValue('');
      } else {
        alert('Failed to rename');
      }
    } catch (error) {
      console.error('Error renaming:', error);
      alert('Failed to rename');
    }
  };

  const startEditing = (type: 'course' | 'chapter', courseName: string, chapterFilename?: string) => {
    if (type === 'course') {
      setEditingCourse(courseName);
      setEditValue(courseName);
    } else if (chapterFilename) {
      setEditingChapter({ course: courseName, chapter: chapterFilename });
      const course = courseStructure.courses.find((c: Course) => c.name === courseName);
      const chapter = course?.chapters.find((ch: any) => ch.filename === chapterFilename);
      setEditValue(chapter?.name || '');
    }
  };

  const cancelEditing = () => {
    setEditingCourse(null);
    setEditingChapter(null);
    setEditValue('');
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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

  const renderFolder = (folder: CourseFolder, courseName: string, level: number = 0) => {
    const isExpanded = expandedFolders.has(`${courseName}/${folder.path}`);
    const folderKey = `${courseName}/${folder.path}`;
    
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
            {/* Render chapters in this folder */}
            {folder.chapters.map((chapter: any) => (
              <div
                key={chapter.filename}
                className={`flex items-start justify-between px-4 py-2 text-sm hover:bg-blue-50 transition-colors border-l-2 ${
                  selectedChapter?.course === courseName && 
                  selectedChapter?.chapter === chapter.filename
                    ? 'bg-blue-100 text-blue-800 border-l-blue-500'
                    : 'text-gray-600 border-l-transparent hover:border-l-blue-200'
                }`}
                style={{ marginLeft: `${(level + 1) * 16}px` }}
              >
                <button
                  onClick={() => onChapterSelect(courseName, chapter.filename, chapter.name, chapter.type)}
                  className="flex-1 flex items-start space-x-2 text-left"
                >
                  {chapter.type === 'video' ? (
                    <PlayIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  ) : (
                    <DocumentIcon className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col flex-1">
                    <span className="text-wrap leading-relaxed font-medium">
                      {formatChapterTitle(chapter.name)}
                    </span>
                    {chapter.type === 'video' && (
                      <span className="text-xs text-gray-500 mt-0.5">Video Content</span>
                    )}
                  </div>
                </button>
              </div>
            ))}
            
            {/* Render child folders */}
            {folder.children.map((childFolder: CourseFolder) => 
              renderFolder(childFolder, courseName, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCourse = (course: Course) => (
    <div key={course.name} className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => toggleCourse(course.name)}
          className="flex-1 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors p-2 -m-2"
        >
          <div className="flex items-center space-x-3 flex-1">
            {course.category && (
              <div
                className="w-1 h-8 rounded-full shrink-0"
                style={{ backgroundColor: course.category.color }}
                title={course.category.name}
              />
            )}
            <div className="flex flex-col flex-1 text-left pr-2">
              <span className="font-semibold text-gray-800 text-sm leading-tight">
                {formatCourseTitle(course.name)}
              </span>
              {course.category && (
                <span className="text-xs text-gray-500 mt-0.5">
                  {course.category.name}
                </span>
              )}
            </div>
          </div>
          {expandedCourses.has(course.name) ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500 shrink-0" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-500 shrink-0" />
          )}
        </button>
        
        <div className="flex items-center space-x-1 ml-2">
          {course.directoryId && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCourseForSubdirs(course);
                  setShowSubdirectoryManager(true);
                }}
                className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                title="Organize into folders"
              >
                <FolderPlusIcon className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCourse(course);
                }}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="Edit course settings"
              >
                <Cog6ToothIcon className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('course', course.name);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Quick rename"
              >
                <PencilIcon className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveDirectory(course.directoryId!);
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove directory"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {expandedCourses.has(course.name) && (
        <div className="border-t border-gray-100">
          {course.chapters.length === 0 && course.folders.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">No content found</p>
          ) : (
            <div className="py-1">
              {/* Render root-level chapters */}
              {course.chapters.map((chapter: any) => (
                <div
                  key={chapter.filename}
                  className={`flex items-start justify-between px-4 py-3 text-sm hover:bg-blue-50 transition-colors border-l-2 ${
                    selectedChapter?.course === course.name && 
                    selectedChapter?.chapter === chapter.filename
                      ? 'bg-blue-100 text-blue-800 border-l-blue-500'
                      : 'text-gray-600 border-l-transparent hover:border-l-blue-200'
                  }`}
                >
                  <button
                    onClick={() => onChapterSelect(course.name, chapter.filename, chapter.name, chapter.type)}
                    className="flex-1 flex items-start space-x-2 text-left"
                  >
                    {chapter.type === 'video' ? (
                      <PlayIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                    ) : (
                      <DocumentIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="text-wrap leading-relaxed font-medium">
                        {formatChapterTitle(chapter.name)}
                      </span>
                      {chapter.type === 'video' && (
                        <span className="text-xs text-gray-500 mt-0.5">Video Content</span>
                      )}
                    </div>
                  </button>
                  {course.directoryId && (
                    <button
                      onClick={() => startEditing('chapter', course.name, chapter.filename)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors shrink-0 mt-0.5"
                      title="Rename chapter"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Render folders */}
              {course.folders.map((folder: CourseFolder) => renderFolder(folder, course.name))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderByCategory = () => {
    const categorizedCourses = new Map<number | 'uncategorized', Course[]>();
    
    // Group courses by category
    courseStructure.courses.forEach((course: Course) => {
      const key = course.categoryId || 'uncategorized';
      if (!categorizedCourses.has(key)) {
        categorizedCourses.set(key, []);
      }
      categorizedCourses.get(key)!.push(course);
    });

    return (
      <div className="space-y-4">
        {/* Render categorized courses */}
        {courseStructure.categories.map((category: CourseCategory) => {
          const coursesInCategory = categorizedCourses.get(category.id) || [];
          if (coursesInCategory.length === 0) return null;

          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-8 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-gray-800 text-lg">{category.name}</span>
                    <span className="text-sm text-gray-500">
                      {coursesInCategory.length} course{coursesInCategory.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-200 p-2 space-y-2">
                  {coursesInCategory.map((course: Course) => renderCourse(course))}
                </div>
              )}
            </div>
          );
        })}

        {/* Render uncategorized courses */}
        {(() => {
          const uncategorizedCourses = categorizedCourses.get('uncategorized') || [];
          if (uncategorizedCourses.length === 0) return null;

          return (
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-8 rounded-full bg-gray-400" />
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-gray-800 text-lg">Uncategorized</span>
                    <span className="text-sm text-gray-500">
                      {uncategorizedCourses.length} course{uncategorizedCourses.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {uncategorizedCourses.map((course: Course) => renderCourse(course))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-96 bg-gray-50 border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Course Directory</h2>
        <button
          onClick={() => setShowCategoryManager(true)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Manage Categories"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
      </div>
      
      <DirectoryManager onDirectoryAdded={fetchCourses} />
      
      {/* View Toggle */}
      <div className="mb-4 flex items-center space-x-2">
        <TagIcon className="h-4 w-4 text-gray-500" />
        <label className="text-sm text-gray-600">
          <input
            type="checkbox"
            checked={groupByCategory}
            onChange={(e) => setGroupByCategory(e.target.checked)}
            className="mr-2"
          />
          Group by Category
        </label>
      </div>
      
      {courseStructure.courses.length === 0 ? (
        <p className="text-gray-500 text-sm">No courses found. Add a directory to get started.</p>
      ) : groupByCategory ? (
        renderByCategory()
      ) : (
        <div className="space-y-2">
          {courseStructure.courses.map((course: Course) => renderCourse(course))}
        </div>
      )}

      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoryUpdate={fetchCourses}
      />

      <CourseEditModal
        isOpen={showCourseEditModal}
        course={editingCourseData}
        onClose={() => {
          setShowCourseEditModal(false);
          setEditingCourseData(null);
        }}
        onUpdate={handleCourseUpdate}
      />

      {selectedCourseForSubdirs && (
        <SubdirectoryManager
          isOpen={showSubdirectoryManager}
          onClose={() => {
            setShowSubdirectoryManager(false);
            setSelectedCourseForSubdirs(null);
          }}
          directoryId={selectedCourseForSubdirs.directoryId!}
          courseName={selectedCourseForSubdirs.name}
          onStructureUpdate={fetchCourses}
        />
      )}
    </div>
  );
}