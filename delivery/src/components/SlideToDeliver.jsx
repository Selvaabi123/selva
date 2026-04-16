import { useState, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

export default function SlideToDeliver({ onSlideComplete }) {
  const [slideX, setSlideX] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const containerRef = useRef(null);
  const maxSlide = containerRef.current ? containerRef.current.offsetWidth - 56 - 8 : 0;

  const handleTouchStart = (e) => {
    setIsSliding(true);
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!isSliding) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(touch.clientX - rect.left - 24, rect.width - 56));
    setSlideX(newX);
  };

  const handleTouchEnd = () => {
    setIsSliding(false);
    const threshold = containerRef.current ? containerRef.current.offsetWidth * 0.7 : 0;
    
    if (slideX >= threshold) {
      setSlideX(containerRef.current ? containerRef.current.offsetWidth - 56 - 8 : 0);
      setTimeout(() => {
        onSlideComplete && onSlideComplete();
        setSlideX(0);
      }, 200);
    } else {
      setSlideX(0);
    }
  };

  const handleMouseDown = (e) => {
    setIsSliding(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isSliding) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - 24, rect.width - 56));
    setSlideX(newX);
  };

  const handleMouseUp = () => {
    if (!isSliding) return;
    handleTouchEnd();
    setIsSliding(false);
  };

  return (
    <div 
      ref={containerRef}
      className="slide-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="slide-track">
        <div 
          className="slide-track-fill" 
          style={{ width: `${slideX + 56}px` }}
        />
        <span className="slide-text" style={{ 
          color: slideX > 50 ? '#22c55e' : '#737373',
          transform: `translateX(${Math.min(slideX / 3, 50)}px)`
        }}>
          Slide to Complete
        </span>
      </div>
      
      <div 
        className="slide-thumb"
        style={{ transform: `translateX(${slideX}px)` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}
