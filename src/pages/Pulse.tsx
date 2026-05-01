import { useLanguage } from "@/lib/i18n";

export default function Pulse() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);

  return (
    <div className="space-y-4 max-w-4xl px-1 md:px-0">
      <h1 className="text-xl md:text-3xl font-bold">{tr("Briefing", "Briefing")}</h1>
      <p className="text-[13px] md:text-sm text-muted-foreground">
        {tr(
          "Review your week and keep momentum with actionable next steps.",
          "Faites le bilan de votre semaine et maintenez votre elan avec des prochaines etapes concretes.",
        )}
      </p>
    </div>
  );
}
