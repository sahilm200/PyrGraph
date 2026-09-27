import React from 'react';

export const FlameLogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#f0883e]/20 via-[#da3633]/20 to-transparent border border-[#f0883e]/30 shadow-inner ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_0_8px_rgba(240,136,62,0.6)]"
      >
        <path
          d="M12 2C10.5 4.5 9 6.5 9 9C9 10.1 9.4 11.1 10.1 11.9C9.5 11.5 8.9 11 8.5 10.3C7.5 12 7 14 7 15.5C7 18.5 9.2 21 12 21C14.8 21 17 18.5 17 15.5C17 13.5 15.8 11.5 14.5 9.5C14.5 10.5 14 11.5 13.2 12C13.8 10 14 8 13.5 6C13 4.5 12.5 3 12 2Z"
          fill="url(#pyrgraph-flame-grad)"
        />
        <path
          d="M12 14C11.2 14 10.5 14.7 10.5 15.5C10.5 16.9 11.5 18 12 18C12.5 18 13.5 16.9 13.5 15.5C13.5 14.7 12.8 14 12 14Z"
          fill="#ffdf5d"
        />
        <defs>
          <linearGradient id="pyrgraph-flame-grad" x1="12" y1="2" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f0883e" />
            <stop offset="0.6" stopColor="#da3633" />
            <stop offset="1" stopColor="#8e1515" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
