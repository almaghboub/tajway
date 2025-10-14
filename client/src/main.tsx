import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { DirectionProvider } from "@radix-ui/react-direction";
import App from "./App";
import "./index.css";
import i18n from "./i18n";

function DirectionHandler() {
  const { i18n: i18nInstance } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  // Initialize direction safely after mount
  useEffect(() => {
    // Always start with LTR to prevent iOS Safari initialization bugs
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
    
    // Mark as ready after initial mount
    requestAnimationFrame(() => {
      setIsReady(true);
      
      // Now apply the actual language direction
      const savedLanguage = localStorage.getItem('i18nextLng');
      if (savedLanguage && savedLanguage.startsWith('ar')) {
        i18nInstance.changeLanguage('ar');
      }
    });
  }, [i18nInstance]);

  // Update direction when language changes (after initialization)
  useEffect(() => {
    if (!isReady) return;
    
    const dir = i18nInstance.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18nInstance.language;
  }, [i18nInstance.language, isReady]);

  // Fix iOS Safari viewport height issues
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  const dir = i18nInstance.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <DirectionProvider dir={dir}>
      <App />
    </DirectionProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <DirectionHandler />
  </I18nextProvider>
);
