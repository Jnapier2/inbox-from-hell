// Persistent run-build choices offered between shifts. Effect values are
// additive: action deltas are merged into the selected response, duration
// values add milliseconds, and grade bonuses add to the normal Insight award.
export const ARTIFACTS = [
  {
    id: 'human-ish-script',
    name: 'Human-ish Reply Script',
    glyph: '☕',
    description: 'A warm template that somehow remembers the customer\'s name.',
    boon: 'Kindness replies gain +2 Reputation.',
    drawback: 'Each Kindness reply costs 3 extra Cash.',
    effects: {
      actionDeltaById: { kindness: { reputation: 2, cash: -3 } }
    }
  },
  {
    id: 'petty-cash-sigil',
    name: 'Petty Cash Sigil',
    glyph: '¤',
    description: 'Finance reimburses refunds through a ledger that breathes quietly.',
    boon: 'Refund replies recover 8 Cash.',
    drawback: 'Each Refund reply adds 2 Soul Risk.',
    effects: {
      actionDeltaById: { refund: { cash: 8, soulRisk: 2 } }
    }
  },
  {
    id: 'containment-chalk',
    name: 'Ergonomic Containment Chalk',
    glyph: '◇',
    description: 'Easier on the wrist, harder on the escalation sensors.',
    boon: 'Exorcise replies refund 2 Sanity.',
    drawback: 'Each Exorcise reply adds 1 Inbox Heat.',
    effects: {
      actionDeltaById: { exorcise: { sanity: 2, inboxHeat: 1 } }
    }
  },
  {
    id: 'compliance-monocle',
    name: 'Fine-Print Monocle',
    glyph: '⌕',
    description: 'It reveals safer clauses and makes every response sound slightly worse.',
    boon: 'Policy and Loophole replies reduce Soul Risk by 2.',
    drawback: 'Those replies also lose 1 extra Reputation.',
    effects: {
      actionDeltaById: {
        policy: { soulRisk: -2, reputation: -1 },
        loophole: { soulRisk: -2, reputation: -1 }
      }
    }
  },
  {
    id: 'escalation-imp',
    name: 'Pocket Escalation Imp',
    glyph: '↗',
    description: 'It knows the org chart. The org chart wishes it did not.',
    boon: 'Escalate replies generate 2 less Inbox Heat.',
    drawback: 'Each Escalate reply loses 1 extra Reputation.',
    effects: {
      actionDeltaById: { escalate: { inboxHeat: -2, reputation: -1 } }
    }
  },
  {
    id: 'black-ledger',
    name: 'Black-Market Resolution Ledger',
    glyph: '▣',
    description: 'It makes unconventional closures stronger and invoices the missing stability.',
    boon: 'Ban gains +2 Containment; Barter gains +4 Cash.',
    drawback: 'Ban costs 3 Cash; Barter loses 2 Containment.',
    effects: {
      actionDeltaById: {
        ban: { containment: 2, cash: -3 },
        barter: { cash: 4, containment: -2 }
      }
    }
  },
  {
    id: 'red-string-board',
    name: 'Red String Case Board',
    glyph: '⌘',
    description: 'Connections become obvious, but reading them consumes the start of every shift.',
    boon: 'Strong case reads gain +1 additional Insight.',
    drawback: 'Every shift is 20 seconds shorter.',
    effects: {
      gradeInsightBonus: { strong: 1 },
      shiftDurationMs: -20000
    }
  },
  {
    id: 'incident-bell',
    name: 'Cracked Incident Bell',
    glyph: '🔔',
    description: 'It slows a critical moment by borrowing stability from the next one.',
    boon: 'Critical-incident clocks gain 12 seconds.',
    drawback: 'Each shift begins with -3 Containment.',
    effects: {
      incidentDurationMs: 12000,
      shiftStartDelta: { containment: -3 }
    }
  }
];

export const ARTIFACT_BY_ID = new Map(ARTIFACTS.map(artifact => [artifact.id, artifact]));

// Permanent office construction choices. Unlike desk artifacts, rooms reshape
// the rest of the assignment: each provides a lasting advantage, introduces a
// complication, and unlocks a one-time office emergency on a later shift.
export const OFFICE_ROOMS = [
  {
    id: 'case-archive',
    name: 'Case Archive',
    glyph: '🗃',
    philosophy: 'Compassion office',
    description: 'Old cases are indexed by what actually happened instead of how quickly they closed.',
    boon: 'Strong reads earn +1 additional Insight.',
    complication: 'Archived customers can reopen their own files during a later shift.',
    unlock: 'Reopened Case emergency',
    effects: { gradeInsightBonus: { strong: 1 } }
  },
  {
    id: 'compliance-annex',
    name: 'Compliance Annex',
    glyph: '⚖',
    philosophy: 'Bureaucratic office',
    description: 'A narrow room filled with wider definitions and an auditor who never quite leaves.',
    boon: 'Every reply shows one additional directional consequence.',
    complication: 'The shift casework target rises by one credit.',
    unlock: 'Living Form emergency',
    effects: { forecastSlotsBonus: 1, caseworkTargetDelta: 1 }
  },
  {
    id: 'cursed-mailroom',
    name: 'Cursed Mailroom',
    glyph: '📦',
    philosophy: 'Chaos office',
    description: 'Incoming objects are sorted into Mail, Parcel, Witness, and Actively Biting.',
    boon: 'Shift audits offer one additional desk artifact when available.',
    complication: 'Unclaimed internal packages begin making workplace decisions.',
    unlock: 'Unclaimed Parcel emergency',
    effects: { artifactOfferBonus: 1 }
  },
  {
    id: 'break-room',
    name: 'Break Room',
    glyph: '☕',
    philosophy: 'Compassion office',
    description: 'The coffee is ordinary. This is considered a premium supernatural benefit.',
    boon: 'Each shift begins with +5 Sanity.',
    complication: 'Restocking costs 3 Cash at the start of every shift.',
    unlock: 'Mandatory Birthday emergency',
    effects: { shiftStartDelta: { sanity: 5, cash: -3 } }
  },
  {
    id: 'it-crypt',
    name: 'IT Crypt',
    glyph: '⌨',
    philosophy: 'Occult office',
    description: 'Unsupported software is given a respectful burial and limited network access.',
    boon: 'Critical-incident deadlines gain 8 seconds.',
    complication: 'Each shift begins with +1 Soul Risk from background processes.',
    unlock: 'Reply Daemon emergency',
    effects: { incidentDurationMs: 8000, shiftStartDelta: { soulRisk: 1 } }
  },
  {
    id: 'ward-workshop',
    name: 'Ward Workshop',
    glyph: '⛨',
    philosophy: 'Containment office',
    description: 'Chalk circles, replacement bells, and workplace-safe emergency candles are assembled here.',
    boon: 'Each shift begins with +5 Containment.',
    complication: 'Specialized supplies cost 5 Cash at the start of every shift.',
    unlock: 'Ward Breach emergency',
    effects: { shiftStartDelta: { containment: 5, cash: -5 } }
  }
];

export const OFFICE_ROOM_BY_ID = new Map(OFFICE_ROOMS.map(room => [room.id, room]));

// Two-room identities reward intentional office construction. These are
// derived from the blueprint, so old saves gain them automatically as soon as
// their required rooms are present.
export const OFFICE_PATHS = [
  {
    id: 'people-first-record',
    name: 'People-First Records',
    requires: ['case-archive', 'break-room'],
    description: 'The archive remembers the person; the break room remembers the agent.',
    boon: 'Defensible case reads earn +1 Insight.',
    complication: 'Listening time costs 2 Cash at the start of each shift.',
    effects: { gradeInsightBonus: { defensible: 1 }, shiftStartDelta: { cash: -2 } }
  },
  {
    id: 'procedure-engine',
    name: 'Procedure Engine',
    requires: ['case-archive', 'compliance-annex'],
    description: 'Every past answer becomes a form, and every form becomes a future answer.',
    boon: 'Reply forecasts reveal one additional consequence.',
    complication: 'Maintaining the precedent map costs 2 Sanity each shift.',
    effects: { forecastSlotsBonus: 1, shiftStartDelta: { sanity: -2 } }
  },
  {
    id: 'haunted-automation',
    name: 'Haunted Automation',
    requires: ['cursed-mailroom', 'it-crypt'],
    description: 'Packages route themselves and software signs for delivery.',
    boon: 'Shift audits offer one additional desk artifact when available.',
    complication: 'Automated background decisions add 2 Soul Risk each shift.',
    effects: { artifactOfferBonus: 1, shiftStartDelta: { soulRisk: 2 } }
  },
  {
    id: 'resilience-floor',
    name: 'Resilience Floor',
    requires: ['break-room', 'ward-workshop'],
    description: 'Recovery and containment share a supply cabinet and a very strict kettle.',
    boon: 'Each shift begins with +2 Sanity and +3 Containment.',
    complication: 'Shared supplies cost another 2 Cash each shift.',
    effects: { shiftStartDelta: { sanity: 2, containment: 3, cash: -2 } }
  },
  {
    id: 'sealed-logistics',
    name: 'Sealed Logistics',
    requires: ['cursed-mailroom', 'ward-workshop'],
    description: 'Every parcel gets a destination, a circle, and an emergency bell.',
    boon: 'Critical-incident deadlines gain 5 seconds.',
    complication: 'Protective packing costs 3 Cash each shift.',
    effects: { incidentDurationMs: 5000, shiftStartDelta: { cash: -3 } }
  },
  {
    id: 'predictive-compliance',
    name: 'Predictive Compliance',
    requires: ['compliance-annex', 'it-crypt'],
    description: 'The forms know what you will answer and have already begun objecting.',
    boon: 'Reply forecasts reveal one additional consequence and incidents gain 4 seconds.',
    complication: 'Forecasting adds 1 Soul Risk each shift.',
    effects: { forecastSlotsBonus: 1, incidentDurationMs: 4000, shiftStartDelta: { soulRisk: 1 } }
  }
];

// Promotions unlock authored reply techniques. At most one contextual mastery
// reply is added to a ticket, so progression expands the player's vocabulary
// without turning every case into a wall of buttons.
export const REPLY_TECHNIQUES = [
  {
    id: 'reflect-real-problem',
    name: 'Reflect the Real Problem',
    glyph: '🪞',
    minInsight: 6,
    sourceActionIds: ['kindness'],
    label: 'Name the harm, then answer it',
    tone: 'Active listening',
    description: 'Turn a humane reply into a precise acknowledgment of what the customer actually lost.',
    preview: 'Mirror the customer’s real concern in plain language, then offer one firm next step.',
    delta: { reputation: 1, sanity: 1, cash: -2 },
    outcomeSuffix: 'Because you named the real harm, the customer forwards the solution instead of the complaint.',
    reason: 'The promoted reply keeps the empathy of the original response and ties it directly to the case focus.'
  },
  {
    id: 'tailored-remedy',
    name: 'Tailored Remedy',
    glyph: '🧵',
    minInsight: 15,
    sourceActionIds: ['refund', 'barter'],
    label: 'Offer a remedy with boundaries',
    tone: 'Precision resolution',
    description: 'Solve the specific harm without promising the same cursed exception to everyone.',
    preview: 'Match the remedy to the exact failure and write a boundary that will survive the next customer.',
    delta: { reputation: 2, cash: 4, sanity: -1 },
    outcomeSuffix: 'The remedy is narrow enough to solve this case without becoming an all-inbox entitlement.',
    reason: 'The promoted reply pairs restitution with a boundary shaped around the facts in the email.'
  },
  {
    id: 'one-page-brief',
    name: 'One-Page Escalation Brief',
    glyph: '📌',
    minInsight: 27,
    sourceActionIds: ['escalate', 'policy'],
    label: 'Escalate with a complete theory',
    tone: 'Senior handling',
    description: 'Send the receiving team one coherent case theory instead of a cursed pile of attachments.',
    preview: 'State the risk, cite the decisive detail, and assign the next owner before escalating.',
    delta: { containment: 2, inboxHeat: -2, sanity: -1 },
    outcomeSuffix: 'The receiving team gets one coherent brief instead of seven sub-tickets arguing with each other.',
    reason: 'The promoted reply preserves necessary escalation while proving you understood the decisive detail first.'
  },
  {
    id: 'dual-track-containment',
    name: 'Dual-Track Containment',
    glyph: '⛨',
    minInsight: 40,
    sourceActionIds: ['exorcise', 'ban', 'kindness'],
    incidentOnly: true,
    label: 'Contain the hazard, preserve the person',
    tone: 'Occult specialist',
    description: 'Stabilize an incident without erasing the customer, witness, or sentient package inside it.',
    preview: 'Split the response: contain the immediate threat while preserving a humane recovery path.',
    delta: { containment: 3, soulRisk: -2, cash: -4 },
    outcomeSuffix: 'The hazard is stabilized without erasing the person—or thing—attached to it.',
    reason: 'The promoted reply handles both halves of the critical case: immediate containment and the underlying need.'
  },
  {
    id: 'rewrite-precedent',
    name: 'Rewrite the Precedent',
    glyph: '✒',
    minInsight: 54,
    sourceActionIds: ['kindness', 'refund', 'exorcise', 'ban', 'escalate', 'policy', 'barter', 'loophole'],
    label: 'Resolve the case and change the rule',
    tone: 'Infernal ombud',
    description: 'Turn a strong individual resolution into a safer rule for every queue that follows.',
    preview: 'Answer this customer, then rewrite the policy that allowed the same curse to happen.',
    delta: { reputation: 3, soulRisk: -2, containment: 2, cash: -3 },
    outcomeSuffix: 'Your exception becomes a safer rule. Legal stamps it “annoyingly humane.”',
    reason: 'The ombud reply solves the present case and removes the precedent that would recreate it.'
  }
];

export const REPLY_TECHNIQUE_BY_ID = new Map(REPLY_TECHNIQUES.map(technique => [technique.id, technique]));

// Each promotion opens a little more of the desk console. Early play is built
// around reading the email; later promotions improve the player's instruments
// without ever turning replies into exact arithmetic exercises.
export const CLEARANCE_RANKS = [
  {
    name: 'Probationary Agent',
    minInsight: 0,
    instruments: {
      name: 'Sealed training console',
      metricKeys: [],
      forecastSlots: 0,
      description: 'Exact gauges and reply forecasts are sealed. The email is your evidence.'
    }
  },
  {
    name: 'Queue Reader',
    minInsight: 6,
    techniqueId: 'reflect-real-problem',
    instruments: {
      name: 'Public chatter gauge',
      metricKeys: ['reputation'],
      forecastSlots: 1,
      description: 'Shows Reputation and one likely consequence on each reply.'
    }
  },
  {
    name: 'Case Handler',
    minInsight: 15,
    techniqueId: 'tailored-remedy',
    instruments: {
      name: 'Workload and budget gauges',
      metricKeys: ['reputation', 'sanity', 'cash'],
      forecastSlots: 2,
      description: 'Adds Sanity and Cash, plus a second likely consequence on each reply.'
    }
  },
  {
    name: 'Senior Responder',
    minInsight: 27,
    techniqueId: 'one-page-brief',
    instruments: {
      name: 'Infernal risk ledger',
      metricKeys: ['reputation', 'sanity', 'cash', 'soulRisk'],
      forecastSlots: 2,
      description: 'Adds an exact Soul Risk reading.'
    }
  },
  {
    name: 'Occult Specialist',
    minInsight: 40,
    techniqueId: 'dual-track-containment',
    instruments: {
      name: 'Reality field console',
      metricKeys: ['reputation', 'sanity', 'cash', 'soulRisk', 'containment'],
      forecastSlots: 3,
      description: 'Adds Containment and a third likely consequence on each reply.'
    }
  },
  {
    name: 'Infernal Ombud',
    minInsight: 54,
    techniqueId: 'rewrite-precedent',
    instruments: {
      name: 'Full ombud console',
      metricKeys: ['reputation', 'sanity', 'cash', 'soulRisk', 'containment', 'inboxHeat'],
      forecastSlots: 4,
      description: 'Opens every current gauge and the broadest directional forecast.'
    }
  }
];

// One deterministic random memo is active from Shift 2 onward. A memo changes
// the value of familiar replies for the whole shift, giving each run a build
// problem the player can understand before committing to an answer.
export const SHIFT_CONDITIONS = [
  {
    id: 'budget-lockdown',
    name: 'Discretionary Mercy Freeze',
    glyph: '¤',
    memo: 'Finance has frozen anything that resembles compassion with a receipt.',
    opportunity: 'Barter settlements recover more Cash.',
    hazard: 'Refunds cost additional Cash.',
    effects: {
      actionDeltaById: {
        refund: { cash: -8 },
        barter: { cash: 4 }
      }
    }
  },
  {
    id: 'thin-veil',
    name: 'Thin Veil Advisory',
    glyph: '◇',
    memo: 'The office wards are unusually receptive and painfully loud.',
    opportunity: 'Exorcise replies restore more Containment.',
    hazard: 'Exorcise replies cost additional Sanity; Loopholes attract Soul Risk.',
    effects: {
      actionDeltaById: {
        exorcise: { containment: 3, sanity: -2 },
        loophole: { soulRisk: 2 }
      }
    }
  },
  {
    id: 'public-watch',
    name: 'Public Comment Window',
    glyph: '◎',
    memo: 'Every customer has discovered the reply-all button at once.',
    opportunity: 'Kindness earns additional Reputation.',
    hazard: 'Bans lose additional Reputation and attract Inbox Heat.',
    effects: {
      actionDeltaById: {
        kindness: { reputation: 2 },
        ban: { reputation: -2, inboxHeat: 2 }
      }
    }
  },
  {
    id: 'paperwork-storm',
    name: 'Paperwork Weather Event',
    glyph: '▧',
    memo: 'Forms are falling upward. Ownership is becoming a spiritual concept.',
    opportunity: 'Escalation preserves more Sanity.',
    hazard: 'Escalation creates additional Inbox Heat; Policy replies strain Containment.',
    effects: {
      actionDeltaById: {
        escalate: { sanity: 2, inboxHeat: 3 },
        policy: { containment: -2 }
      }
    }
  },
  {
    id: 'full-moon-returns',
    name: 'Full-Moon Returns Window',
    glyph: '◐',
    memo: 'Returns are arriving in packs and circling the loading dock.',
    opportunity: 'Refunds earn additional Reputation; Barter recovers more Cash.',
    hazard: 'Refunds cost additional Cash; Barter adds Soul Risk.',
    effects: {
      actionDeltaById: {
        refund: { reputation: 1, cash: -5 },
        barter: { cash: 5, soulRisk: 2 }
      }
    }
  },
  {
    id: 'compliance-observer',
    name: 'Compliance Observer Present',
    glyph: '⌕',
    memo: 'A silent auditor is sitting behind you and taking notes on skin-colored paper.',
    opportunity: 'Policy replies lose less Reputation and reduce Inbox Heat.',
    hazard: 'Loopholes cost additional Reputation.',
    effects: {
      actionDeltaById: {
        policy: { reputation: 1, inboxHeat: -2 },
        loophole: { reputation: -3 }
      }
    }
  }
];

export const SHIFT_CONDITION_BY_ID = new Map(SHIFT_CONDITIONS.map(condition => [condition.id, condition]));
