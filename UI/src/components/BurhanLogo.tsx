interface BurhanLogoProps {
  className?: string;
  size?: number;
}

export function BurhanLogo({ className = "", size = 40 }: BurhanLogoProps) {
  return (
    <svg 
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded square */}
      <rect width="100" height="100" rx="16" fill="#001F3F" />
      
      {/* NPG76 Logo Design - Abstract geometric pattern */}
      <g transform="translate(20, 25)">
        {/* Left bracket in Spring Yellow */}
        <path
          d="M 10 5 L 5 5 Q 0 5 0 10 L 0 40 Q 0 45 5 45 L 10 45"
          stroke="#DBE64C"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Right bracket in Mantis Green */}
        <path
          d="M 50 5 L 55 5 Q 60 5 60 10 L 60 40 Q 60 45 55 45 L 50 45"
          stroke="#74C365"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Center geometric shapes */}
        {/* Top square in Spring Yellow */}
        <rect x="22" y="8" width="16" height="16" rx="3" fill="#DBE64C" />
        
        {/* Bottom square in Mantis Green */}
        <rect x="22" y="26" width="16" height="16" rx="3" fill="#74C365" />
      </g>
    </svg>
  );
}
