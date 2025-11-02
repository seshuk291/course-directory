'use client';

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import VideoPlayer from './VideoPlayer';

interface ContentViewerProps {
  content: string | null;
  title: string;
  loading: boolean;
  contentType?: 'html' | 'video';
  videoUrl?: string;
}

export default function ContentViewer({ content, title, loading, contentType = 'html', videoUrl }: ContentViewerProps) {
  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!content && !videoUrl) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">📚</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">Welcome to Course Directory</h3>
          <p className="text-gray-500">Select a chapter from the sidebar to view its content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>
      
      <div className="flex-1 bg-white overflow-hidden">
        {contentType === 'video' && videoUrl ? (
          <div className="h-full p-8">
            <VideoPlayer 
              src={videoUrl} 
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="h-full">
            <iframe
              srcDoc={content || ''}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title={title}
            />
          </div>
        )}
      </div>
    </div>
  );
}