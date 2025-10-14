import { Bell, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    
    // Manually save to localStorage since we removed LanguageDetector
    try {
      localStorage.setItem('i18nextLng', newLang);
    } catch (error) {
      console.warn('Failed to save language preference');
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Language selector */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-language-selector"
          >
            <Languages className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">{i18n.language === 'en' ? 'AR' : 'EN'}</span>
          </Button>

          {/* System status indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">{t('systemOnline')}</span>
          </div>
          
          {/* Notification bell */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-muted-foreground hover:text-foreground"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
