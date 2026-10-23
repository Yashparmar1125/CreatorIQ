import React from 'react';

/**
 * Official YouTube Logo (Red rounded rectangle with white solid play triangle).
 */
export const YouTubeLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 28 20"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="YouTube"
  >
    <path
      d="M27.414 3.084A3.46 3.46 0 0 0 24.978.648C22.827.072 14.195.072 14.195.072s-8.632 0-10.783.576A3.46 3.46 0 0 0 .976 3.084C.4 5.235.4 9.728.4 9.728s0 4.493.576 6.644a3.46 3.46 0 0 0 2.436 2.436c2.151.576 10.783.576 10.783.576s8.632 0 10.783-.576a3.46 3.46 0 0 0 2.436-2.436c.576-2.151.576-6.644.576-6.644s0-4.493-.576-6.644z"
      fill="#FF0000"
    />
    <path d="M11.432 13.882V5.574l7.26 4.154-7.26 4.154z" fill="#FFFFFF" />
  </svg>
);

/**
 * Official Google Calendar Logo (Authentic Google 4-color Workspace icon with 31).
 */
export const GoogleCalendarLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Google Calendar"
  >
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M38 12H10C7.79 12 6 13.79 6 16V36C6 38.21 7.79 40 10 40H38C40.21 40 42 38.21 42 36V16C42 13.79 40.21 12 38 12Z" fill="#FFFFFF" />
    {/* Blue Top Header */}
    <path d="M38 8H10C6.686 8 4 10.686 4 14V17H44V14C44 10.686 41.314 8 38 8Z" fill="#4285F4" />
    {/* Hanging binder pins */}
    <rect x="12" y="5" width="4" height="6" rx="2" fill="#1967D2" />
    <rect x="32" y="5" width="4" height="6" rx="2" fill="#1967D2" />
    {/* Border accents */}
    <path d="M4 17H44V38C44 41.314 41.314 44 38 44H10C6.686 44 4 41.314 4 38V17Z" stroke="#E5E0E8" strokeWidth="1.5" />
    <path d="M4 35V38C4 41.314 6.686 44 10 44H14V35H4Z" fill="#FBBC04" />
    <path d="M14 44H34V35H14V44Z" fill="#34A853" />
    <path d="M34 44H38C41.314 44 44 41.314 44 38V35H34V44Z" fill="#EA4335" />
    {/* Centered bold 31 */}
    <text
      x="24"
      y="31"
      textAnchor="middle"
      fontSize="15"
      fontWeight="800"
      fill="#1A73E8"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      31
    </text>
  </svg>
);

/**
 * Official Notion Logo (Authentic monochrome block N icon).
 */
export const NotionLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Notion"
  >
    <path
      d="M6.3 12.8C8 14.8 9.5 15 13.9 14.7L82.8 9.8c3.5-.3 4.8-1.5 3.3-3.6L80.9 2C79.6.2 77.4 0 74 0H9.5C5.8 0 3.8.8 2.2 2.5L.2 4.8c-1.5 1.8-.8 3.5 1.5 5.5l4.6 2.5zm4.8 13.3c-2.3 0-3.3 1.3-3.3 3.5v60.1c0 3.8 2 5.8 6.3 6.3l69.8 4c4 .3 6-1.5 6-5.5V30.6c0-3.5-1.5-5-5-5L11.1 26.1zm59.6 10.3c.5 0 .8.3 1 .8l.8 5.3c0 .5-.3.8-.8 1l-3 1c-1.5.5-2.3 1.5-2.3 3.5v32.6c0 2.5 1 3.5 3.3 3.8l3 .3c.5 0 .8.5.8 1l-.5 4.8c-.3.5-.8.5-1.3.5l-14.8-.8c-.5 0-.8-.3-1-.8l-.8-5.3c0-.5.3-.8.8-1l2.5-.5c1.5-.3 2-1.3 2-3.3V52.1L45.4 83.2c-1 1.5-2.3 2.3-4.3 2.3h-4.3c-.5 0-.8-.5-.8-1l.5-4.8c.3-.5.8-.5 1.3-.5l2.8-.3c1.5-.3 2.3-1.3 2.3-3.8V44.3c0-2.3-1-3.3-3.3-3.5l-2.8-.5c-.5 0-.8-.3-.8-.8l.8-5.3c0-.5.5-.8 1-.8l13.8.8c.5 0 .8.3 1 .8l.8 5.3c0 .5-.3.8-.8 1l-2.5.5c-1.5.3-2 1.3-2 3.3v24.6l17.8-28.9c1-1.5 2.5-2.3 4.3-2.3l4.5.3z"
      fill="#000000"
    />
  </svg>
);

/**
 * Official Google Drive Logo (3-color triangle).
 */
export const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 87.3 78"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Google Drive"
  >
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z" fill="#ea4335" />
    <path d="M43.65 25h27.5c0-1.55-.4-3.1-1.2-4.5l-3.85-6.65c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#00832d" />
    <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
  </svg>
);

/**
 * Knowledge Vault Composite Logo (Notion & Google Drive).
 */
export const KnowledgeVaultLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <NotionLogo className="h-full w-full" />
  </div>
);
