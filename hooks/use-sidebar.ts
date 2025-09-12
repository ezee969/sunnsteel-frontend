import { useState, useEffect } from 'react';

export function useSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsSidebarOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    // Set hydrated to true after first render
    setIsHydrated(true);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isMobile: isHydrated ? isMobile : false, // Always return false during SSR
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isHydrated,
  };
}
