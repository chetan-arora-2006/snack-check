import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-2xl p-6 transition-all duration-300 ${
        hoverable ? 'hover:scale-[1.02] hover:-translate-y-1 hover:border-slate-700/50 hover:bg-slate-900/60 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
