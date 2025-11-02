'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ContentViewer from '@/components/ContentViewer';

export default function AdminPage() {
  const [selectedChapter, setSelectedChapter] = useState<{
    course: string;
    chapter: string;
    title: string;
    type?: 'html' | 'video';
  } | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const getVideoUrl = () => {
    if (selectedChapter?.type === 'video') {
      return `/api/videos/${selectedChapter.course}/${encodeURIComponent(selectedChapter.chapter)}`;
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-900">Course Management</h1>
          <p className="text-sm text-gray-600">Manage courses, directories, and content organization</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        <Sidebar 
          onChapterSelect={handleChapterSelect} 
          selectedChapter={selectedChapter ? { course: selectedChapter.course, chapter: selectedChapter.chapter } : null}
        />
        <ContentViewer 
          content={content} 
          title={selectedChapter?.title || 'Course Management Dashboard'} 
          loading={loading}
          contentType={selectedChapter?.type || 'html'}
          videoUrl={getVideoUrl()}
        />
      </div>
    </div>
  );
}