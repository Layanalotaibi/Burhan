import burhanLogo from "figma:asset/3aa99b444bef66924a6d58cf2a77fe13b79e4e98.png";

interface BurhanNewLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export function BurhanNewLogo({ className = "", size = "md" }: BurhanNewLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
    "2xl": "w-48 h-48",
    "3xl": "w-64 h-64",
  };

  return (
    <img 
      src={burhanLogo} 
      alt="Burhan Logo" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}