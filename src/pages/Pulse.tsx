import { useLanguage } from "@/lib/i18n";

export default function Pulse() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-3xl font-bold">{tr("Weekly Pulse", "Pulse Hebdomadaire")}</h1>
      <p className="text-muted-foreground">
        {tr(
          "Review your week and keep momentum with actionable next steps.",
          "Faites le bilan de votre semaine et maintenez votre elan avec des prochaines etapes concretes.",
        )}
      </p>
    </div>
  );
}
