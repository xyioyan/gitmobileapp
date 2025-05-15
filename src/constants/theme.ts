import { StyleSheet } from 'react-native';

export const COLORS = {
  // Primary Palette
  primary: '#4f46e5',       // Main brand color
  primaryDark: '#3b3698',   // Darker shade
  primaryLight: '#8b85f1',  // Lighter shade
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3178c6',
  error: '#ef4444',
  approved: '#3b82f6',
  
  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray50:  '#f9fafb',
gray100: '#f3f4f6',
gray200: '#e5e7eb',
gray300: '#d1d5db',
gray400: '#9ca3af',
gray500: '#6b7280',
gray600: '#4b5563',
gray700: '#374151',
gray800: '#1f2937',
gray900: '#111827',

  
  // Backgrounds
  backgroundLight: '#f9fafb',
  backgroundDark: '#111827',
};


export const SPACING = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
};

export const TYPOGRAPHY = StyleSheet.create({
 heading1: {
  fontSize: 28,
  fontWeight: '700',
  color: COLORS.gray800,
  lineHeight: 36,
},
heading2: {
  fontSize: 22,
  fontWeight: '600',
  color: COLORS.gray800,
  lineHeight: 30,
},
heading3: {
  fontSize: 16,
  fontWeight: '500',
  color: COLORS.gray800,
  lineHeight: 24,
},
heading4: {
  fontSize: 14,
  fontWeight: '500',
  color: COLORS.gray800,
  lineHeight: 20,
},
heading5: {
  fontSize: 13,
  fontWeight: '500',
  color: COLORS.gray800,
  lineHeight: 18,
},
heading6: {
  fontSize: 12,
  fontWeight: '500',
  color: COLORS.gray800,
  lineHeight: 16,
},
  body: {
    fontSize: 16,
    color: COLORS.gray500,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  
  button: {  
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray600,
    marginBottom: SPACING.tiny,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.tiny,
  }
});

export const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  }
};

export const COMPONENTS = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.medium,
    ...SHADOWS.small,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  input: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    padding: SPACING.medium,
    fontSize: 16,
    color: COLORS.gray800,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.medium,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: SPACING.small,
    paddingVertical: 2,
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export const HEADER = {
  height: 56,
  paddingHorizontal: 16,
  backgroundColor: COLORS.primary,
};

export const NAVIGATION = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    shadowColor: 'transparent',
  },
  headerTitle: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.white,
  },
});
export const ANIMATION = {
  timing: {
    quick: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  },
  scale: {
    small: 0.95,
    medium: 0.9,
    large: 0.8,
  }
};

export const FORMS = StyleSheet.create({
  inputLabel: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.tiny,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputSuccess: {
    borderColor: COLORS.success,
  },
  inputDisabled: {
    backgroundColor: COLORS.gray100,
    color: COLORS.gray400,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    marginTop: SPACING.tiny,
  }
});
export const ICON = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
};

export const BORDER_RADIUS = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  full: 100,
};

export const Z_INDEX = {
  dropdown: 100,
  modal: 200,
  toast: 300,
  tooltip: 400,
};
