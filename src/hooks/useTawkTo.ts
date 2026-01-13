import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    Tawk_API?: {
      toggle?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      onLoad?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

const TAWK_PROPERTY_ID = '6966670dd7f0511983c59b2c';
const TAWK_WIDGET_ID = '1jes053tk';

export const useTawkTo = () => {
  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById('tawk-script')) {
      return;
    }

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Hide widget by default, user will click to open
    window.Tawk_API.onLoad = function() {
      if (window.Tawk_API?.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    };

    // Create and inject script
    const script = document.createElement('script');
    script.id = 'tawk-script';
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById('tawk-script');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const openChat = useCallback(() => {
    if (window.Tawk_API) {
      if (window.Tawk_API.showWidget) {
        window.Tawk_API.showWidget();
      }
      if (window.Tawk_API.maximize) {
        window.Tawk_API.maximize();
      }
    }
  }, []);

  const closeChat = useCallback(() => {
    if (window.Tawk_API) {
      if (window.Tawk_API.minimize) {
        window.Tawk_API.minimize();
      }
      if (window.Tawk_API.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    }
  }, []);

  const toggleChat = useCallback(() => {
    if (window.Tawk_API?.toggle) {
      window.Tawk_API.toggle();
    } else {
      openChat();
    }
  }, [openChat]);

  return { openChat, closeChat, toggleChat };
};
