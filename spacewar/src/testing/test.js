import React, { useEffect, useState } from 'react';
import './test.css';

const Test = () => {
  const [position, setPosition] = useState(0); // Horizontal position
  const [verticalOffset, setVerticalOffset] = useState(0); // Vertical position (height)
  const [isJumping, setIsJumping] = useState(false);
  const [velocity, setVelocity] = useState(0); // Vertical velocity
  const gravity = 1; // Gravity effect
  const jumpPower = 15; // Initial jump velocity
  const moveSpeed = 5; // Horizontal movement speed

  const [keys, setKeys] = useState({}); // Track pressed keys

  // Handle key press and release
  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log(isJumping);
      setKeys((prevKeys) => ({ ...prevKeys, [event.key]: true }));
    };

    const handleKeyUp = (event) => {
      setKeys((prevKeys) => ({ ...prevKeys, [event.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle jumping and movement
  useEffect(() => {
    const handleJumpAndMove = () => {
      // Handle vertical movement (jump)
      setVerticalOffset((prevOffset) => {
        const newOffset = prevOffset + velocity;
        if (newOffset <= 0) {
          // Stop the jump when hitting the ground
          setIsJumping(false);
          setVelocity(0);
          return 0;
        }
        return newOffset;
      });
      setVelocity((prevVelocity) => prevVelocity - gravity); // Apply gravity

      // Handle horizontal movement
      if (keys['a']) {
        setPosition((prevPosition) => Math.max(prevPosition - moveSpeed, 0));
      }
      if (keys['d']) {
        setPosition((prevPosition) => Math.min(prevPosition + moveSpeed, 900));
      }
    };

    const interval = setInterval(handleJumpAndMove, 15);
    return () => clearInterval(interval);
  }, [keys, velocity]);

  // Handle jump start
  useEffect(() => {
    if (keys['w'] && !isJumping) {
      setIsJumping(true);
      console.log('jump : ', isJumping);
      setVelocity(jumpPower); // Apply initial upward jump velocity
    }
  }, [keys, isJumping]);

  return (
    <div className="jump-container">
      <div
        className="box"
        style={{ transform: `translate(${position}px, ${-verticalOffset}px)` }}
      ></div>
    </div>
  );
};

export default Test;
