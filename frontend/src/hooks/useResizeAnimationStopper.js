import { useEffect } from 'react';

const useResizeAnimationStopper = () => {
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      document.body.classList.add('resize-animation-stopper');
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.body.classList.remove('resize-animation-stopper');
      }, 400);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);
};

export default useResizeAnimationStopper;
