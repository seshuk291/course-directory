'use client';

import { useState, useEffect } from 'react';
import { Course } from '@/types/course';
import { ChevronRightIcon, ChevronDownIcon, DocumentIcon, PencilIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline';
import DirectoryManager from './DirectoryManager';

interface SidebarProps {
  onChapterSelect: (courseName: string, chapterFilename: string, chapterTitle: string, chapterType?: 'html' | 'video') => void;
  selectedChapter?: { course: string; chapter: string } | null;
}

export default function Sidebar({ onChapterSelect, selectedChapter }: SidebarProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ course: string; chapter: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data.courses);
      
      // Expand first course by default
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
      const response = await fetch(`/api/directories?id=${courseId}`, {
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

  const handleRename = async (type: 'course' | 'chapter', courseName: string, chapterFilename?: string) => {
    if (!editValue.trim()) {
      alert('Name cannot be empty');
      return;
    }

    try {
      const course = courses.find(c => c.name === courseName);
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
      const course = courses.find(c => c.name === courseName);
      const chapter = course?.chapters.find(ch => ch.filename === chapterFilename);
      setEditValue(chapter?.name || '');
    }
  };

  const cancelEditing = () => {
    setEditingCourse(null);
    setEditingChapter(null);
    setEditValue('');
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
      <h2 className="text-xl font-bold text-gray-800 mb-4">Course Directory</h2>
      
      <DirectoryManager onDirectoryAdded={fetchCourses} />
      
      {courses.length === 0 ? (
        <p className="text-gray-500 text-sm">No courses found. Add a directory to get started.</p>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <div key={course.name} className="border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={() => toggleCourse(course.name)}
                  className="flex-1 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {editingCourse === course.name ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename('course', course.name);
                          } else if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename('course', course.name);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditing();
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-700 capitalize text-wrap leading-relaxed flex-1 pr-2">
                        {course.name.replace(/-/g, ' ')}
                      </span>
                      {expandedCourses.has(course.name) ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500 shrink-0" />
                      )}
                    </>
                  )}
                </button>
                
                {!editingCourse && (
                  <div className="flex items-center space-x-1 ml-2">
                    {course.directoryId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing('course', course.name);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Rename course"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </button>
                    )}
                    {course.directoryId && (
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
                    )}
                  </div>
                )}
              </div>
              
              {expandedCourses.has(course.name) && (
                <div className="border-t border-gray-100">
                  {course.chapters.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500">No chapters found</p>
                  ) : (
                    <div className="py-1">
                      {course.chapters.map((chapter) => (
                        <div
                          key={chapter.filename}
                          className={`flex items-start justify-between px-3 py-3 text-sm hover:bg-blue-50 transition-colors ${
                            selectedChapter?.course === course.name && 
                            selectedChapter?.chapter === chapter.filename
                              ? 'bg-blue-100 text-blue-800'
                              : 'text-gray-600'
                          }`}
                        >
                          {editingChapter?.course === course.name && editingChapter?.chapter === chapter.filename ? (
                            <div className="flex-1 flex items-center space-x-2">
                              {chapter.type === 'video' ? (
                                <PlayIcon className="h-4 w-4 shrink-0 text-red-600" />
                              ) : (
                                <DocumentIcon className="h-4 w-4 shrink-0" />
                              )}
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRename('chapter', course.name, chapter.filename);
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleRename('chapter', course.name, chapter.filename)}
                                className="text-green-600 hover:text-green-800"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-red-600 hover:text-red-800"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}