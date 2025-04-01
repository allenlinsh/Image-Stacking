import { ButtonHTMLAttributes } from 'react';

interface RoundedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
}

export function RoundedButton({ title, className = '', ...props }: RoundedButtonProps) {
  return (
    <button
      className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
      {...props}
    >
      {title}
    </button>
  );
}
