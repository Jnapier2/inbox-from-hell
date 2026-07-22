export const SHIFTS = [
  {
    id: 1,
    title: 'Orientation at Brimstone Support',
    subtitle: 'Do not lick the stamps. Do not look directly at the unsubscribe link.',
    durationMs: 5 * 60 * 1000,
    quota: 5,
    caseworkTarget: 6,
    objective: 'Close five onboarding tickets and earn 380 case points at audit.',
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
    caseworkTarget: 7,
    objective: 'Earn 410 case points while adapting to today\'s shift rule.',
    unlocks: ['Returns', 'Warehouse Séance'],
    briefing: [
      'Returns opened at midnight and immediately requested a lawyer, a priest, and a mop.',
      'Customers have discovered that “store credit” can mean “credit with the Store.” Capital S.',
      'The inbox remembers your first-shift replies, so familiar names may resurface.',
      'From today onward, one random shift rule changes which familiar replies are safe.'
    ]
  },
  {
    id: 3,
    title: 'Legal Necromancy',
    subtitle: 'Contracts never die. They only renew.',
    durationMs: 7 * 60 * 1000,
    quota: 5,
    caseworkTarget: 8,
    objective: 'Earn 440 case points. A technically safe answer may still miss the human problem.',
    unlocks: ['Legal Necromancy', 'Legacy Accounts'],
    briefing: [
      'Legal has reanimated a stack of old contracts and asked you not to make eye contact with clause 13(b).',
      'Some tickets include humans. The suspiciously normal ones are not always safer.',
      'Your supervisor is watching whether you favor empathy or fine print. Either habit will follow you.'
    ]
  },
  {
    id: 4,
    title: 'Executive Possession Review',
    subtitle: 'Management wants cleaner metrics, not fewer screams.',
    durationMs: 8 * 60 * 1000,
    quota: 5,
    caseworkTarget: 9,
    objective: 'Earn 470 case points while surviving executive pressure and public incidents.',
    unlocks: ['Executive Relations', 'Press Hex Desk'],
    briefing: [
      'An executive has been possessed by quarterly goals. The goals are winning.',
      'Press Hex Desk now watches any ticket tagged “viral”, “blood”, or “influencer”.',
      'Escalations are safer short-term but raise Inbox Heat. High heat invites stranger tickets.'
    ]
  },
  {
    id: 5,
    title: 'The Fifth Shift: Final Review',
    subtitle: 'The inbox has stopped pretending it is software.',
    durationMs: 10 * 60 * 1000,
    quota: 5,
    caseworkTarget: 9,
    objective: 'Earn 470 case points and complete the final review on your own terms.',
    unlocks: ['Final Review'],
    briefing: [
      'The inbox opened a ticket about you. That is either a bug, a promotion, or a mouth.',
      'Your earlier choices influence the closing audit. Surviving is good. Surviving with a soul is better.',
      'If you keep the job, more departments, longer cases, and stranger complaints await.'
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
  'Final Review': 'Determines where the company intends to keep you permanently.',
  'Executive Floor': 'A destination the building reveals only after three rooms acknowledge your authority.'
};

// Short mid-shift interruptions create a second rhythm beside email handling.
// The normal shift clock pauses while one is active; making either choice in
// time awards one Insight, while hesitation applies the authored fallout.
export const TIMED_EVENTS = [
  {
    id: 'refund-printer-audit',
    shiftId: 2,
    triggerResolved: 3,
    durationMs: 28000,
    title: 'The refund printer reimbursed itself',
    prompt: 'A receipt is demanding mileage. The printer has already approved three of its own claims.',
    choices: [
      {
        id: 'pull-plug',
        label: 'Pull the plug',
        preview: 'Stop the claims immediately and accept a small morale cost.',
        delta: { containment: 3, sanity: -1 },
        outcome: 'The printer powers down while muttering about hostile workplace conditions.'
      },
      {
        id: 'audit-printer',
        label: 'Audit the printer',
        preview: 'Recover the money, but let the strange expense report attract attention.',
        delta: { cash: 10, inboxHeat: 3 },
        outcome: 'Finance recovers the claims and opens a vendor profile for Office Equipment, Sentient.'
      }
    ],
    timeoutDelta: { cash: -8, inboxHeat: 2 },
    timeoutText: 'The printer approves a wellness retreat before anyone answers.'
  },
  {
    id: 'clause-thirteen-signature',
    shiftId: 3,
    triggerResolved: 3,
    durationMs: 26000,
    title: 'Clause 13(b) wants your signature',
    prompt: 'The contract has unfolded across your keyboard and is tapping the signature line with a tiny paper finger.',
    choices: [
      {
        id: 'annotate-clause',
        label: 'Annotate the loophole',
        preview: 'Use what you learned from the queue to bind the clause instead of yourself.',
        delta: { soulRisk: -3, sanity: -2, containment: 2 },
        outcome: 'Your margin note traps the clause in a definition of “authorized signer.”'
      },
      {
        id: 'route-to-legal',
        label: 'Route it to Legal',
        preview: 'Avoid personal liability, but make the office harder to ignore.',
        delta: { sanity: 2, inboxHeat: 4 },
        outcome: 'Legal accepts the contract, which immediately begins billing them by the hour.'
      }
    ],
    timeoutDelta: { soulRisk: 4, sanity: -2 },
    timeoutText: 'The clause signs your initials using a paper cut.'
  },
  {
    id: 'executive-metric-ping',
    shiftId: 4,
    requiresMinRooms: 3,
    sourceRoom: 'Executive Floor',
    elevatorEvent: true,
    triggerResolved: 3,
    durationMs: 24000,
    title: 'Executive asks why screams are down 8%',
    prompt: 'Management wants a one-line explanation before the possession notices you are thinking.',
    choices: [
      {
        id: 'tell-truth',
        label: 'Report customer outcomes',
        preview: 'Protect the queue with an honest answer and risk the quarterly narrative.',
        delta: { reputation: 3, cash: -5, sanity: 1 },
        outcome: 'The executive blinks twice. For several seconds, the human underneath looks relieved.'
      },
      {
        id: 'weaponize-dashboard',
        label: 'Weaponize the dashboard',
        preview: 'Satisfy the metric request while feeding attention to the inbox.',
        delta: { cash: 8, inboxHeat: 4, soulRisk: 2 },
        outcome: 'The dashboard applauds. Nobody remembers adding an applause feature.'
      }
    ],
    timeoutDelta: { reputation: -4, inboxHeat: 3 },
    timeoutText: 'Your silence is entered into the dashboard as negative screaming.'
  },
  {
    id: 'inbox-promotion-offer',
    shiftId: 5,
    triggerResolved: 3,
    durationMs: 22000,
    title: 'The inbox offers you a promotion',
    prompt: 'A new button appears: ACCEPT PERMANENT OWNERSHIP. The decline button is hiding behind your personnel file.',
    choices: [
      {
        id: 'counteroffer',
        label: 'Counteroffer in plain English',
        preview: 'Use your personnel record as leverage and refuse the supernatural framing.',
        delta: { reputation: 3, soulRisk: -4, sanity: 2 },
        outcome: 'The inbox accepts a six-month review period and pretends that was its idea.'
      },
      {
        id: 'delegate-to-inbox',
        label: 'Promote the inbox instead',
        preview: 'Give it responsibility, budget, and exactly enough rope to become management.',
        delta: { cash: 12, containment: -3, inboxHeat: 3 },
        outcome: 'The inbox becomes Acting Director and immediately schedules its own performance review.'
      }
    ],
    timeoutDelta: { soulRisk: 5, sanity: -3 },
    timeoutText: 'The inbox interprets hesitation as enthusiastic consent.'
  },
  {
    id: 'archive-reopened-case',
    shiftIds: [2, 3, 4, 5],
    requiresRoom: 'case-archive',
    sourceRoom: 'Case Archive',
    roomEvent: true,
    triggerResolved: 1,
    durationMs: 28000,
    title: 'A closed case files an appeal',
    prompt: 'The Case Archive has reopened a complaint you already won. The customer remembers your exact wording; the record remembers what you meant.',
    choices: [
      {
        id: 'read-original-harm',
        label: 'Re-read the original harm',
        preview: 'Spend time on the customer thread and correct the precedent instead of defending it.',
        delta: { reputation: 3, sanity: -2, inboxHeat: -1 },
        outcome: 'The archive accepts an amended resolution and stops whispering your old reply aloud.'
      },
      {
        id: 'defend-record',
        label: 'Defend the closed record',
        preview: 'Protect throughput and make the file considerably angrier.',
        delta: { cash: 5, reputation: -2, inboxHeat: 3 },
        outcome: 'The case stays closed. Its folder begins following you between desks.'
      }
    ],
    timeoutDelta: { reputation: -3, inboxHeat: 3 },
    timeoutText: 'The archive publishes your first reply as binding precedent.'
  },
  {
    id: 'annex-living-form',
    shiftIds: [2, 3, 4, 5],
    requiresRoom: 'compliance-annex',
    sourceRoom: 'Compliance Annex',
    roomEvent: true,
    triggerResolved: 1,
    durationMs: 25000,
    title: 'Form 9-R has become self-aware',
    prompt: 'A compliance form refuses to be completed until someone acknowledges that its final question is impossible.',
    choices: [
      {
        id: 'amend-question',
        label: 'Amend the impossible question',
        preview: 'Fix the rule and accept a small administrative cost.',
        delta: { reputation: 2, cash: -4, soulRisk: -2 },
        outcome: 'The form signs its own revision and joins the union.'
      },
      {
        id: 'complete-in-blood',
        label: 'Complete it exactly as written',
        preview: 'Satisfy compliance quickly using the only ink it accepts.',
        delta: { cash: 6, sanity: -2, soulRisk: 3 },
        outcome: 'Every box is checked. One of them now contains your middle name.'
      }
    ],
    timeoutDelta: { sanity: -2, soulRisk: 3 },
    timeoutText: 'The form completes you instead.'
  },
  {
    id: 'mailroom-unclaimed-parcel',
    shiftIds: [2, 3, 4, 5],
    requiresRoom: 'cursed-mailroom',
    sourceRoom: 'Cursed Mailroom',
    roomEvent: true,
    triggerResolved: 1,
    durationMs: 23000,
    title: 'An unclaimed parcel elects itself supervisor',
    prompt: 'The box has a tie, a performance rubric, and no return address. It is asking everyone to circle up.',
    choices: [
      {
        id: 'verify-recipient',
        label: 'Verify the intended recipient',
        preview: 'Read every label before giving the parcel authority.',
        delta: { containment: 3, sanity: -1, cash: -2 },
        outcome: 'The final label reads TO: NOBODY. The parcel loses quorum and folds itself flat.'
      },
      {
        id: 'accept-reorg',
        label: 'Accept the reorganization',
        preview: 'Gain budget now and let the box redesign the office.',
        delta: { cash: 9, containment: -3, inboxHeat: 2 },
        outcome: 'The parcel eliminates two meetings and one load-bearing wall.'
      }
    ],
    timeoutDelta: { containment: -4, inboxHeat: 2 },
    timeoutText: 'The parcel schedules your one-on-one inside itself.'
  },
  {
    id: 'break-room-birthday',
    shiftIds: [2, 3, 4, 5],
    requiresRoom: 'break-room',
    sourceRoom: 'Break Room',
    roomEvent: true,
    triggerResolved: 1,
    durationMs: 26000,
    title: 'Mandatory birthday: employee unknown',
    prompt: 'A cake has appeared with one candle for every year the building has been hungry. HR insists attendance is restorative.',
    choices: [
      {
        id: 'ask-whose-birthday',
        label: 'Ask whose birthday it is',
        preview: 'Risk the mood to learn what the celebration is actually feeding.',
        delta: { sanity: 3, soulRisk: -2, reputation: 1 },
        outcome: 'The cake admits it is celebrating itself. Everyone receives a reasonable slice.'
      },
      {
        id: 'sing-and-eat',
        label: 'Sing, eat, return to work',
        preview: 'Take the quick morale boost without investigating the frosting.',
        delta: { sanity: 5, soulRisk: 3 },
        outcome: 'The cake is delicious. Your personnel file now lists a second date of birth.'
      }
    ],
    timeoutDelta: { sanity: -3, reputation: -2 },
    timeoutText: 'The cake marks you absent and blows out the lights.'
  },
  {
    id: 'crypt-reply-daemon',
    shiftIds: [2, 3, 4, 5],
    requiresRoom: 'it-crypt',
    sourceRoom: 'IT Crypt',
    roomEvent: true,
    triggerResolved: 1,
    durationMs: 22000,
    title: 'The reply daemon drafts a perfect apology',
    prompt: 'The draft is warm, precise, and addressed to a customer who has not written yet. Sending it would close tomorrow\'s case today.',
    choices: [
      {
        id: 'quarantine-draft',
        label: 'Quarantine the impossible draft',
        preview: 'Preserve cause and effect at the cost of an expensive IT ritual.',
        delta: { containment: 3, cash: -5, soulRisk: -1 },
        outcome: 'The daemon is sandboxed with a dictionary and no access to the future.'
      },
      {
        id: 'send-early',
        label: 'Send tomorrow\'s apology now',
        preview: 'Gain efficiency by letting the software decide what happens next.',
        delta: { cash: 8, inboxHeat: -2, soulRisk: 4 },
        outcome: 'The customer thanks you, then asks what you are about to do.'
      }
    ],
    timeoutDelta: { soulRisk: 4, containment: -2 },
    timeoutText: 'The daemon sends the apology from your personal address.'
  },
  {
    id: 'workshop-ward-breach',
    shiftIds: [2, 3, 4, 5],
    requiresRoom: 'ward-workshop',
    sourceRoom: 'Ward Workshop',
    roomEvent: true,
    triggerResolved: 1,
    durationMs: 24000,
    title: 'A safety ward is protecting the wrong side',
    prompt: 'The new circle keeps employees out and whatever is under the carpet comfortably contained inside the office.',
    choices: [
      {
        id: 'redraw-boundary',
        label: 'Redraw the boundary around people',
        preview: 'Use supplies and careful wording to decide who the ward is for.',
        delta: { containment: 4, cash: -5, reputation: 1 },
        outcome: 'The corrected ward recognizes employees as occupants instead of inventory.'
      },
      {
        id: 'reinforce-current-line',
        label: 'Reinforce the current line',
        preview: 'Keep the threat boxed up and accept its interpretation of workplace safety.',
        delta: { containment: 6, sanity: -3, soulRisk: 2 },
        outcome: 'Nothing escapes. This includes lunch.'
      }
    ],
    timeoutDelta: { containment: -5, sanity: -2 },
    timeoutText: 'The ward flips inside out and lists the office as an external threat.'
  }
];
