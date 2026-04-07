import { TextStyle } from 'react-native';

export const Typography = {
  display: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.56,
  },
  title1: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.24,
  },
  title2: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.14,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.24,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.55,
  },
} as const;

// Font family: Use Pretendard if available, otherwise fall back to system font
export const FontFamily = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
} as const;
