import React, { useEffect, useState } from "react";

interface GameToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

const GameToast: React.FC<GameToastProps> = ({
  message,
  duration = 3000,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Allow time for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50
      bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg
      transition-opacity duration-300 flex items-center
      ${visible ? "opacity-90" : "opacity-0"}
    `}
    >
      <div className="mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
};

export default GameToast;
