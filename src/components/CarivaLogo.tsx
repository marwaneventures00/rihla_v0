type CarivaLogoProps = {
  className?: string;
  withTile?: boolean;
};

export default function CarivaLogo({ className = "w-5 h-5", withTile = false }: CarivaLogoProps) {
  const logo = (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10.85" y="4" width="2.3" height="16" rx="1.15" fill="currentColor" />
      <rect x="4" y="10.85" width="16" height="2.3" rx="1.15" fill="currentColor" />
    </svg>
  );

  if (!withTile) return logo;

  return (
    <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
      {logo}
    </div>
  );
}
