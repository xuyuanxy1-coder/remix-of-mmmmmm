import { useEffect } from 'react';

export const useDisableDevTools = () => {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for developer tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (Chrome DevTools)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J (Chrome Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.keyCode === 74)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C (Chrome Inspect Element)
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (Save Page)
      if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+P (Print)
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.keyCode === 80)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+K (Firefox Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.keyCode === 75)) {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection (optional)
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable drag
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    // Detect DevTools opening
    let devtools = { open: false };
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        devtools.open = true;
      }
    });

    const checkDevTools = setInterval(() => {
      devtools.open = false;
      console.log(element);
      if (devtools.open) {
        // DevTools detected - you can add custom handling here
        console.clear();
      }
    }, 500);

    // Disable console methods
    const disableConsole = () => {
      if (window.console) {
        const noop = () => {};
        window.console.log = noop;
        window.console.info = noop;
        window.console.warn = noop;
        window.console.error = noop;
        window.console.debug = noop;
        window.console.table = noop;
        window.console.trace = noop;
        window.console.group = noop;
        window.console.groupEnd = noop;
        window.console.time = noop;
        window.console.timeEnd = noop;
      }
    };

    disableConsole();
    const consoleInterval = setInterval(disableConsole, 1000);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      clearInterval(checkDevTools);
      clearInterval(consoleInterval);
    };
  }, []);
};
