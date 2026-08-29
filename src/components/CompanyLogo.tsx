import React from 'react';

interface CompanyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  customSize?: number;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  size = 'md',
  customSize
}) => {
  const getDimension = () => {
    if (customSize) return customSize;
    switch (size) {
      case 'sm': return 32;
      case 'md': return 48;
      case 'lg': return 64;
      case 'xl': return 96;
      default: return 48;
    }
  };

  const dim = getDimension();

  return (
    <svg
      id="company-logo"
      width={dim}
      height={dim}
      viewBox="0 0 250 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradient for Left Crescent (Green) */}
        <linearGradient id="mkn-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A5D6A7" /> {/* Very light green */}
          <stop offset="30%" stopColor="#66BB6A" /> {/* Lime-ish green */}
          <stop offset="100%" stopColor="#1B5E20" /> {/* Dark forest green */}
        </linearGradient>

        {/* Gradient for Left Gothic Arch (Purple) */}
        <linearGradient id="mkn-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E1BEE7" /> {/* Soft lavender */}
          <stop offset="40%" stopColor="#9C27B0" /> {/* Vibrant violet */}
          <stop offset="100%" stopColor="#4A148C" /> {/* Deep dark indigo */}
        </linearGradient>

        {/* Gradient for Right Gothic Arch (Blue) */}
        <linearGradient id="mkn-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#81D4FA" /> {/* Light sky cyan */}
          <stop offset="40%" stopColor="#0288D1" /> {/* Rich royal blue */}
          <stop offset="100%" stopColor="#0A3066" /> {/* Deep oceanic navy */}
        </linearGradient>

        {/* Gradient for Right Crescent (Orange-Red) */}
        <linearGradient id="mkn-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" /> {/* Light sun yellow */}
          <stop offset="35%" stopColor="#FF8F00" /> {/* Rich amber orange */}
          <stop offset="100%" stopColor="#D84315" /> {/* Fiery burnt red */}
        </linearGradient>

        {/* Mask to cut out circular holes from the green crescent */}
        <mask id="green-wing-mask">
          {/* White keeps the shape */}
          <rect x="0" y="0" width="250" height="220" fill="#FFFFFF" />
          {/* Black cuts out the circular holes (making them 100% transparent) */}
          <circle cx="45" cy="115" r="7" fill="#000000" />
          <circle cx="58" cy="130" r="9" fill="#000000" />
          <circle cx="42" cy="148" r="6" fill="#000000" />
          <circle cx="54" cy="165" r="8" fill="#000000" />
        </mask>
      </defs>

      {/* Floating Bubbles/Particles on the Left Side (Green) */}
      <circle cx="15" cy="90" r="4" fill="url(#mkn-green-grad)" />
      <circle cx="8" cy="110" r="6" fill="url(#mkn-green-grad)" />
      <circle cx="18" cy="125" r="3" fill="url(#mkn-green-grad)" />
      <circle cx="5" cy="140" r="8" fill="url(#mkn-green-grad)" />
      <circle cx="14" cy="155" r="5" fill="url(#mkn-green-grad)" />
      <circle cx="8" cy="170" r="4" fill="url(#mkn-green-grad)" />
      <circle cx="20" cy="175" r="3" fill="url(#mkn-green-grad)" />

      {/* --- 1. GREEN CRESCENT (with circular cutout holes mask) --- */}
      <path
        d="M 20 180 
           C 20 115, 45 76, 85 76 
           C 85 110, 75 145, 75 180 
           Z"
        fill="url(#mkn-green-grad)"
        mask="url(#green-wing-mask)"
      />

      {/* --- 2. PURPLE ARCH --- */}
      <path
        d="M 60 180 
           C 60 110, 85 40, 110 40 
           C 120 40, 140 110, 140 180 
           L 120 180 
           C 120 135, 115 100, 110 100 
           C 105 100, 100 135, 80 180 
           Z"
        fill="url(#mkn-purple-grad)"
      />

      {/* --- 3. ORANGE CRESCENT --- */}
      <path
        d="M 230 180 
           C 230 115, 205 76, 165 76 
           C 165 110, 175 145, 175 180 
           Z"
        fill="url(#mkn-orange-grad)"
      />

      {/* --- 4. BLUE ARCH --- */}
      <path
        d="M 110 180 
           C 110 110, 135 40, 160 40 
           C 170 40, 190 110, 190 180 
           L 170 180 
           C 170 135, 165 100, 160 100 
           C 155 100, 150 135, 130 180 
           Z"
        fill="url(#mkn-blue-grad)"
      />
    </svg>
  );
};
