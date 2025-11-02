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
          className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 transition-colors w-full text-left"
        >
          {isExpanded ? (
            <FolderOpenIcon className="h-4 w-4 text-blue-600" />
          ) : (
            <FolderIcon className="h-4 w-4 text-gray-600" />
          )}
          <span className="text-gray-700">{folder.displayName || folder.name}</span>
          {isExpanded ? (
            <ChevronDownIcon className="h-3 w-3 text-gray-500 ml-auto" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 text-gray-500 ml-auto" />
          )}
        </button>
        
        {isExpanded && (
          <div>
            {/* Render chapters in this folder */}
            {folder.chapters.map((chapter: any) => (
              <div
                key={chapter.filename}
                className={`flex items-start justify-between px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                  selectedChapter?.course === courseName && 
                  selectedChapter?.chapter === chapter.filename
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600'
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
                  <span className="text-wrap leading-relaxed">{chapter.name}</span>
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
    <div key={course.name} className="border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => toggleCourse(course.name)}
          className="flex-1 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-2 flex-1">
            {course.category && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: course.category.color }}
                title={course.category.name}
              />
            )}
            <span className="font-medium text-gray-700 capitalize text-wrap leading-relaxed flex-1 pr-2">
              {course.name.replace(/-/g, ' ')}
            </span>
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
                  className={`flex items-start justify-between px-3 py-3 text-sm hover:bg-blue-50 transition-colors ${
                    selectedChapter?.course === course.name && 
                    selectedChapter?.chapter === chapter.filename
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600'
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
                    <span className="text-wrap leading-relaxed">{chapter.name}</span>
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
            <div key={category.id} className="border border-gray-300 rounded-lg">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-semibold text-gray-800">{category.name}</span>
                  <span className="text-sm text-gray-500">({coursesInCategory.length})</span>
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
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2 px-2">Uncategorized</h3>
              <div className="space-y-2">
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