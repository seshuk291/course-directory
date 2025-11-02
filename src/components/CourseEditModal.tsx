'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CheckIcon,
  PencilIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { CourseCategory, Course } from '@/types/course';

interface CourseEditModalProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CourseEditModal({ isOpen, course, onClose, onUpdate }: CourseEditModalProps) {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [formData, setFormData] = useState({
    displayName: '',
    categoryId: undefined as number | undefined
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (course) {
        setFormData({
          displayName: course.name,
          categoryId: course.categoryId
        });
      }
    }
  }, [isOpen, course]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course?.directoryId || !formData.displayName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/directories/${course.directoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName.trim(),
          categoryId: formData.categoryId
        })
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ displayName: '', categoryId: undefined });
    onClose();
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Course</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Course Name *
              </label>
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                How this course appears in the sidebar
              </p>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="categoryId"
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  categoryId: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose a category to organize this course
              </p>
            </div>

            {/* Current category display */}
            {course.category && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <TagIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Current category:</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: course.category.color }}
                    />
                    <span className="text-sm font-medium">{course.category.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              <span>{loading ? 'Updating...' : 'Update Course'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}