'use client';

import { useState, useEffect } from 'react';
import { 
  FolderPlusIcon,
  FolderOpenIcon,
  FolderIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Chapter, CourseFolder } from '@/types/course';

interface SubdirectoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  directoryId: number;
  courseName: string;
  onStructureUpdate: () => void;
}

interface FolderNode extends CourseFolder {
  expanded?: boolean;
}

export default function SubdirectoryManager({ 
  isOpen, 
  onClose, 
  directoryId, 
  courseName, 
  onStructureUpdate 
}: SubdirectoryManagerProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDisplayName, setNewFolderDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCourseStructure();
    }
  }, [isOpen, directoryId]);

  const fetchCourseStructure = async () => {
    try {
      const response = await fetch(`/api/directories/${directoryId}/structure`);
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders.map((f: CourseFolder) => ({ ...f, expanded: false })));
        setChapters(data.chapters);
      }
    } catch (error) {
      console.error('Error fetching course structure:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/directories/${directoryId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          displayName: newFolderDisplayName.trim() || newFolderName.trim(),
          parentId: selectedFolderId
        })
      });

      if (response.ok) {
        await fetchCourseStructure();
        onStructureUpdate();
        resetFolderForm();
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFolder = async (folderId: number, updates: Partial<CourseFolder>) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/directories/${directoryId}/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchCourseStructure();
        onStructureUpdate();
        setEditingFolderId(null);
      }
    } catch (error) {
      console.error('Error updating folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFolder = async (folderId: number) => {
    if (!confirm('Are you sure you want to delete this folder? All contents will be moved to the parent folder.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/directories/${directoryId}/folders/${folderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCourseStructure();
        onStructureUpdate();
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveChapter = async (chapterId: string, targetFolderId: number | null) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/directories/${directoryId}/chapters/${chapterId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: targetFolderId })
      });

      if (response.ok) {
        await fetchCourseStructure();
        onStructureUpdate();
      }
    } catch (error) {
      console.error('Error moving chapter:', error);
    } finally {
      setLoading(false);
    }
  };

  const reorderFolder = async (folderId: number, direction: 'up' | 'down') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/directories/${directoryId}/folders/${folderId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });

      if (response.ok) {
        await fetchCourseStructure();
        onStructureUpdate();
      }
    } catch (error) {
      console.error('Error reordering folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: number) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, expanded: !folder.expanded }
        : folder
    ));
  };

  const resetFolderForm = () => {
    setNewFolderName('');
    setNewFolderDisplayName('');
    setIsCreatingFolder(false);
    setSelectedFolderId(null);
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => (
    <div key={folder.id} className="mb-2">
      <div 
        className={`flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors ${
          selectedFolderId === folder.id ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center space-x-2 flex-1">
          <button
            onClick={() => toggleFolder(folder.id)}
            className="text-gray-500 hover:text-gray-700"
          >
            {folder.expanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
          
          {folder.expanded ? (
            <FolderOpenIcon className="h-5 w-5 text-blue-600" />
          ) : (
            <FolderIcon className="h-5 w-5 text-blue-600" />
          )}
          
          {editingFolderId === folder.id ? (
            <input
              type="text"
              defaultValue={folder.displayName || folder.name}
              onBlur={(e) => updateFolder(folder.id, { displayName: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateFolder(folder.id, { displayName: e.currentTarget.value });
                } else if (e.key === 'Escape') {
                  setEditingFolderId(null);
                }
              }}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-gray-900"
              autoFocus
            />
          ) : (
            <span 
              className="font-medium text-gray-900 cursor-pointer"
              onClick={() => setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)}
            >
              {folder.displayName || folder.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => reorderFolder(folder.id, 'up')}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Move up"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => reorderFolder(folder.id, 'down')}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Move down"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditingFolderId(folder.id)}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Rename"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteFolder(folder.id)}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {folder.expanded && (
        <div className="mt-2 ml-6">
          {/* Show chapters in this folder */}
          {chapters
            .filter(chapter => chapter.folderId === folder.id)
            .map(chapter => (
              <div
                key={chapter.path}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded mb-1 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <DocumentIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{chapter.name}</span>
                </div>
                <select
                  value={chapter.folderId || ''}
                  onChange={(e) => moveChapter(chapter.path, e.target.value ? parseInt(e.target.value) : null)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-900"
                >
                  <option value="">Root</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.displayName || f.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          
          {/* Show subfolders */}
          {folder.children.map(subfolder => renderFolder(subfolder, level + 1))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FolderPlusIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Organize: {courseName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Create Folder Form */}
          {isCreatingFolder && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Create New Folder {selectedFolderId && `in ${folders.find(f => f.id === selectedFolderId)?.displayName}`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., chapter-1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={newFolderDisplayName}
                    onChange={(e) => setNewFolderDisplayName(e.target.value)}
                    placeholder="e.g., Chapter 1: Introduction"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <button
                  onClick={createFolder}
                  disabled={loading || !newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Folder'}
                </button>
                <button
                  onClick={resetFolderForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Create Folder Button */}
          {!isCreatingFolder && (
            <div className="mb-6">
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FolderPlusIcon className="h-4 w-4" />
                <span>Create Folder</span>
              </button>
              {selectedFolderId && (
                <p className="text-sm text-gray-600 mt-2">
                  New folder will be created inside: {folders.find(f => f.id === selectedFolderId)?.displayName}
                </p>
              )}
            </div>
          )}

          {/* Folder Structure */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Course Structure</h3>
            
            {/* Root level chapters */}
            {chapters.filter(chapter => !chapter.folderId).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Root Files</h4>
                {chapters
                  .filter(chapter => !chapter.folderId)
                  .map(chapter => (
                    <div
                      key={chapter.path}
                      className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded mb-1"
                    >
                      <div className="flex items-center space-x-2">
                        <DocumentIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{chapter.name}</span>
                      </div>
                      <select
                        value={chapter.folderId || ''}
                        onChange={(e) => moveChapter(chapter.path, e.target.value ? parseInt(e.target.value) : null)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-900"
                      >
                        <option value="">Root</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.displayName || f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            )}
            
            {/* Folder structure */}
            {folders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No folders created yet</p>
                <p className="text-sm">Create folders to organize your course files</p>
              </div>
            ) : (
              folders
                .filter(folder => !folder.parentId)
                .map(folder => renderFolder(folder))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}