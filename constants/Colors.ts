export const Palette = {
  // Deep Cypress (Dark)
  cypressBg: '#0C1513',
  cypressSurface: '#13211D',
  cypressCard: '#192B26',
  cypressBorder: '#233A34',
  cypressTextPrimary: '#EAEFEA',
  cypressTextSecondary: '#8DA499',
  champagneGold: '#D4AF37',

  // Botanical Linen (Light)
  linenBg: '#F0F4F2',
  linenSurface: '#FFFFFF',
  linenCard: '#FFFFFF',
  linenBorder: '#DCE5E0',
  linenTextPrimary: '#14201C',
  linenTextSecondary: '#4D6359',
  burnishedBrass: '#92400E',
  cypressPrimary: '#13211D',
  botanicalEmerald: '#059669',
  tabInactiveLight: '#94A3B8',

  safe: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export default {
  light: {
    text: Palette.linenTextPrimary,
    textSecondary: Palette.linenTextSecondary,
    background: Palette.linenBg,
    surface: Palette.linenSurface,
    card: Palette.linenCard,
    border: Palette.linenBorder,
    tint: Palette.botanicalEmerald,
    tabIconDefault: Palette.tabInactiveLight,
    tabIconSelected: Palette.botanicalEmerald,
  },
  dark: {
    text: Palette.cypressTextPrimary,
    textSecondary: Palette.cypressTextSecondary,
    background: Palette.cypressBg,
    surface: Palette.cypressSurface,
    card: Palette.cypressCard,
    border: Palette.cypressBorder,
    tint: Palette.champagneGold,
    tabIconDefault: Palette.cypressTextSecondary,
    tabIconSelected: Palette.champagneGold,
  },
};
