export default {
  tabs: {
    dashboard: 'Home',
    history: 'Transactions',
    wallets: 'Accounts',
    settings: 'Settings'
  },
  settings: {
    title: 'Settings',
    sections: {
      financial: 'Financial & Engine Preferences',
      appearance: 'Appearance & Language',
      notifications: 'Notifications & Reminders',
      data: 'Data & Backup',
      about: 'About App'
    },
    currency: {
      title: 'Main Currency',
      desc: 'Base currency for all tracking and estimates',
      modalTitle: 'Select Main Currency',
      modalSubtitle: 'Base currency for all tracking and engine projections',
    },
    payday: {
      title: 'Payday Cycle Day',
      desc: 'Monthly payday for safe daily spend calculations',
      valueFormat: 'Day {day} of every month',
      modalTitle: 'Select Payday Cycle',
      modalSubtitle: 'Used to calculate daily safe spend limit',
    },
    burnWindow: {
      title: 'Spending Tracking Window',
      desc: 'Number of days to calculate average daily spend',
      days: '{days} Days',
      hint7: '⚡ Responsive — Ideal if you are strictly cutting budget and want fast results.',
      hint14: '⚖️ Balanced (Recommended) — Dampens weekend spikes for calm projections.',
      hint30: '🛡️ Stable — Long-term projection resilient to temporary fluctuations.',
    },
    burnWindowExplainer: {
      title: 'Spending Analysis Window',
      subtitle: 'Choose the timeframe that best reflects your habits and financial stability',
      days7: {
        title: '7 Days (Responsive / Fast)',
        desc: 'Considers only expenses within the past 7 days.',
        pros: 'Pros: Swiftly adapts if you are actively tightening your budget and cutting costs.',
        cons: 'Cons: Highly sensitive to weekend spikes or one-off grocery shopping.',
      },
      days14: {
        title: '14 Days (Balanced / Recommended)',
        desc: 'Blends two weekend cycles for a balanced and realistic baseline.',
        pros: 'Pros: Smoothes out weekend spikes while remaining responsive to lifestyle adjustments.',
        cons: 'Cons: Requires 1-2 weeks before budget cuts reflect clearly on your runway.',
      },
      days30: {
        title: '30 Days (Stable / Long-term)',
        desc: 'Captures a full monthly cycle including beginning-of-month and end-of-month variations.',
        pros: 'Pros: Highly resilient against temporary fluctuations or emotional impulse purchases.',
        cons: 'Cons: Slower to react when you make significant, immediate adjustments to your spending.',
      },
    },
    fallbackBurn: {
      title: 'Initial Spending Estimate',
      desc: 'Temporary baseline when transaction history is under 5 days',
      modalTitle: 'Edit Initial Spending Estimate',
      modalSubtitle: 'Temporary baseline when transaction history is under 5 days',
      presets: 'Quick Presets',
      inputPlaceholder: 'Enter daily amount',
      save: 'Save Estimate',
    },
    dualRunway: {
      title: 'Include Emergency Savings',
      desc: 'See how long cash lasts if savings vaults are also utilized'
    },
    language: {
      title: 'App Language',
      desc: 'Choose interface display language',
      auto: 'Auto',
      id: 'ID',
      en: 'EN',
      autoHint: 'Follows device system language preference.',
      idHint: 'Indonesian (Bahasa Indonesia) is active.',
      enHint: 'English is active.',
    },
    theme: {
      title: 'Color Mode',
      desc: 'Select interface color scheme',
      auto: 'Auto',
      light: 'Light',
      dark: 'Dark',
      autoHint: 'Follows device system theme preference.',
      lightHint: 'Light theme (Botanical Linen) active.',
      darkHint: 'Dark theme (Deep Cypress) active.',
    },
    privacy: {
      title: 'Privacy Mode',
      desc: 'Mask balance numbers on public screens'
    },
    notificationHour: {
      title: 'Daily Reminder Time',
      desc: 'Nightly personal finance reflection reminder',
      format: '{hour}:00'
    },
    exportCsv: {
      title: 'Export Transactions to CSV',
      desc: 'Download all mutation records for archive or analysis',
      button: 'Export CSV File',
      exporting: 'Preparing CSV...',
      success: 'CSV file exported successfully!',
      noData: 'No transaction history to export.'
    },
    resetDemo: {
      title: 'Reload Demo Data',
      desc: 'Restore sample simulation wallets and transactions',
      button: 'Reload Demo',
      confirmTitle: 'Reload Demo Data?',
      confirmDesc: 'All current transactions will be replaced with sample simulation data.',
      confirmButton: 'Yes, Reload Demo'
    },
    clearData: {
      title: 'Clear All Transactions',
      desc: 'Wipe all transaction history and start fresh from zero',
      button: 'Clear History',
      confirmTitle: 'Clear All Transactions?',
      confirmDesc: 'This action is permanent. All transaction mutations will be removed and wallet balances zeroed out.',
      confirmButton: 'Permanently Clear'
    },
    aboutInfo: {
      version: 'App Version',
      storage: 'Storage',
      storageDesc: 'Local First (SQLite WAL On-Device)',
      tagline: 'Financial Survival & Daily Cash Runway'
    }
  },
  explainer: {
    title: 'Spending Tracking Window',
    subtitle: 'Pros & Cons of Window Options',
    howItWorks: 'The engine averages your daily non-fixed expenses across your selected time window to project how many days your cash will last.',
    option7Title: '7 Days (Most Responsive)',
    option7Pros: 'Quickly captures new frugality habits or sudden lifestyle shifts.',
    option7Cons: 'Runway days can fluctuate simply from weekend eating out or groceries.',
    option7Fit: 'Best if you are on a strict savings sprint and want day-by-day feedback.',
    option14Title: '14 Days (Balanced & Standard)',
    option14Badge: 'Recommended',
    option14Pros: 'Absorbs normal weekend spikes while keeping track of current trends.',
    option14Cons: 'A new lifestyle shift takes 1-2 weeks to fully reflect in the runway indicator.',
    option14Fit: 'The sweet spot for everyday routines for most people.',
    option30Title: '30 Days (Most Stable)',
    option30Pros: 'Calm and steady runway projection that avoids panic swings.',
    option30Cons: 'Slow to reflect recent overspending or recent budget cuts.',
    option30Fit: 'Best for users wanting peace of mind with predictable monthly routines.',
    close: 'Got It'
  },
  common: {
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    close: 'Close',
    loading: 'Loading...',
    search: 'Search...'
  }
};
