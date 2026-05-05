import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function CarButton({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  fullWidth = false,
  size = "md",
  type = "button",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
}) {
  const styles = {
    primary: {
      background: disabled ? "#F0F0F0" : "#C8102E",
      color: disabled ? "#AAAAAA" : "white",
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: "#0A0A0A",
      border: "1.5px solid #0A0A0A",
    },
    ghost: {
      background: "transparent",
      color: "#6B6B6B",
      border: "1.5px solid #E5E5E5",
    },
    danger: {
      background: "transparent",
      color: "#C8102E",
      border: "1.5px solid #FFCDD2",
    },
  } as const;

  const sizes = {
    sm: { padding: "6px 14px", fontSize: "13px" },
    md: { padding: "10px 20px", fontSize: "14px" },
    lg: { padding: "14px 28px", fontSize: "15px" },
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        ...sizes[size],
        borderRadius: "100px",
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        width: fullWidth ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        transition: "all 0.15s ease",
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          (e.target as HTMLElement).style.background = "#A50D26";
          (e.target as HTMLElement).style.transform = "translateY(-1px)";
        }
        if (variant === "ghost" || variant === "secondary") {
          (e.target as HTMLElement).style.background = "#F5F5F5";
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          (e.target as HTMLElement).style.background = "#C8102E";
          (e.target as HTMLElement).style.transform = "translateY(0)";
        }
        if (variant === "ghost" || variant === "secondary") {
          (e.target as HTMLElement).style.background = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}
