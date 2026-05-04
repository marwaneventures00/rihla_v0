import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isFR = i18n.language === "fr";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isFR ? "en" : "fr")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "100px",
        border: "1.5px solid #E5E5E5",
        background: "transparent",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        color: "#0A0A0A",
        fontFamily: "Inter, sans-serif",
        transition: "all 0.2s ease",
      }}
    >
      {isFR ? "EN" : "FR"}
    </button>
  );
}
