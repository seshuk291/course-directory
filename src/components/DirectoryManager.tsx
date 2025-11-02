'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, FolderOpenIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import { CourseCategory } from '@/types/course';

interface DirectoryManagerProps {
  onDirectoryAdded: () => void;
}

export default function DirectoryManager({ onDirectoryAdded }: DirectoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [directoryPath, setDirectoryPath] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleAddDirectory = async () => {
    if (!directoryPath.trim() || !displayName.trim()) {
      alert('Please provide both directory path and display name');
      return;
    }

    // Basic path validation
    const trimmedPath = directoryPath.trim();
    if (trimmedPath.length < 3) {
      alert('Please enter a valid directory path');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/directories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPath: trimmedPath,
          displayName: displayName.trim(),
          categoryId: selectedCategoryId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDirectoryPath('');
        setDisplayName('');
        setSelectedCategoryId(undefined);
        setIsOpen(false);
        onDirectoryAdded();
        alert('Directory added successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding directory:', error);
      alert('Failed to add directory. Please check your network connection and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBrowseDirectory = () => {
    alert(`To add a directory:
1. Navigate to your course directory in File Explorer
2. Copy the full path from the address bar (e.g., C:\\Users\\YourName\\Documents\\MyCourse)
3. Paste it in the "Directory Path" field above
4. Give it a display name
5. Click "Add Directory"

Note: Due to browser security restrictions, we cannot directly browse your file system.`);
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
        <span>Add Directory</span>
      </button>

      {isOpen && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Add Course Directory</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Directory Path
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={directoryPath}
                  onChange={(e) => setDirectoryPath(e.target.value)}
                  placeholder="e.g., C:\Users\YourName\Documents\MyCourse"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={handleBrowseDirectory}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-1"
                >
                  <FolderOpenIcon className="h-4 w-4" />
                  <span>Help</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the full path to your course directory. On Windows: C:\path\to\folder, On Mac/Linux: /path/to/folder
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., My JavaScript Course"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How this course will appear in the sidebar
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (Optional)
              </label>
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
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
                Choose a category to organize your courses
              </p>
            </div>
          </div>

          <div className="flex space-x-2 mt-6">
            <button
              onClick={handleAddDirectory}
              disabled={isAdding}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? 'Adding...' : 'Add Directory'}
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setDirectoryPath('');
                setDisplayName('');
                setSelectedCategoryId(undefined);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}