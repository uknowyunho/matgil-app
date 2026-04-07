export const lightColors = {
  primary: {
    main: '#E8663D',
    light: '#ED8B6A',
    bg: '#FFF0EB',
  },
  neutral: {
    bg: '#FDFBF7',
    card: '#F5F0E8',
    border: '#E8E0D4',
    textSecondary: '#9C9488',
    textBody: '#4A4540',
    textTitle: '#1C1917',
  },
  semantic: {
    success: '#2D8A56',
    warning: '#D4952B',
    error: '#C93B3B',
    info: '#3B7FC9',
  },
  category: {
    korean: '#E8663D',
    japanese: '#C93B3B',
    chinese: '#D4952B',
    western: '#3B7FC9',
    cafe: '#8B6EC0',
    bar: '#2D8A56',
    snack: '#D46BA3',
    other: '#9C9488',
  },
};

export const darkColors = {
  primary: {
    main: '#ED8B6A',
    light: '#F2A88E',
    bg: '#3D1A0A',
  },
  neutral: {
    bg: '#0C0A09',
    card: '#1C1917',
    border: '#292524',
    textSecondary: '#D1D1D1',
    textBody: '#F5F5F5',
    textTitle: '#FFFFFF',
  },
  semantic: {
    success: '#2D8A56',
    warning: '#D4952B',
    error: '#C93B3B',
    info: '#3B7FC9',
  },
  category: {
    korean: '#E8663D',
    japanese: '#C93B3B',
    chinese: '#D4952B',
    western: '#3B7FC9',
    cafe: '#8B6EC0',
    bar: '#2D8A56',
    snack: '#D46BA3',
    other: '#9C9488',
  },
};

export type ColorPalette = typeof lightColors;

export const Colors = {
  light: lightColors,
  dark: darkColors,
} as const;
