import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import App from "./App";
import "./index.css";
import i18n from "./i18n";

function DirectionHandler() {
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const dir = i18nInstance.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18nInstance.language;
  }, [i18nInstance.language]);

  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <DirectionHandler />
  </I18nextProvider>
);
