import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

/** Keys used by existing `t("a.b.c", fallback)` calls — nested under translation. */
const legacyFr = {
  brand: { tagline: "Intelligence carrière native IA" },
  nav: {
    pathways: "Compass",
    market: "Terrain",
    develop: "Forge",
    meet: "Meet & Greet",
    profile: "Profil",
    dashboard: "Command",
    students: "Étudiants",
    analytics: "Analytique",
    settings: "Paramètres",
    mentor: "Mentor",
    field: "Terrain",
  },
  app: {
    studentView: "Vue étudiant",
    adminView: "Vue admin",
    switchView: "Changer de vue",
    signOut: "Se déconnecter",
  },
  landing: {
    cta: {
      start: "Commencer gratuitement →",
      universities: "Pour les universités",
    },
  },
  auth: {
    backHome: "Retour à l'accueil",
    student: "Étudiant",
    universityAdmin: "Admin université",
    getStarted: "Commencer",
    welcomeBack: "Bon retour",
    createAccount: "Créer un compte",
    signIn: "Se connecter",
  },
  home: {
    market: { title: "Terrain" },
    develop: { title: "Forge" },
    profile: { title: "Mon profil et ma progression" },
    pathways: { title: "Résultats Compass" },
  },
} as const;

const legacyEn = {
  brand: { tagline: "AI-native career intelligence" },
  nav: {
    pathways: "Compass",
    market: "Terrain",
    develop: "Forge",
    meet: "Meet & Greet",
    profile: "Profile",
    dashboard: "Command",
    students: "Students",
    analytics: "Analytics",
    settings: "Settings",
    mentor: "Mentor",
  },
  app: {
    studentView: "Student view",
    adminView: "Admin view",
    switchView: "Switch view",
    signOut: "Sign out",
  },
  landing: {
    cta: {
      start: "Get started free →",
      universities: "For universities",
    },
  },
  auth: {
    backHome: "Back to home",
    student: "Student",
    universityAdmin: "University admin",
    getStarted: "Get started",
    welcomeBack: "Welcome back",
    createAccount: "Create account",
    signIn: "Sign in",
  },
  home: {
    market: { title: "Terrain" },
    develop: { title: "Forge" },
    profile: { title: "My profile & progress" },
    pathways: { title: "Your Compass results" },
  },
} as const;

const resources = {
  fr: {
    translation: {
      ...legacyFr,
      nav: {
        ...legacyFr.nav,
        learn: "Apprendre",
        forge: "Forge",
        pipeline: "Pipeline",
        trends: "Tendances",
      },
      learn: {
        path: {
          title: "Découverte",
          subtitle: "Découvre qui tu es professionnellement",
          start: "Commencer la conversation",
          confidence_score: "Score de confiance",
          send: "Envoyer",
          buildingReport: "Construction de ton rapport...",
          closingNarrativeFallback:
            "Merci pour ces échanges. J'ai une image plus claire de qui tu es. Laisse-moi construire ton rapport.",
        },
        skills: {
          title: "Préparation",
          subtitle: "Prépare-toi pour décrocher le poste",
          locked: "Débloque avec un score Path > 75%",
        },
        hub: {
          section1: "SECTION 1",
          pathTitle: "Path",
          section2: "SECTION 2",
          skillsTitle: "Skills",
          scoreFraction: "{{score}}/100",
          fallbackTrack: "Parcours carrière",
          meetMentorTitle: "Meet Mentor",
          meetMentorSubtitle: "Start a conversation to discover your career archetypes",
          startConversation: "Start conversation →",
          continueTitle: "Continue with Mentor",
          continueCta: "Continue →",
          archetypePreviewTitle: "Aperçu des archétypes",
          viewFullReport: "View full report →",
          skillsLockedTitle: "Complete Path to unlock Skills",
          skillsLockedNeed: "{{current}}/75 requis",
          activeTrack: "Parcours actif",
          progressLabel: "Progression",
          cardCasesTitle: "Cas business",
          cardCasesDesc: "Entraîne-toi sur des cas réalistes.",
          cardEdgeTitle: "Edge",
          cardEdgeDesc: "Veille marché et briefings.",
          cardInternTitle: "Stage virtuel",
          cardInternDesc: "Explore le terrain et les rôles.",
          cardResourcesTitle: "Ressources",
          cardResourcesDesc: "Cours et liens sélectionnés pour toi.",
          pathPlaceholderTitle: "Conversation Path",
          pathPlaceholderBody: "Le flux Mentor guidé arrive bientôt.",
          reportPlaceholderTitle: "Rapport d'archétypes",
          reportPlaceholderBody: "Vue détaillée de ton profil professionnel.",
          backToLearn: "Retour au hub",
          skillsPreviewLine1: "Cas, entretiens et ressources personnalisés",
          skillsPreviewLine2: "dès que ton score Path atteint 75.",
        },
      },
      mentor: {
        greeting: "Salut {{name}}. Je suis Mentor — ton advisor Cariva.",
        thinking: "Mentor réfléchit...",
        placeholder: "Réponds à Mentor...",
      },
      common: {
        loading: "Chargement...",
        save: "Sauvegarder",
        back: "Retour",
        next: "Suivant",
        start: "Commencer",
        complete: "Terminé",
        locked: "Verrouillé",
        score: "Score",
        match: "correspondance",
        recommended: "Recommandé pour toi",
        powered_by: "Propulsé par l'IA",
      },
      page: {
        pulse: "Veille",
        learnPath: "Path",
        learnReport: "Rapport",
      },
    },
  },
  en: {
    translation: {
      ...legacyEn,
      nav: {
        ...legacyEn.nav,
        learn: "Learn",
        forge: "Forge",
        pipeline: "Pipeline",
        trends: "Trends",
      },
      learn: {
        path: {
          title: "Discovery",
          subtitle: "Discover who you are professionally",
          start: "Start the conversation",
          confidence_score: "Confidence score",
          send: "Send",
          buildingReport: "Building your report...",
          closingNarrativeFallback:
            "Thanks for sharing. I have a clearer picture of who you are. Let me build your report.",
        },
        skills: {
          title: "Preparation",
          subtitle: "Prepare to land the job",
          locked: "Unlock with a Path score > 75%",
        },
        hub: {
          section1: "SECTION 1",
          pathTitle: "Path",
          section2: "SECTION 2",
          skillsTitle: "Skills",
          scoreFraction: "{{score}}/100",
          fallbackTrack: "Career track",
          meetMentorTitle: "Meet Mentor",
          meetMentorSubtitle: "Start a conversation to discover your career archetypes",
          startConversation: "Start conversation →",
          continueTitle: "Continue with Mentor",
          continueCta: "Continue →",
          archetypePreviewTitle: "Archetype preview",
          viewFullReport: "View full report →",
          skillsLockedTitle: "Complete Path to unlock Skills",
          skillsLockedNeed: "{{current}}/75 required",
          activeTrack: "Active track",
          progressLabel: "Progress",
          cardCasesTitle: "Cases",
          cardCasesDesc: "Practice realistic business cases.",
          cardEdgeTitle: "Edge",
          cardEdgeDesc: "Market pulse and briefings.",
          cardInternTitle: "Virtual internship",
          cardInternDesc: "Explore roles and the job market.",
          cardResourcesTitle: "Resources",
          cardResourcesDesc: "Curated courses and links for you.",
          pathPlaceholderTitle: "Path conversation",
          pathPlaceholderBody: "Guided Mentor flow is coming soon.",
          reportPlaceholderTitle: "Archetype report",
          reportPlaceholderBody: "Detailed view of your professional profile.",
          backToLearn: "Back to hub",
          skillsPreviewLine1: "Cases, interviews, and tailored resources",
          skillsPreviewLine2: "unlock when your Path score reaches 75.",
        },
      },
      mentor: {
        greeting: "Hey {{name}}. I'm Mentor — your Cariva advisor.",
        thinking: "Mentor is thinking...",
        placeholder: "Reply to Mentor...",
      },
      common: {
        loading: "Loading...",
        save: "Save",
        back: "Back",
        next: "Next",
        start: "Start",
        complete: "Complete",
        locked: "Locked",
        score: "Score",
        match: "match",
        recommended: "Recommended for you",
        powered_by: "Powered by AI",
      },
      page: {
        pulse: "Briefing",
        learnPath: "Path",
        learnReport: "Report",
      },
    },
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr",
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
