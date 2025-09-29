import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import App from "./App";
import "./index.css";
import "./i18n";

function I18nWrapper() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return <App />;
}

createRoot(document.getElementById("root")!).render(<I18nWrapper />);
