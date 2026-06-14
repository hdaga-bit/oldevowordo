import { getModeAccent } from "../../config/mode-branding";

const SIZE = {
  pin: "h-8 w-8",
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20 md:h-24 md:w-24",
  xl: "h-28 w-28 md:h-32 md:w-32",
};

/**
 * Distinctive mode logos — icon-only identity (no text).
 */
export default function ModeMark({ mode, size = "lg", className = "" }) {
  const accent = getModeAccent(mode);
  const sizeClass = SIZE[size] ?? SIZE.lg;

  const sharedProps = {
    className: `${sizeClass} ${className}`.trim(),
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    role: "img",
    "aria-hidden": true,
  };

  switch (mode) {
    case "duel":
      return (
        <svg {...sharedProps}>
          <circle cx="32" cy="32" r="30" fill={accent} fillOpacity="0.18" />
          <circle cx="32" cy="32" r="30" stroke={accent} strokeWidth="2" strokeOpacity="0.55" />

          {/* VS only */}
          <text
            x="33.5"
            y="37"
            textAnchor="middle"
            fill={accent}
            fillOpacity="0.85"
            fontSize="22"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.06em"
          >
            VS
          </text>
          <text
            x="31.5"
            y="35"
            textAnchor="middle"
            fill="#fafafa"
            fontSize="22"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.06em"
            stroke={accent}
            strokeWidth="0.65"
            paintOrder="stroke fill"
          >
            VS
          </text>
        </svg>
      );

    case "battle":
      return (
        <svg {...sharedProps}>
          <circle cx="32" cy="32" r="30" fill={accent} fillOpacity="0.18" />
          <circle cx="32" cy="32" r="30" stroke={accent} strokeWidth="2" strokeOpacity="0.55" />

          {/* Podium + trophy — solid silhouette */}
          <g fill={accent}>
            <rect x="11" y="38" width="12" height="13" rx="0.5" />
            <rect x="25" y="30" width="14" height="21" rx="0.5" />
            <rect x="41" y="42" width="12" height="9" rx="0.5" />
            <path d="M27 18.5c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5v2.2H27v-2.2z" />
            <path d="M24.2 20.8c-1.4-1-1-3.2 0.6-3.8 1.2-.5 2.2.4 2.4 1.6l-3 2.2z" />
            <path d="M39.8 20.8c1.4-1 1-3.2-0.6-3.8-1.2-.5-2.2.4-2.4 1.6l3 2.2z" />
            <rect x="29.5" y="27" width="5" height="2.5" rx="0.5" />
            <rect x="27.5" y="29.5" width="9" height="2" rx="0.5" />
          </g>
          {/* Block separators */}
          <rect x="23.25" y="30" width="1.5" height="21" fill="#0b0c0e" fillOpacity="0.55" rx="0.25" />
          <rect x="39.25" y="30" width="1.5" height="21" fill="#0b0c0e" fillOpacity="0.55" rx="0.25" />
          <rect x="39.25" y="42" width="1.5" height="9" fill="#0b0c0e" fillOpacity="0.55" rx="0.25" />
        </svg>
      );

    case "battle_ai":
      return (
        <svg {...sharedProps}>
          <circle cx="32" cy="32" r="30" fill={accent} fillOpacity="0.18" />
          <circle cx="32" cy="32" r="30" stroke={accent} strokeWidth="2" strokeOpacity="0.55" />
          <rect
            x="18"
            y="20"
            width="28"
            height="24"
            rx="6"
            fill={accent}
            fillOpacity="0.85"
          />
          <circle cx="26" cy="30" r="3" fill="#fafafa" />
          <circle cx="38" cy="30" r="3" fill="#fafafa" />
          <path
            d="M26 38H38"
            stroke="#0b0c0e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
          <path
            d="M44 16L48 10L54 14L50 22L44 20L44 16Z"
            fill="#fafafa"
          />
          <path
            d="M46 12V18"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "shared":
      return (
        <svg {...sharedProps}>
          <circle cx="32" cy="32" r="30" fill={accent} fillOpacity="0.18" />
          <circle cx="32" cy="32" r="30" stroke={accent} strokeWidth="2" strokeOpacity="0.55" />
          <rect
            x="14"
            y="18"
            width="16"
            height="28"
            rx="3"
            stroke={accent}
            strokeWidth="2.5"
            fill={accent}
            fillOpacity="0.35"
          />
          <rect
            x="34"
            y="18"
            width="16"
            height="28"
            rx="3"
            stroke="#fafafa"
            strokeWidth="2.5"
            fill="#fafafa"
            fillOpacity="0.12"
          />
          <path
            d="M30 28H34M30 32H34M30 36H34"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="32" cy="32" r="4" fill={accent} />
        </svg>
      );

    case "daily":
      return (
        <svg {...sharedProps}>
          <circle cx="32" cy="32" r="30" fill={accent} fillOpacity="0.18" />
          <circle cx="32" cy="32" r="30" stroke={accent} strokeWidth="2" strokeOpacity="0.55" />
          <rect
            x="16"
            y="18"
            width="32"
            height="30"
            rx="4"
            stroke={accent}
            strokeWidth="2.5"
            fill={accent}
            fillOpacity="0.25"
          />
          <path d="M16 26H48" stroke={accent} strokeWidth="2" />
          <circle cx="24" cy="36" r="3" fill={accent} />
          <circle cx="32" cy="40" r="3" fill="#fafafa" />
          <circle cx="40" cy="34" r="3" fill={accent} fillOpacity="0.6" />
        </svg>
      );

    default:
      return (
        <svg {...sharedProps}>
          <circle cx="32" cy="32" r="28" stroke={accent} strokeWidth="2" />
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fill={accent}
            fontSize="20"
            fontWeight="bold"
          >
            ?
          </text>
        </svg>
      );
  }
}
