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
  linenBg: '#F2F6F4',
  linenSurface: '#FFFFFF',
  linenCard: '#E8EFEA',
  linenBorder: '#D0DDD7',
  linenTextPrimary: '#1A2421',
  linenTextSecondary: '#52665E',
  burnishedBrass: '#B8860B',

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
    tint: Palette.burnishedBrass,
    tabIconDefault: Palette.linenTextSecondary,
    tabIconSelected: Palette.burnishedBrass,
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
