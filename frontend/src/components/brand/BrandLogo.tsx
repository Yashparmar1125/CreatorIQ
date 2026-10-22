import React from 'react';
import { Link } from 'react-router';
import logo from '../../assets/logo.png';

type BrandLogoSize = 'sm' | 'md';

const SIZES: Record<BrandLogoSize, { tile: string; text: string }> = {
  sm: { tile: 'h-7 w-7', text: 'text-[15px]' },
  md: { tile: 'h-8 w-8', text: 'text-[18px]' },
};

interface BrandLogoProps {
  /** Tile size of the logo mark. */
  size?: BrandLogoSize;
  /** Show the "CreatorIQ" wordmark next to the mark. */
  showWordmark?: boolean;
  /** When provided the whole lockup becomes a link to this route. */
  to?: string;
  className?: string;
  wordmarkClassName?: string;
  title?: string;
  onClick?: () => void;
}

/**
 * The single CreatorIQ brand lockup used by every page header and footer.
 *
 * Keeping the mark (logo.png in a white rounded tile) and the wordmark in one
 * component guarantees the header logo looks identical on the marketing site,
 * the auth screens, the methodology page and inside the authenticated shell.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  to,
  className = '',
  wordmarkClassName = '',
  title,
  onClick,
}) => {
  const cfg = SIZES[size] ?? SIZES.md;

  const content = (
    <>
      <span
        className={`flex ${cfg.tile} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E0E8] bg-white p-[3px] shadow-[0_1px_2px_rgba(23,23,23,0.06)]`}
      >
        <img src={logo} alt="" className="h-full w-full object-contain" />
      </span>
      {showWordmark && (
        <span
          className={`font-cal-sans ${cfg.text} font-bold tracking-tight text-[#171717] ${wordmarkClassName}`}
        >
          CreatorIQ
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-label="CreatorIQ home"
        title={title}
        onClick={onClick}
        className={`inline-flex items-center gap-2 transition-opacity hover:opacity-80 ${className}`}
      >
        {content}
      </Link>
    );
  }

  return <span className={`inline-flex items-center gap-2 ${className}`}>{content}</span>;
};
