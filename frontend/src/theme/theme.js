import { createTheme, alpha } from '@mui/material/styles';

// Dark palette shared with TJ Books: Tailwind sky/cyan on gray-950.
export const colors = {
  primary: {
    main: '#0EA5E9',      // Sky-500
    light: '#38BDF8',     // Sky-400
    dark: '#0369A1',      // Sky-700
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#06B6D4',      // Cyan-500
    light: '#22D3EE',     // Cyan-400
    dark: '#0E7490',      // Cyan-700
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#10B981',      // Emerald-500
    light: '#34D399',     // Emerald-400
    dark: '#047857',      // Emerald-700
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B',      // Amber-500
    light: '#FBBF24',     // Amber-400
    dark: '#B45309',      // Amber-700
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#F43F5E',      // Rose-500
    light: '#FDA4AF',     // Rose-300
    dark: '#BE123C',      // Rose-700
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#38BDF8',      // Sky-400
    light: '#7DD3FC',     // Sky-300
    dark: '#075985',      // Sky-800
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
    950: '#030712',
  },
  background: {
    default: '#030712',    // Gray-950
    paper: '#1F2937',      // Gray-800
    elevated: '#111827',   // Gray-900
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.62)',
    disabled: 'rgba(255, 255, 255, 0.38)',
  },
};

// Reusable surface styles
export const gradients = {
  page: 'linear-gradient(135deg, #030712 0%, #111827 50%, #030712 100%)',
  brand: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
  // Darker brand gradient: keeps white text readable on buttons
  action: 'linear-gradient(135deg, #0369A1 0%, #0E7490 100%)',
};

export const glass = {
  backgroundColor: alpha(colors.grey[800], 0.9),
  border: `1px solid ${colors.grey[700]}`,
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
};

// Status colors for books (all dark enough for white text)
export const statusColors = {
  'to-read': colors.info.dark,
  'reading': colors.warning.dark,
  'read': colors.success.dark,
  'loaned': colors.error.dark,
  'available': colors.info.dark,
};

// Design tokens
export const spacing = {
  cardPadding: 8,
  cardPaddingCompact: 6,
  gridGap: 12,
  gridGapCompact: 8,
  sectionMargin: 16,
  filterBarHeight: 48,
  mobileFilterBarHeight: 44,
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
  bottomNavHeight: 64,
};

const menuPaper = {
  backgroundColor: colors.grey[800],
  border: `1px solid ${colors.grey[700]}`,
  borderRadius: dimensions.cardBorderRadius,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
};

// Create the MUI theme
const theme = createTheme({
  palette: {
    ...colors,
    mode: 'dark',
    divider: colors.grey[700],
    action: {
      active: 'rgba(255, 255, 255, 0.7)',
      hover: alpha(colors.primary.main, 0.12),
      selected: alpha(colors.primary.main, 0.2),
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.08)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.4, letterSpacing: '-0.01em' },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      '@media (max-width:600px)': { fontSize: '1.25rem' },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      '@media (max-width:600px)': { fontSize: '1.125rem' },
    },
    h6: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.5 },
    subtitle1: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 500 },
    subtitle2: { fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { fontWeight: 500, fontSize: '0.875rem', textTransform: 'none', letterSpacing: '0.02em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
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
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.default,
          backgroundImage: gradients.page,
          backgroundAttachment: 'fixed',
          scrollbarColor: `${colors.grey[600]} ${colors.grey[900]}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: colors.grey[900],
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: colors.grey[600],
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: colors.grey[500],
          },
        },
        '::selection': {
          backgroundColor: colors.info.dark,
          color: '#E0F2FE',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'transparent',
      },
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.grey[900], 0.95),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.grey[800]}`,
          color: colors.text.primary,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: dimensions.cardBorderRadius,
          textTransform: 'none',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          background: gradients.action,
          fontWeight: 600,
          boxShadow: `0 10px 15px -3px ${alpha(colors.primary.main, 0.25)}`,
          '&:hover': {
            background: gradients.action,
            opacity: 0.9,
            boxShadow: `0 10px 15px -3px ${alpha(colors.primary.main, 0.35)}`,
          },
          '&.Mui-disabled': {
            background: 'rgba(255, 255, 255, 0.08)',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: colors.grey[700],
          '&:hover': {
            borderColor: colors.grey[500],
          },
        },
        textPrimary: {
          color: colors.primary.light,
        },
        outlinedPrimary: {
          color: colors.primary.light,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: dimensions.cardBorderRadius,
          transition: 'all 0.2s ease-in-out',
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
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: dimensions.chipBorderRadius,
          fontWeight: 500,
        },
        outlined: {
          borderColor: colors.grey[700],
        },
        sizeSmall: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: dimensions.cardBorderRadius,
          backgroundColor: alpha(colors.grey[800], 0.9),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.grey[700],
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.grey[500],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary.main,
            boxShadow: `0 0 0 3px ${alpha(colors.primary.main, 0.2)}`,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.12),
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.grey[700],
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        arrow: {
          color: colors.grey[700],
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.grey[900],
          border: `1px solid ${colors.grey[800]}`,
          borderRadius: 16,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.grey[900],
          borderColor: colors.grey[800],
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
        invisible: {
          backgroundColor: 'transparent',
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
        paper: menuPaper,
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: menuPaper,
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: dimensions.bottomNavHeight,
          backgroundColor: colors.grey[900],
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 0,
          color: colors.grey[400],
          '&.Mui-selected': {
            color: colors.primary.light,
          },
        },
        label: {
          fontSize: '0.6875rem',
          '&.Mui-selected': {
            fontSize: '0.6875rem',
            fontWeight: 600,
          },
        },
      },
    },
  },
});

export default theme;
