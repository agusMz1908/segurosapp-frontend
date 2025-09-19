// src/hooks/usePDFViewer.ts
import { useState, useCallback } from 'react';

export function usePDFViewer() {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const openViewer = useCallback(() => {
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
  }, []);

  const toggleViewer = useCallback(() => {
    setIsViewerOpen(prev => !prev);
  }, []);

  return {
    isViewerOpen,
    openViewer,
    closeViewer,
    toggleViewer
  };
}