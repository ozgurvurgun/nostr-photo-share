import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {useTheme} from '../theme/ThemeProvider';

export type IconName =
  | 'home'
  | 'search'
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
  | 'help';

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
    default:
      return <Svg {...common} />;
  }
}
