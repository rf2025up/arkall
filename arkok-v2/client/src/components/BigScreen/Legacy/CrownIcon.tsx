import React from 'react';

const CrownIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 16L3 5l5.5-2L12 4.5L15.5 3L21 5l-2 11H5z" />
      <path d="M10 13l2 7 2-7" />
      <circle cx="7.5" cy="8" r="1" />
      <circle cx="16.5" cy="8" r="1" />
    </svg>
  );
};

export default CrownIcon;