import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {useTheme} from '../theme/ThemeProvider';

export type IconName =
  | 'home'
  | 'search'
  | 'compass'
  | 'plus'
  | 'user'
  | 'heart'
  | 'heartFill'
  | 'comment'
  | 'close'
  | 'chevronLeft'
  | 'settings'
  | 'image'
  | 'relay'
  | 'send'
  | 'help'
  | 'share'
  | 'bookmark'
  | 'bookmarkFill'
  | 'ellipsis'
  | 'sparkle'
  | 'message'
  | 'bell'
  | 'chevronRight'
  | 'key'
  | 'lock'
  | 'bolt'
  | 'check'
  | 'camera'
  | 'copy'
  | 'eye'
  | 'eyeOff'
  | 'grid'
  | 'logout'
  | 'arrowRight'
  | 'music'
  | 'draw'
  | 'sticker'
  | 'wand'
  | 'moon'
  | 'globe';

export type IconProps = {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly accessibilityLabel?: string;
};

/**
 * Lightweight stroke icons (no icon-font dependency). Amber/dark theme friendly.
 */
export function Icon({
  name,
  size = 24,
  color,
  accessibilityLabel,
}: IconProps): React.JSX.Element {
  const theme = useTheme();
  const stroke = color ?? theme.colors.text.primary;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    accessibilityElementsHidden: accessibilityLabel === undefined,
    importantForAccessibility:
      accessibilityLabel === undefined
        ? ('no-hide-descendants' as const)
        : ('yes' as const),
    accessibilityLabel,
  };

  switch (name) {
    case 'home':
      return (
        <Svg {...common}>
          <Path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common}>
          <Circle cx={11} cy={11} r={6.25} stroke={stroke} strokeWidth={1.75} />
          <Path
            d="m16 16 3.5 3.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'compass':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={8.25} stroke={stroke} strokeWidth={1.75} />
          <Path
            d="m14.9 9.1-1.4 4.4-4.4 1.4 1.4-4.4 4.4-1.4Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Path
            d="M12 5v14M5 12h14"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={8} r={3.25} stroke={stroke} strokeWidth={1.75} />
          <Path
            d="M5.5 19.5c1.6-3.2 4-4.75 6.5-4.75s4.9 1.55 6.5 4.75"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...common}>
          <Path
            d="M12 19.25s-6.75-4.2-6.75-9.05A3.7 3.7 0 0 1 12 7.1a3.7 3.7 0 0 1 6.75 3.1C18.75 15.05 12 19.25 12 19.25Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'heartFill':
      return (
        <Svg {...common}>
          <Path
            d="M12 19.25s-6.75-4.2-6.75-9.05A3.7 3.7 0 0 1 12 7.1a3.7 3.7 0 0 1 6.75 3.1C18.75 15.05 12 19.25 12 19.25Z"
            fill={stroke}
            stroke={stroke}
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'comment':
      return (
        <Svg {...common}>
          <Path
            d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3V16.5H5A1.5 1.5 0 0 1 3.5 15V8A1.5 1.5 0 0 1 5 6.5Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...common}>
          <Path
            d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'chevronLeft':
      return (
        <Svg {...common}>
          <Path
            d="M14.5 5.5 8 12l6.5 6.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={3} stroke={stroke} strokeWidth={1.75} />
          <Path
            d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'image':
      return (
        <Svg {...common}>
          <Rect
            x={3.5}
            y={5}
            width={17}
            height={14}
            rx={2}
            stroke={stroke}
            strokeWidth={1.75}
          />
          <Circle cx={9} cy={10} r={1.5} fill={stroke} />
          <Path
            d="m7.5 17 3.2-3.5 2.3 2.2L16 12.5 20 17"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'relay':
      return (
        <Svg {...common}>
          <Path
            d="M5 8.5c2.8-2.8 7.2-2.8 10 0M7.5 11c1.7-1.7 4.3-1.7 6 0"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={15.5} r={1.5} fill={stroke} />
        </Svg>
      );
    case 'send':
      return (
        <Svg {...common}>
          <Path
            d="M4.5 12 19 5l-3.5 14-3.2-5.2L4.5 12Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Path
            d="M12.3 13.8 19 5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'help':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={8.25} stroke={stroke} strokeWidth={1.75} />
          <Path
            d="M9.8 9.6a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.8"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={16.4} r={1} fill={stroke} />
        </Svg>
      );
    case 'share':
      return (
        <Svg {...common}>
          <Path
            d="M12 4.5v9.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path
            d="m8.5 8 3.5-3.5L15.5 8"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6 12.5v4A1.5 1.5 0 0 0 7.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-4"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'bookmark':
      return (
        <Svg {...common}>
          <Path
            d="M7.5 4.5h9A1.5 1.5 0 0 1 18 6v13.5L12 16l-6 3.5V6A1.5 1.5 0 0 1 7.5 4.5Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'bookmarkFill':
      return (
        <Svg {...common}>
          <Path
            d="M7.5 4.5h9A1.5 1.5 0 0 1 18 6v13.5L12 16l-6 3.5V6A1.5 1.5 0 0 1 7.5 4.5Z"
            fill={stroke}
            stroke={stroke}
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'ellipsis':
      return (
        <Svg {...common}>
          <Circle cx={6} cy={12} r={1.45} fill={stroke} />
          <Circle cx={12} cy={12} r={1.45} fill={stroke} />
          <Circle cx={18} cy={12} r={1.45} fill={stroke} />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg {...common}>
          <Path
            d="M12 3.5 13.4 9 19 10.5 13.4 12 12 17.5 10.6 12 5 10.5 10.6 9 12 3.5Z"
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Path
            d="M18.2 15.2 18.8 17.2 20.8 17.8 18.8 18.4 18.2 20.4 17.6 18.4 15.6 17.8 17.6 17.2 18.2 15.2Z"
            stroke={stroke}
            strokeWidth={1.35}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'message':
      return (
        <Svg {...common}>
          <Path
            d="M4.5 6.2h10A1.8 1.8 0 0 1 16.3 8v5.2a1.8 1.8 0 0 1-1.8 1.8H8.2L4.7 17.8V15H4.5A1.8 1.8 0 0 1 2.7 13.2V8A1.8 1.8 0 0 1 4.5 6.2Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Path
            d="M16.2 9.4h3.3A1.6 1.6 0 0 1 21.1 11v4.6a1.6 1.6 0 0 1-1.6 1.6H19v2.2l-2.8-2.2"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...common}>
          <Path
            d="M6.2 16.5h11.6M8 16.5V10.2a4 4 0 1 1 8 0v6.3"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 16.5a2 2 0 0 0 4 0"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path
            d="M12 4.2v1.4"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'chevronRight':
      return (
        <Svg {...common}>
          <Path
            d="M9.5 5.5 16 12l-6.5 6.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'key':
      return (
        <Svg {...common}>
          <Circle cx={8.5} cy={12} r={3.25} stroke={stroke} strokeWidth={1.75} />
          <Path
            d="M11.5 12h8v2.4M16.5 12v2.4"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...common}>
          <Rect
            x={6}
            y={11}
            width={12}
            height={9}
            rx={2}
            stroke={stroke}
            strokeWidth={1.75}
          />
          <Path
            d="M8.5 11V8.2a3.5 3.5 0 0 1 7 0V11"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg {...common}>
          <Path
            d="M13.5 3.5 7 13h5l-1.5 7.5L17.5 11h-5L13.5 3.5Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path
            d="M5.5 12.5 10 17l8.5-9.5"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'camera':
      return (
        <Svg {...common}>
          <Path
            d="M8.2 7.5 9.4 5.8h5.2l1.2 1.7H18a1.7 1.7 0 0 1 1.7 1.7v8A1.7 1.7 0 0 1 18 19H6a1.7 1.7 0 0 1-1.7-1.7v-8A1.7 1.7 0 0 1 6 7.5h2.2Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={13.2} r={2.6} stroke={stroke} strokeWidth={1.75} />
        </Svg>
      );
    case 'copy':
      return (
        <Svg {...common}>
          <Rect
            x={8}
            y={8}
            width={10.5}
            height={12}
            rx={1.6}
            stroke={stroke}
            strokeWidth={1.75}
          />
          <Path
            d="M6 15.5V5.8A1.8 1.8 0 0 1 7.8 4h8.4"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'eye':
      return (
        <Svg {...common}>
          <Path
            d="M3.5 12s3.2-5.5 8.5-5.5S20.5 12 20.5 12s-3.2 5.5-8.5 5.5S3.5 12 3.5 12Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={12} r={2.4} stroke={stroke} strokeWidth={1.75} />
        </Svg>
      );
    case 'eyeOff':
      return (
        <Svg {...common}>
          <Path
            d="M4 5.5 19.5 19"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path
            d="M9.2 8.4A7.4 7.4 0 0 1 12 6.5c5.3 0 8.5 5.5 8.5 5.5a14 14 0 0 1-3.2 3.6M7.1 9.8C4.8 11.2 3.5 12 3.5 12S6.7 17.5 12 17.5c1.1 0 2.1-.2 3-.6"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'grid':
      return (
        <Svg {...common}>
          <Rect x={4} y={4} width={6} height={6} rx={1} stroke={stroke} strokeWidth={1.75} />
          <Rect x={14} y={4} width={6} height={6} rx={1} stroke={stroke} strokeWidth={1.75} />
          <Rect x={4} y={14} width={6} height={6} rx={1} stroke={stroke} strokeWidth={1.75} />
          <Rect x={14} y={14} width={6} height={6} rx={1} stroke={stroke} strokeWidth={1.75} />
        </Svg>
      );
    case 'logout':
      return (
        <Svg {...common}>
          <Path
            d="M10 5.5H7.2A1.7 1.7 0 0 0 5.5 7.2v9.6A1.7 1.7 0 0 0 7.2 18.5H10"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path
            d="M10 12h8.5M15.8 8.8 19.2 12l-3.4 3.2"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'arrowRight':
      return (
        <Svg {...common}>
          <Path
            d="M5 12h13M13.5 6.5 19 12l-5.5 5.5"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'music':
      return (
        <Svg {...common}>
          <Path
            d="M9 18.5V7.2l10-1.7v11.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={7} cy={18.5} r={2.4} stroke={stroke} strokeWidth={1.75} />
          <Circle cx={17} cy={16.8} r={2.4} stroke={stroke} strokeWidth={1.75} />
        </Svg>
      );
    case 'draw':
      return (
        <Svg {...common}>
          <Path
            d="M14.5 5.2 18.8 9.5 9.2 19H4.8v-4.4L14.5 5.2Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Path
            d="M12.8 6.9 17.1 11.2"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'sticker':
      return (
        <Svg {...common}>
          <Path
            d="M6 5.5h8.2L18.5 9.8V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V7A1.5 1.5 0 0 1 6 5.5Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Path
            d="M14 5.8V9.5h3.7"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Path
            d="M8.2 13.2c.8 1.2 1.9 1.8 3.3 1.8s2.5-.6 3.3-1.8"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Circle cx={9.2} cy={11} r={0.9} fill={stroke} />
          <Circle cx={13.8} cy={11} r={0.9} fill={stroke} />
        </Svg>
      );
    case 'wand':
      return (
        <Svg {...common}>
          <Path
            d="M5 19 14.5 9.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path
            d="M15.2 5.2v2.4M13.2 6.4h4M17.8 8.8l1.5 1.5M17.8 11.8l1.5-1.5"
            stroke={stroke}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <Path
            d="M13.2 10.8 16.5 7.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'moon':
      return (
        <Svg {...common}>
          <Path
            d="M15.5 4.8A7.5 7.5 0 1 0 19.2 14 6.2 6.2 0 0 1 15.5 4.8Z"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'globe':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={8.25} stroke={stroke} strokeWidth={1.75} />
          <Path
            d="M3.75 12h16.5M12 3.75c2.4 2.6 2.4 13.9 0 16.5M12 3.75c-2.4 2.6-2.4 13.9 0 16.5"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    default:
      return <Svg {...common} />;
  }
}
