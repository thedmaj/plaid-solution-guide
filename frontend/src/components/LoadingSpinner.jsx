import React from 'react';

export const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };
  
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`} />
    </div>
  );
};
