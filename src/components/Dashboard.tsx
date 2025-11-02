'use client';

import { useState, useEffect } from 'react';
import { CourseStructure, Course, CourseCategory } from '@/types/course';
import { 
  ChevronRightIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  FolderIcon,
  AcademicCapIcon,
  PlusIcon,
  XMarkIcon,
  FolderPlusIcon
} from '@heroicons/react/24/outline';

interface DashboardProps {
  onCourseSelect: (course: Course) => void;
}

export default function Dashboard({ onCourseSelect }: DashboardProps) {
  const [courseStructure, setCourseStructure] = useState<CourseStructure>({ courses: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    directoryPath: '',
    displayName: '',
    categoryId: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourseStructure(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewCourse = async () => {
    if (!newCourseData.directoryPath.trim() || !newCourseData.displayName.trim()) {
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPath: newCourseData.directoryPath.trim(),
          displayName: newCourseData.displayName.trim(),
          categoryId: newCourseData.categoryId ? parseInt(newCourseData.categoryId) : null
        })
      });

      if (response.ok) {
        await fetchCourses(); // Refresh the course list
        resetModal();
      } else {
        const error = await response.json();
        alert(`Failed to add course: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to add course. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const resetModal = () => {
    setNewCourseData({
      directoryPath: '',
      displayName: '',
      categoryId: ''
    });
    setShowAddCourseModal(false);
  };

  const formatCourseTitle = (title: string): string => {
    return title
      .replace(/^(course-|mod-)/i, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\bAi\b/g, 'AI')
      .replace(/\bApi\b/g, 'API')
      .replace(/\bUi\b/g, 'UI')
      .replace(/\bCss\b/g, 'CSS')
      .replace(/\bHtml\b/g, 'HTML')
      .replace(/\bJs\b/g, 'JavaScript')
      .replace(/\bReact\b/g, 'React');
  };

  const getCourseStats = (course: Course) => {
    const totalChapters = course.chapters.length + 
      course.folders.reduce((sum, folder) => sum + folder.chapters.length, 0);
    const videoCount = course.chapters.filter(ch => ch.type === 'video').length +
      course.folders.reduce((sum, folder) => 
        sum + folder.chapters.filter(ch => ch.type === 'video').length, 0);
    
    return { totalChapters, videoCount };
  };

  const renderCourseCard = (course: Course) => {
    const { totalChapters, videoCount } = getCourseStats(course);
    const progress = course.progress;
    
    return (
      <div
        key={course.name}
        onClick={() => onCourseSelect(course)}
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 overflow-hidden group"
      >
        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <AcademicCapIcon className="h-16 w-16 text-white opacity-80" />
          </div>
          {progress && progress.total > 0 && (
            <div className="absolute top-4 right-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white text-sm font-medium">{progress.percentage}%</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-semibold text-lg line-clamp-2">
              {formatCourseTitle(course.name)}
            </h3>
          </div>
        </div>
        
        <div className="p-4">
          {progress && progress.total > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{progress.completed} of {progress.total} chapters</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{totalChapters} chapters</span>
            </div>
            {videoCount > 0 && (
              <div className="flex items-center space-x-1">
                <PlayCircleIcon className="h-4 w-4" />
                <span>{videoCount} videos</span>
              </div>
            )}
          </div>
          
          {course.folders.length > 0 && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <FolderIcon className="h-4 w-4" />
              <span>{course.folders.length} sections</span>
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
              {progress && progress.percentage === 100 ? 'Review Course' : progress && progress.percentage > 0 ? 'Continue Learning' : 'Start Learning'}
            </span>
            <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>
      </div>
    );
  };

  const renderCategorySection = (category: CourseCategory, courses: Course[]) => {
    if (courses.length === 0) return null;

    return (
      <div key={category.id} className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: category.color }}
          />
          <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
          <span className="text-gray-500">({courses.length} course{courses.length !== 1 ? 's' : ''})</span>
        </div>
        {category.description && (
          <p className="text-gray-600 mb-6">{category.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map(course => renderCourseCard(course))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group courses by category
  const categorizedCourses = new Map<number | 'uncategorized', Course[]>();
  courseStructure.courses.forEach((course: Course) => {
    const key = course.categoryId || 'uncategorized';
    if (!categorizedCourses.has(key)) {
      categorizedCourses.set(key, []);
    }
    categorizedCourses.get(key)!.push(course);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Directory</h1>
              <p className="text-gray-600 mt-1">Choose a course to start learning</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {courseStructure.courses.length} course{courseStructure.courses.length !== 1 ? 's' : ''} available
              </div>
              <a
                href="/admin"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Manage Courses
              </a>
              <button
                onClick={() => setShowAddCourseModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Course</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categorized courses */}
        {courseStructure.categories.map((category: CourseCategory) => {
          const coursesInCategory = categorizedCourses.get(category.id) || [];
          return renderCategorySection(category, coursesInCategory);
        })}

        {/* Uncategorized courses */}
        {(() => {
          const uncategorizedCourses = categorizedCourses.get('uncategorized') || [];
          if (uncategorizedCourses.length === 0) return null;

          return (
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-gray-400" />
                <h2 className="text-2xl font-bold text-gray-900">Uncategorized</h2>
                <span className="text-gray-500">({uncategorizedCourses.length} course{uncategorizedCourses.length !== 1 ? 's' : ''})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {uncategorizedCourses.map(course => renderCourseCard(course))}
              </div>
            </div>
          );
        })()}

        {courseStructure.courses.length === 0 && (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-600 mb-4">Add some courses to get started with learning.</p>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Your First Course</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FolderPlusIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Add New Course</h2>
              </div>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Directory Path *
                  </label>
                  <input
                    type="text"
                    value={newCourseData.directoryPath}
                    onChange={(e) => setNewCourseData(prev => ({...prev, directoryPath: e.target.value}))}
                    placeholder="F:\courses\my-new-course"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Full path to the course directory containing your course files
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Display Name *
                  </label>
                  <input
                    type="text"
                    value={newCourseData.displayName}
                    onChange={(e) => setNewCourseData(prev => ({...prev, displayName: e.target.value}))}
                    placeholder="Complete Web Development Course"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How the course will appear in your dashboard
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    value={newCourseData.categoryId}
                    onChange={(e) => setNewCourseData(prev => ({...prev, categoryId: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Select a category</option>
                    {courseStructure.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={createNewCourse}
                  disabled={creating || !newCourseData.directoryPath.trim() || !newCourseData.displayName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Adding Course...' : 'Add Course'}
                </button>
                <button
                  onClick={resetModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}