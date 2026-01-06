import { useState, useEffect } from 'react';

export function useScrollPosition() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    // Vérifier position initiale au chargement
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrolled;
}
