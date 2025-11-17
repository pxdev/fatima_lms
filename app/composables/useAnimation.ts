export function useAnimation() {
  const createAnimationClipReveal = (
    direction: 'left' | 'right' | 'top' | 'bottom' = 'left',
    options?: { delay?: number; duration?: number },
  ) => {
    const duration = options?.duration ?? 900;
    const delay = options?.delay ?? 0;

    // Define clip paths based on direction
    let initialClip: string;
    const finalClip = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';

    switch (direction) {
      case 'left':
        initialClip = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
        break;
      case 'right':
        initialClip = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
        break;
      case 'top':
        initialClip = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)';
        break;
      case 'bottom':
        initialClip = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
        break;
      default:
        initialClip = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
    }

    return {
      initial: {
        scale: 0.9,
        clipPath: initialClip,
      },

      visibleOnce: {
        scale: 1,
        clipPath: finalClip,
        transition: {
          duration,
          delay,
        },
      },
    };
  };

  const createFadeInWithTransform = (
    direction: 'up' | 'down' = 'up',
    options?: { delay?: number; duration?: number; distance?: number },
  ) => {
    const duration = options?.duration ?? 800;
    const delay = options?.delay ?? 0;
    const distance = options?.distance ?? 50;

    // Calculate Y transform value based on direction
    const initialY = direction === 'up' ? distance : -distance;

    return {
      initial: {
        opacity: 0,
        y: initialY,
      },

      visibleOnce: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: 'easeOut',
        },
      },
    };
  };

  return {
    createAnimationClipReveal,
    createFadeInWithTransform,
  };
}
