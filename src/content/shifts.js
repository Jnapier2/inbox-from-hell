export const SHIFTS = [
  {
    id: 1,
    title: 'Orientation at Brimstone Support',
    subtitle: 'Do not lick the stamps. Do not look directly at the unsubscribe link.',
    durationMs: 5 * 60 * 1000,
    quota: 5,
    objective: 'Close five onboarding tickets without letting Soul Risk hit 100 or Sanity hit 0.',
    unlocks: ['General', 'Refunds', 'Occult Compliance'],
    briefing: [
      'Welcome to NetherHelp, the customer support arm of several cursed subsidiaries.',
      'Every reply creates precedent. Every refund creates appetite. Every escalation creates paperwork that may become sentient.',
      'Your supervisor has stapled a tiny silver bell to your keyboard. Ring it only if the bell rings first.'
    ]
  },
  {
    id: 2,
    title: 'Refunds, Returns, and Other Summonings',
    subtitle: 'The warehouse has learned your name.',
    durationMs: 6 * 60 * 1000,
    quota: 5,
    objective: 'Keep Reputation above 20 while avoiding unpaid barter debt.',
    unlocks: ['Returns', 'Warehouse Séance'],
    briefing: [
      'Returns opened at midnight and immediately requested a lawyer, a priest, and a mop.',
      'Customers have discovered that “store credit” can mean “credit with the Store.” Capital S.',
      'The demo build tracks choices from shift one, so familiar names may resurface.'
    ]
  },
  {
    id: 3,
    title: 'Legal Necromancy',
    subtitle: 'Contracts never die. They only renew.',
    durationMs: 7 * 60 * 1000,
    quota: 5,
    objective: 'Use policy carefully. Legal victories often have occult side effects.',
    unlocks: ['Legal Necromancy', 'Legacy Accounts'],
    briefing: [
      'Legal has reanimated a stack of old contracts and asked you not to make eye contact with clause 13(b).',
      'Some tickets include humans. The suspiciously normal ones are not always safer.',
      'A hidden storyline has begun if you repeatedly choose empathy or repeatedly choose fine print.'
    ]
  },
  {
    id: 4,
    title: 'Executive Possession Review',
    subtitle: 'Management wants cleaner metrics, not fewer screams.',
    durationMs: 8 * 60 * 1000,
    quota: 5,
    objective: 'Survive executive pressure while keeping Containment above 15.',
    unlocks: ['Executive Relations', 'Press Hex Desk'],
    briefing: [
      'An executive has been possessed by quarterly goals. The goals are winning.',
      'Press Hex Desk now watches any ticket tagged “viral”, “blood”, or “influencer”.',
      'Escalations are safer short-term but raise Inbox Heat. High heat invites stranger tickets.'
    ]
  },
  {
    id: 5,
    title: 'The Fifth Shift Demo Finale',
    subtitle: 'The inbox has stopped pretending it is software.',
    durationMs: 10 * 60 * 1000,
    quota: 5,
    objective: 'Resolve the demo finale and learn which department wants you permanently.',
    unlocks: ['Demo Finale'],
    briefing: [
      'The inbox opened a ticket about you. That is either a bug, a promotion, or a mouth.',
      'Your earlier choices influence the closing audit. Surviving is good. Surviving with a soul is better.',
      'The full game would continue with longer arcs, more departments, and procedural complaints layered over authored storylines.'
    ]
  }
];

export const DEPARTMENT_DESCRIPTIONS = {
  General: 'Default mailbox for customers who have not yet become evidence.',
  Refunds: 'Money leaves. Consequences enter.',
  'Occult Compliance': 'Ensures all rites follow the handbook and most local fire codes.',
  Returns: 'Processes cursed merchandise, living boxes, and regrets.',
  'Warehouse Séance': 'Talks to inventory that remembers being trees.',
  'Legal Necromancy': 'Raises old contracts and buries fresh liability.',
  'Legacy Accounts': 'Supports customers who died before two-factor authentication.',
  'Executive Relations': 'Handles leadership, possession, and leadership possession.',
  'Press Hex Desk': 'Prevents screenshots from becoming summon circles.',
  'Demo Finale': 'A polished vertical slice endpoint for the free demo.'
};
