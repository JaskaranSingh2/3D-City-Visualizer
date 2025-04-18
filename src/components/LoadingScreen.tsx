import React from 'react';
import { LoaderIcon } from './LoaderIcon';

export function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
      <div className="text-white flex flex-col items-center gap-4">
        <LoaderIcon className="w-8 h-8 animate-spin" />
        <p className="text-lg">Loading 3D Scene...</p>
      </div>
    </div>
  );
}