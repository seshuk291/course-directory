'use client';

import { useState } from 'react';
import { Course } from '@/types/course';
import Dashboard from '@/components/Dashboard';
import CourseViewer from '@/components/CourseViewer';

export default function Home() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
  };

  if (selectedCourse) {
    return (
      <CourseViewer 
        course={selectedCourse} 
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return (
    <Dashboard onCourseSelect={handleCourseSelect} />
  );
}
