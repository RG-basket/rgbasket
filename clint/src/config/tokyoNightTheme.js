// Tokyo Night Theme Configuration
export const tokyoNight = {
    // Background Colors
    bg: {
        primary: '#1a1b26',      // Main background
        secondary: '#24283b',    // Cards, sidebar
        elevated: '#414868',     // Hover states
        input: '#1f2335',        // Input backgrounds
    },

    // Border Colors
    border: {
        primary: '#565f89',      // Main borders
        secondary: '#414868',    // Subtle borders
        focus: '#7aa2f7',        // Focus rings
    },

    // Text Colors
    text: {
        primary: '#c0caf5',      // Main text
        secondary: '#9aa5ce',    // Muted text
        disabled: '#565f89',     // Disabled text
        inverse: '#1a1b26',      // Text on light backgrounds
    },

    // Accent Colors
    accent: {
        blue: '#7aa2f7',         // Primary actions
        green: '#9ece6a',        // Success
        yellow: '#e0af68',       // Warning
        red: '#f7768e',          // Error
        cyan: '#7dcfff',         // Info
        purple: '#bb9af7',       // Special
        orange: '#ff9e64',       // Highlight
    },

    // Status Colors
    status: {
        success: '#9ece6a',
        warning: '#e0af68',
        error: '#f7768e',
        info: '#7dcfff',
    },

    // Chart Colors
    chart: {
        primary: '#7aa2f7',
        secondary: '#bb9af7',
        tertiary: '#7dcfff',
        quaternary: '#9ece6a',
        gradient: ['#7aa2f7', '#bb9af7'],
    }
};

// Tailwind class helpers
export const tw = {
    // Backgrounds
    bgPrimary: 'bg-[#1a1b26]',
    bgSecondary: 'bg-[#24283b]',
    bgElevated: 'bg-[#414868]',
    bgInput: 'bg-[#1f2335]',

    // Borders
    borderPrimary: 'border-[#565f89]',
    borderSecondary: 'border-[#414868]',

    // Text
    textPrimary: 'text-[#c0caf5]',
    textSecondary: 'text-[#9aa5ce]',
    textDisabled: 'text-[#565f89]',

    // Accents
    accentBlue: 'text-[#7aa2f7]',
    accentGreen: 'text-[#9ece6a]',
    accentYellow: 'text-[#e0af68]',
    accentRed: 'text-[#f7768e]',
    accentCyan: 'text-[#7dcfff]',
    accentPurple: 'text-[#bb9af7]',

    // Background Accents
    bgBlue: 'bg-[#7aa2f7]',
    bgGreen: 'bg-[#9ece6a]',
    bgYellow: 'bg-[#e0af68]',
    bgRed: 'bg-[#f7768e]',
    bgCyan: 'bg-[#7dcfff]',
    bgPurple: 'bg-[#bb9af7]',

    // Hover states
    hoverElevated: 'hover:bg-[#414868]',
    hoverBlue: 'hover:bg-[#7aa2f7]/10',

    // Focus states
    focusRing: 'focus:ring-2 focus:ring-[#7aa2f7] focus:ring-offset-2 focus:ring-offset-[#1a1b26]',
};

export default tokyoNight;
