export const ACTION_CATALOG = {
  policy: {
    label: 'Send policy macro',
    icon: '📄',
    tone: 'Bureaucratic',
    description: 'Quote policy, avoid personal liability, and hope the ticket stops moving.',
    defaultDelta: { reputation: -1, sanity: -1 }
  },
  refund: {
    label: 'Refund / compensate',
    icon: '💸',
    tone: 'Appeasement',
    description: 'Spend company money to pacify the complainant.',
    defaultDelta: { cash: -25, reputation: 2, sanity: -1 }
  },
  ban: {
    label: 'Ban account',
    icon: '⛔',
    tone: 'Containment',
    description: 'Terminate the customer relationship before it terminates you.',
    defaultDelta: { reputation: -3, containment: 3, soulRisk: -1 }
  },
  escalate: {
    label: 'Escalate internally',
    icon: '📎',
    tone: 'Admin',
    description: 'Pass the problem to a department that may or may not exist.',
    defaultDelta: { sanity: 1, reputation: -1, inboxHeat: 2 }
  },
  exorcise: {
    label: 'Exorcise ticket',
    icon: '🕯️',
    tone: 'Occult',
    description: 'Use approved rites, incense, and an expense-code nobody audits.',
    defaultDelta: { containment: 5, sanity: -4, soulRisk: -3, cash: -10 }
  },
  kindness: {
    label: 'Human kindness',
    icon: '☕',
    tone: 'Risky empathy',
    description: 'Acknowledge the emotion beneath the curse. HR says this is not scalable.',
    defaultDelta: { reputation: 2, sanity: 2, soulRisk: 1 }
  },
  loophole: {
    label: 'Exploit fine print',
    icon: '🧾',
    tone: 'Legalistic',
    description: 'Weaponize the terms of service. Extremely on-brand.',
    defaultDelta: { cash: 8, reputation: -2, soulRisk: 2 }
  },
  barter: {
    label: 'Offer barter settlement',
    icon: '🪙',
    tone: 'Infernal finance',
    description: 'Trade something weird instead of money. Accounting hates this.',
    defaultDelta: { cash: 3, soulRisk: 4, reputation: 1 }
  }
};

export const METRIC_LABELS = {
  reputation: 'Reputation',
  sanity: 'Sanity',
  cash: 'Cash',
  soulRisk: 'Soul Risk',
  containment: 'Containment',
  inboxHeat: 'Inbox Heat'
};

export const METRIC_HELP = {
  reputation: 'Public trust and review score. Hitting zero ends your employment.',
  sanity: 'Your ability to keep answering emails. Hitting zero ends your assignment.',
  cash: 'Department budget. Negative cash triggers penalties at shift end.',
  soulRisk: 'How close Infernal Accounts is to repossessing your soul. 100 ends your assignment.',
  containment: 'How stable the office reality field is. Low containment increases weirdness.',
  inboxHeat: 'How much attention your queue has attracted from bad departments.'
};
