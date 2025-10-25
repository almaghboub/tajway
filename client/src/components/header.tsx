import { Bell, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { i18n, t } = useTranslation();
  const isMobile = useIsMobile();

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
    <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title section - with padding for mobile hamburger menu */}
        <div className={`${isMobile ? 'ltr:ml-12 rtl:mr-12' : ''}`}>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h2>
          {description && !isMobile && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language selector */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-language-selector"
          >
            <Languages className="w-4 h-4 sm:w-5 sm:h-5 ltr:mr-1 rtl:ml-1" />
            <span className="text-xs sm:text-sm font-medium">{i18n.language === 'en' ? 'AR' : 'EN'}</span>
          </Button>

          {/* System status indicator - hidden on mobile */}
          {!isMobile && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">{t('systemOnline')}</span>
            </div>
          )}
          
          {/* Notification bell */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-muted-foreground hover:text-foreground"
            data-testid="button-notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 ltr:-right-1 rtl:-left-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
