import React, { useEffect, useState } from 'react';
import './test.css';

const Test = () => {
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'w') {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="jump-container">
      <div className={`box ${isJumping ? 'jump' : ''}`}></div>
    </div>
  );
};

export default Test;
