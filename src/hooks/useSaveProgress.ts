import { useState, useCallback, useRef } from 'react';

/**
 * Hook to handle progress bar simulation logic for save operations.
 * Simulates a realistic progress bar that moves quickly at first,
 * slows down near 90%, and jumps to 100% on completion.
 */
export function useSaveProgress() {
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Starts the saving simulation.
   * Increments progress randomly up to 90%.
   */
  const startSaving = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    setIsSaving(true);
    setProgress(0);
    setIsComplete(false);

    // Simulate progress to 90%
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 90;
        }
        // Random increment for a more "organic" feel
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 90);
      });
    }, 400);
  }, []);

  /**
   * Finishes the saving simulation.
   * Sets progress to 100%, waits for a short delay, then resets states.
   */
  const finishSaving = useCallback((onFinished?: () => void) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setProgress(100);
    setIsComplete(true);

    // Stay on complete for a moment (visual feedback) then cleanup
    setTimeout(() => {
      setIsSaving(false);
      setIsComplete(false);
      setProgress(0);
      if (onFinished) onFinished();
    }, 1500);
  }, []);

  /**
   * Fails the saving simulation and resets all states immediately.
   */
  const failSaving = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSaving(false);
    setProgress(0);
    setIsComplete(false);
  }, []);

  return { 
    isSaving, 
    progress, 
    isComplete, 
    startSaving, 
    finishSaving, 
    failSaving 
  };
}
