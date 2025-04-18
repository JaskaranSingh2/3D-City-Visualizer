"use client";

import React, { useState, useEffect } from 'react';

interface FilterNotificationProps {
  explanation: string;
  count: number;
  onClose: () => void;
}

export function FilterNotification({ explanation, count, onClose }: FilterNotificationProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Show notification with a slight delay for animation
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);
    
    // Auto-hide after 8 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500); // Call onClose after fade-out animation
    }, 8000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);
  
  return (
    <div 
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-800 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-4 transition-all duration-500 ${
        visible ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ maxWidth: '90vw', width: 'auto' }}
    >
      <div className="flex-shrink-0 bg-green-700 rounded-full p-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="font-medium">
          {count} {count === 1 ? 'building' : 'buildings'} matched your query
        </div>
        <div className="text-sm text-green-200">{explanation}</div>
      </div>
      <button 
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 500);
        }}
        className="flex-shrink-0 text-green-200 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
