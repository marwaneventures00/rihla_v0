import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Language = "en" | "fr";
type Dict = Record<string, string>;

const STORAGE_KEY = "cariva.language";

const translations: Record<Language, Dict> = {
  en: {
    "lang.switch": "FR",
    "brand.tagline": "AI-native career intelligence",
    "nav.pathways": "Compass",
    "nav.market": "Terrain",
    "nav.develop": "Forge",
    "nav.meet": "Meet & Greet",
    "nav.profile": "My Profile",
    "nav.dashboard": "Command",
    "nav.students": "Students",
    "nav.analytics": "Analytics",
    "nav.settings": "Settings",
    "app.studentView": "Student view",
    "app.adminView": "Admin view",
    "app.switchView": "Switch view",
    "app.signOut": "Sign out",
    "landing.cta.start": "Get started free →",
    "landing.cta.universities": "For universities",
    "auth.backHome": "Back to home",
    "auth.student": "Student",
    "auth.universityAdmin": "University admin",
    "auth.getStarted": "Get started",
    "auth.welcomeBack": "Welcome back",
    "auth.createAccount": "Create account",
    "auth.signIn": "Sign in",
    "home.market.title": "Terrain",
    "home.develop.title": "Forge",
    "home.profile.title": "My profile & progress",
    "home.pathways.title": "Your Compass results",
  },
  fr: {
    "lang.switch": "EN",
    "brand.tagline": "Intelligence carrière native IA",
    "nav.pathways": "Compass",
    "nav.market": "Terrain",
    "nav.develop": "Forge",
    "nav.meet": "Meet & Greet",
    "nav.profile": "Mon profil",
    "nav.dashboard": "Command",
    "nav.students": "Étudiants",
    "nav.analytics": "Analytique",
    "nav.settings": "Paramètres",
    "app.studentView": "Vue étudiant",
    "app.adminView": "Vue admin",
    "app.switchView": "Changer de vue",
    "app.signOut": "Se déconnecter",
    "landing.cta.start": "Commencer gratuitement →",
    "landing.cta.universities": "Pour les universités",
    "auth.backHome": "Retour à l'accueil",
    "auth.student": "Étudiant",
    "auth.universityAdmin": "Admin université",
    "auth.getStarted": "Commencer",
    "auth.welcomeBack": "Bon retour",
    "auth.createAccount": "Créer un compte",
    "auth.signIn": "Se connecter",
    "home.market.title": "Terrain",
    "home.develop.title": "Forge",
    "home.profile.title": "Mon profil et ma progression",
    "home.pathways.title": "Résultats Compass",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === "fr" || saved === "en") setLanguageState(saved);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const setLanguage = (lang: Language) => {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
    };
    const toggleLanguage = () => setLanguage(language === "en" ? "fr" : "en");
    const t = (key: string, fallback?: string) => translations[language][key] ?? fallback ?? key;
    return { language, setLanguage, toggleLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
