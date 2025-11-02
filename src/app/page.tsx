'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ContentViewer from '@/components/ContentViewer';
import { CourseStructure } from '@/types/course';

export default function Home() {
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
      // For videos, we don't need to fetch content, just set the video URL
      setContent(null);
      setLoading(false);
    } else {
      // For HTML content, fetch as before
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        onChapterSelect={handleChapterSelect} 
        selectedChapter={selectedChapter ? { course: selectedChapter.course, chapter: selectedChapter.chapter } : null}
      />
      <ContentViewer 
        content={content} 
        title={selectedChapter?.title || 'Course Directory'} 
        loading={loading}
        contentType={selectedChapter?.type || 'html'}
        videoUrl={getVideoUrl()}
      />
    </div>
  );
}
