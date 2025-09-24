import { createTheme, alpha } from '@mui/material/styles';

// Modern color palette - Inspired by modern reading apps with a sophisticated feel
export const colors = {
  primary: {
    main: '#6366F1',      // Indigo-500 - Modern purple-blue
    light: '#818CF8',     // Indigo-400
    dark: '#4F46E5',      // Indigo-600
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#EC4899',      // Pink-500 - Accent color
    light: '#F472B6',     // Pink-400
    dark: '#DB2777',      // Pink-600
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#10B981',      // Emerald-500
    light: '#34D399',     // Emerald-400
    dark: '#059669',      // Emerald-600
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B',      // Amber-500
    light: '#FBBF24',     // Amber-400
    dark: '#D97706',      // Amber-600
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444',      // Red-500
    light: '#F87171',     // Red-400
    dark: '#DC2626',      // Red-600
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#3B82F6',      // Blue-500
    light: '#60A5FA',     // Blue-400
    dark: '#2563EB',      // Blue-600
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  background: {
    default: '#F9FAFB',    // Very light grey
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#111827',     // Grey-900
    secondary: '#6B7280',   // Grey-500
    disabled: '#9CA3AF',    // Grey-400
  },
};

// Status colors for books
export const statusColors = {
  'to-read': colors.info.main,
  'reading': colors.warning.main,
  'read': colors.success.main,
  'loaned': colors.error.main,
  'available': colors.info.main,
};

// Design tokens
export const spacing = {
  cardPadding: 12,
  cardPaddingCompact: 8,  // NEW - for compact mode
  gridGap: 16,
  gridGapCompact: 12,  // NEW - for compact mode
  sectionMargin: 24,
  filterBarHeight: 64,
  mobileFilterBarHeight: 56,
};

// Card size configuration
export const cardSizes = {
  compact: {
    minWidth: 120,
    maxWidth: 140,
  },
  normal: {
    minWidth: 160,
    maxWidth: 200,
  }
};

export const dimensions = {
  bookCoverAspectRatio: 2 / 3,  // Standard book ratio
  cardBorderRadius: 12,
  smallBorderRadius: 8,
  chipBorderRadius: 16,
};

// Create the MUI theme
const theme = createTheme({
  palette: {
    ...colors,
    mode: 'light',
    divider: colors.grey[200],
    action: {
      active: colors.grey[600],
      hover: alpha(colors.primary.main, 0.08),
      selected: alpha(colors.primary.main, 0.12),
      disabled: colors.grey[300],
      disabledBackground: colors.grey[100],
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem',
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: dimensions.cardBorderRadius,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 2px 4px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 6px 8px rgba(0, 0, 0, 0.1), 0px 3px 4px rgba(0, 0, 0, 0.06)',
    '0px 8px 10px rgba(0, 0, 0, 0.1), 0px 4px 5px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.06)',
    '0px 12px 18px rgba(0, 0, 0, 0.1), 0px 5px 8px rgba(0, 0, 0, 0.06)',
    '0px 14px 21px rgba(0, 0, 0, 0.1), 0px 6px 10px rgba(0, 0, 0, 0.06)',
    '0px 16px 24px rgba(0, 0, 0, 0.1), 0px 6px 12px rgba(0, 0, 0, 0.06)',
    '0px 18px 28px rgba(0, 0, 0, 0.12), 0px 7px 14px rgba(0, 0, 0, 0.08)',
    '0px 20px 32px rgba(0, 0, 0, 0.12), 0px 8px 16px rgba(0, 0, 0, 0.08)',
    '0px 24px 38px rgba(0, 0, 0, 0.14), 0px 9px 18px rgba(0, 0, 0, 0.08)',
    '0px 28px 44px rgba(0, 0, 0, 0.14), 0px 10px 20px rgba(0, 0, 0, 0.08)',
    '0px 32px 50px rgba(0, 0, 0, 0.14), 0px 12px 22px rgba(0, 0, 0, 0.08)',
    '0px 36px 56px rgba(0, 0, 0, 0.16), 0px 14px 24px rgba(0, 0, 0, 0.08)',
    '0px 40px 62px rgba(0, 0, 0, 0.16), 0px 16px 26px rgba(0, 0, 0, 0.08)',
    '0px 44px 68px rgba(0, 0, 0, 0.16), 0px 18px 28px rgba(0, 0, 0, 0.08)',
    '0px 48px 74px rgba(0, 0, 0, 0.18), 0px 20px 30px rgba(0, 0, 0, 0.08)',
    '0px 52px 80px rgba(0, 0, 0, 0.18), 0px 22px 32px rgba(0, 0, 0, 0.08)',
    '0px 56px 86px rgba(0, 0, 0, 0.18), 0px 24px 34px rgba(0, 0, 0, 0.08)',
    '0px 60px 92px rgba(0, 0, 0, 0.20), 0px 26px 36px rgba(0, 0, 0, 0.08)',
    '0px 64px 98px rgba(0, 0, 0, 0.20), 0px 28px 38px rgba(0, 0, 0, 0.08)',
    '0px 68px 104px rgba(0, 0, 0, 0.20), 0px 30px 40px rgba(0, 0, 0, 0.08)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${colors.grey[400]} ${colors.grey[100]}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: colors.grey[400],
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: colors.grey[500],
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: dimensions.smallBorderRadius,
          textTransform: 'none',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: dimensions.cardBorderRadius,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: dimensions.chipBorderRadius,
          fontWeight: 500,
        },
        sizeSmall: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: dimensions.cardBorderRadius,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderWidth: 1.5,
            },
            '&:hover fieldset': {
              borderWidth: 1.5,
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.08),
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.grey[800],
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        arrow: {
          color: colors.grey[800],
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: dimensions.cardBorderRadius,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: dimensions.smallBorderRadius,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: dimensions.smallBorderRadius,
          boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: dimensions.smallBorderRadius,
          boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

export default theme;
