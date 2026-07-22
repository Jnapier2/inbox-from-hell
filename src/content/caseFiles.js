// Narrative judgment metadata for every authored ticket. The focus is phrased as
// a question so it directs the player back to the email instead of revealing a
// single "correct" reply. Strong and defensible grades deliberately span
// multiple response styles; missed means the reply ignores the case's core fact.
export const CASE_FILES = {
  's1-t01-malphas-portal': {
    focus: 'What makes this more than a routine refund dispute?',
    grades: { refund: 'strong', policy: 'missed', escalate: 'defensible', exorcise: 'strong' },
    reasons: {
      refund: 'The refund includes a sealant team, addressing both the purchase and the open public gateway.',
      policy: 'Fine print does nothing about the children, the true name, or the portal that is still open.',
      escalate: 'Compliance can contain the exposure, although passing the case delays direct help.',
      exorcise: 'Sealing the public gateway tackles the immediate danger before billing is debated.'
    }
  },
  's1-t02-ghost-password': {
    focus: 'How can identity be verified without treating death as fraud?',
    grades: { kindness: 'strong', policy: 'missed', escalate: 'defensible', exorcise: 'missed' },
    reasons: {
      kindness: 'Memory questions solve the actual identity problem without demanding proof Evelyn cannot provide.',
      policy: 'Repeating the proof-of-life rule preserves the exact barrier described in the email.',
      escalate: 'Manual review is a credible route, but it leaves Evelyn waiting on another department.',
      exorcise: 'Removing the customer avoids the login problem instead of resolving it.'
    }
  },
  's1-t03-witch-familiar': {
    focus: 'Is the priority the damaged product, the transformed familiar, or both?',
    grades: { refund: 'defensible', loophole: 'missed', escalate: 'defensible', exorcise: 'strong' },
    reasons: {
      refund: 'Compensation and a restoration voucher cover both harms, though the reversal is not immediate.',
      loophole: 'Calling the transformation unsupported ignores the living consequence standing in front of Miriam.',
      escalate: 'The warehouse can investigate the label source, but Bartholomew remains transformed for now.',
      exorcise: 'Reversing the hissing label directly addresses the mechanism that changed the familiar.'
    }
  },
  's1-t04-vampire-mug': {
    focus: 'What did Lucien explicitly ask the replacement to respect?',
    grades: { refund: 'strong', policy: 'defensible', ban: 'missed', kindness: 'defensible' },
    reasons: {
      refund: 'A nocturnal replacement answers both the failed product and the requested assurance.',
      policy: 'The coverage explanation is coherent, but it leaves the unusable daylight-biased product unresolved.',
      ban: 'Punishing the complaint ignores the defective mug and the stated nocturnal need.',
      kindness: 'The reply recognizes the design failure and sends the exact concern to the product team.'
    }
  },
  's1-t05-greg-normal': {
    focus: 'Which parts of Greg\'s request signal that ordinary retention is unsafe?',
    grades: { kindness: 'strong', loophole: 'missed', exorcise: 'defensible', escalate: 'missed' },
    reasons: {
      kindness: 'Immediate cancellation and plain-language safety steps respect every boundary Greg stated.',
      loophole: 'The conversion clause exploits the trap Greg is asking to escape.',
      exorcise: 'Purging the altar token ends both the subscription and its supernatural hold.',
      escalate: 'Sending a moving cancellation button to Retention repeats the danger described in the email.'
    }
  },
  's2-f01-malphas-review': {
    focus: 'How can the fan activity be redirected without creating a larger summoning problem?',
    grades: { kindness: 'strong', ban: 'defensible', escalate: 'defensible' },
    reasons: {
      kindness: 'A gentle statement redirects the children while preserving the goodwill already earned.',
      ban: 'Keyword controls reduce summoning instructions, but suppression alone cannot resolve the fascination.',
      escalate: 'Press Hex Desk is relevant to the brand problem, though a committee response may be slow.'
    }
  },
  's2-f02-evelyn-thanks': {
    focus: 'Does the attachment icon pose a threat, or is Evelyn asking for reassurance?',
    grades: { kindness: 'strong', exorcise: 'defensible', policy: 'missed' },
    reasons: {
      kindness: 'Reassurance matches Evelyn\'s calm tone and the closure described in her message.',
      exorcise: 'Formal removal solves the icon, but it treats a harmless symptom as an emergency.',
      policy: 'An attachment-size macro does not address an icon physically attached to a ghost.'
    }
  },
  's2-f03-evelyn-haunt': {
    focus: 'What earlier support failure is driving the escalating haunting?',
    grades: { kindness: 'strong', exorcise: 'missed', escalate: 'defensible' },
    reasons: {
      kindness: 'An apology and manual verification repair the harm that created the grief loop.',
      exorcise: 'Silencing the haunting removes the evidence while leaving the original mistreatment unresolved.',
      escalate: 'Legacy Accounts can interpret the pattern, but the apology still belongs with support.'
    }
  },
  's2-t01-cultist-robes': {
    focus: 'How can the address be corrected without exposing a private purchase?',
    grades: { kindness: 'strong', policy: 'defensible', ban: 'missed', escalate: 'defensible' },
    reasons: {
      kindness: 'Neutral packaging and a verified redirect solve both the shipping and privacy concerns.',
      policy: 'Additional authorization protects the order, but risks missing the delivery window.',
      ban: 'Ritual-themed merchandise is not evidence that the address request is fraudulent.',
      escalate: 'Shipping Anomalies can redirect the parcel, though the case does not clearly require a specialist.'
    }
  },
  's2-t02-werewolf-billing': {
    focus: 'What proves this was repeated billing rather than seven intentional purchases?',
    grades: { refund: 'strong', loophole: 'missed', escalate: 'defensible', barter: 'defensible' },
    reasons: {
      refund: 'Refunding duplicates and adding a lunar lock directly fixes the repeated checkout behavior.',
      loophole: 'Treating involuntary claw clicks as consent ignores the full-moon pattern.',
      escalate: 'Billing can verify the lunar logs, but the duplicate charges remain open in the meantime.',
      barter: 'Chair credit offers restitution, although it replaces a clean refund with an unusual obligation.'
    }
  },
  's2-t03-warehouse-mouth': {
    focus: 'Is the chewing package only hazardous, or is it also communicating a need?',
    grades: { kindness: 'defensible', exorcise: 'defensible', ban: 'strong', escalate: 'missed' },
    reasons: {
      kindness: 'The package asked for care; naming it and setting a safe plan acknowledges both danger and sentience.',
      exorcise: 'Purging the mouth stops the hazard, but may erase the entity that asked for help.',
      ban: 'Quarantine contains the pallet while preserving time to investigate what the package is.',
      escalate: 'Passing an actively chewing package to the same warehouse leaves the immediate breach unmanaged.'
    },
    incident: {
      durationMs: 75000,
      expiryDelta: { containment: -5, sanity: -2, inboxHeat: 3 },
      expiryText: 'The package bites through the pallet and begins negotiating dental coverage with the floor.',
      bonusInsight: 1
    }
  },
  's2-t04-demon-free-trial': {
    focus: 'What makes enforcing the visible conversion timer risky in this case?',
    grades: { loophole: 'missed', refund: 'strong', barter: 'defensible', escalate: 'defensible' },
    reasons: {
      loophole: 'A screaming timer is disclosure, but it does not answer the disputed soul conversion or bureau threat.',
      refund: 'Cancellation removes the disputed charge and reduces the chance of infernal review.',
      barter: 'A limited settlement creates a compromise, although the scream sample introduces fresh risk.',
      escalate: 'Infernal Accounts can rule on the conversion, but inviting their attention has a clear cost.'
    }
  },
  's2-t05-banshee-influencer': {
    focus: 'How does the sponsored audience change the cost of an ordinary replacement dispute?',
    grades: { refund: 'strong', policy: 'defensible', kindness: 'strong', ban: 'missed' },
    reasons: {
      refund: 'A fast replacement repairs the failed product before the muted kit becomes the whole campaign.',
      policy: 'A return-first process is defensible, but slow for a public sponsored failure.',
      kindness: 'A public apology and shared safety language address both trust and audience risk.',
      ban: 'Ending the sponsorship punishes the reporter and makes the public failure look deliberate.'
    }
  },
  's3-f01-greg-referral': {
    focus: 'What did Greg\'s referral promise about the way this new customer would be treated?',
    grades: { kindness: 'strong', policy: 'defensible', escalate: 'defensible' },
    reasons: {
      kindness: 'Protected support and the familiar checklist honor the trust carried by Greg\'s referral.',
      policy: 'Account-ownership procedure is relevant, but refusing help ignores a potentially unsafe ceiling.',
      escalate: 'New Accounts can protect the onboarding path, though it delays immediate safety guidance.'
    }
  },
  's3-t01-necromancer-renewal': {
    focus: 'Can a dissolved estate meaningfully consent to another renewal?',
    grades: { loophole: 'missed', refund: 'strong', escalate: 'defensible', exorcise: 'defensible' },
    reasons: {
      loophole: 'Advisory skulls do not resolve whether the dissolved estate authorized a new charge.',
      refund: 'Cancellation and restitution answer the estate\'s lack of present consent.',
      escalate: 'Legal Necromancy can define dissolution, but the disputed money remains held.',
      exorcise: 'Unbinding the contract removes the renewal mechanism from the estate ledger.'
    }
  },
  's3-t02-angel-firewall': {
    focus: 'Which blocked traffic turns a configuration complaint into an urgent service failure?',
    grades: { policy: 'missed', refund: 'strong', escalate: 'defensible', exorcise: 'defensible' },
    reasons: {
      policy: 'Upselling configuration does not restore the prayers and receipts the firewall is actively blocking.',
      refund: 'A service credit plus an expedited patch directly addresses the outage.',
      escalate: 'Compliance is the right specialist when blessed rules are blocking divine and financial traffic.',
      exorcise: 'Deconsecrating the rules can restore traffic quickly, but removes safeguards along with the fault.'
    },
    incident: {
      durationMs: 70000,
      expiryDelta: { reputation: -4, soulRisk: 3, inboxHeat: 2 },
      expiryText: 'Another prayer and a stack of receipts bounce publicly off the firewall.',
      bonusInsight: 1
    }
  },
  's3-t03-vampire-class-action': {
    focus: 'What remedy could prevent one defective product from becoming a class-wide grievance?',
    grades: { kindness: 'strong', loophole: 'missed', escalate: 'defensible', barter: 'defensible' },
    reasons: {
      kindness: 'Replacement lenses and support language address the defect and the personal harm it revealed.',
      loophole: 'Redefining reflection avoids the remedy while strengthening the class complaint.',
      escalate: 'Legal review is prudent for a class action, although it does not immediately help affected customers.',
      barter: 'Replacement for voluntary testimony can gather evidence, but risks looking like reputation management.'
    }
  },
  's3-t04-shadow-boss': {
    focus: 'What distinguishes account abuse from a normal manager-approval dispute?',
    grades: { ban: 'strong', policy: 'missed', exorcise: 'strong', escalate: 'defensible' },
    reasons: {
      ban: 'Invalidating the shadow\'s tokens stops the unauthorized account use immediately.',
      policy: 'Requiring approval from the boss empowers the identity accused of abusing the discount.',
      exorcise: 'Severing the shadow from payroll removes the access path behind the theft.',
      escalate: 'HR is a relevant authority, but euphemistic escalation may obscure the urgent account compromise.'
    }
  },
  's3-t05-coupon-mice': {
    focus: 'Which detail makes this both a discount issue and a security incident?',
    grades: { refund: 'strong', loophole: 'missed', exorcise: 'strong', barter: 'defensible' },
    reasons: {
      refund: 'Honoring the discount while containing the mice resolves value and customer safety together.',
      loophole: 'Denying the coupon ignores that the duplicated mice know the customer\'s PIN.',
      exorcise: 'Returning the mice to one inert code removes the security exposure at its source.',
      barter: 'Studying the mice may explain the breach, but trades away a straightforward customer remedy.'
    }
  },
  's4-t01-executive-possession': {
    focus: 'Is the directive coming from management, the possession, or both?',
    grades: { policy: 'defensible', exorcise: 'strong', escalate: 'defensible', kindness: 'defensible' },
    reasons: {
      policy: 'A noncommittal acknowledgment buys time without adopting the harmful order, but leaves the possession active.',
      exorcise: 'Possession protocol directly separates the executive from the unsafe directive.',
      escalate: 'Executive Relations has the authority and specialty to intervene in possessed leadership.',
      kindness: 'Privately reaching the person beneath the possession may restore agency without public escalation.'
    },
    incident: {
      durationMs: 65000,
      expiryDelta: { cash: -10, reputation: -3, inboxHeat: 5 },
      expiryText: 'The possessed directive reaches the whole support floor and three refunds become retention rituals.',
      bonusInsight: 1
    }
  },
  's4-t02-bleeding-package': {
    focus: 'What must be handled first when the evidence is already public?',
    grades: { kindness: 'strong', policy: 'missed', exorcise: 'strong', escalate: 'defensible' },
    reasons: {
      kindness: 'Public accountability, cleanup, and safety steps respond to both the customer and the visible hazard.',
      policy: 'Calling the blood an anomaly-clause issue inflames the public evidence instead of containing it.',
      exorcise: 'Remote sealing stops the active package hazard before it spreads through the lobby.',
      escalate: 'The crisis queue is relevant, but a press statement alone does not stop the bleeding package.'
    }
  },
  's4-t03-data-export-blood': {
    focus: 'Which formats satisfy the request without introducing biological or ritual risk?',
    grades: { policy: 'strong', barter: 'defensible', exorcise: 'strong', escalate: 'defensible' },
    reasons: {
      policy: 'Standard CSV fulfills the export right while refusing an unsafe biological format.',
      barter: 'Blessed consulting may make the export usable, but monetizes a compliance request and adds ritual exposure.',
      exorcise: 'Sanitizing the ritual before export protects the data and prevents the spreadsheet from waking.',
      escalate: 'Privacy and Legal are valid owners, though the available safe format already offers a direct solution.'
    }
  },
  's4-t04-ghost-union': {
    focus: 'Are the ghosts a system threat, or workers describing uncompensated labor?',
    grades: { kindness: 'defensible', policy: 'missed', escalate: 'strong', ban: 'missed' },
    reasons: {
      kindness: 'Acknowledgment and documentation treat the haunting labor as the issue raised by the collective.',
      policy: 'Excluding non-corporeal workers repeats the exact lack of representation in the complaint.',
      escalate: 'HR is an appropriate authority when the subject is labor status and queue representation.',
      ban: 'Removing access silences the workers and turns a labor complaint into retaliation.'
    }
  },
  's4-t05-unsubscribe-link': {
    focus: 'Which detail shows that a normal preference-center delay is no longer acceptable?',
    grades: { kindness: 'strong', policy: 'missed', exorcise: 'strong', escalate: 'defensible' },
    reasons: {
      kindness: 'Immediate removal and retirement of the link match the customer\'s active safety problem.',
      policy: 'Ten business days is not responsive to a tracking link following Mina between rooms.',
      exorcise: 'Purging the entity removes the supernatural tracking mechanism directly.',
      escalate: 'Marketing Automation owns the tool, but escalation leaves the stalking behavior active for now.'
    }
  },
  's5-t01-inbox-self': {
    focus: 'What response preserves your agency when the inbox defines you as its own case?',
    grades: { kindness: 'defensible', policy: 'missed', exorcise: 'strong', escalate: 'defensible' },
    reasons: {
      kindness: 'Rejecting the ticket label asserts personhood without pretending the contradiction is harmless.',
      policy: 'Categorizing yourself accepts the inbox\'s premise and turns continued work into ownership.',
      exorcise: 'Breaking the inbox process directly contests its control, even at a steep personal cost.',
      escalate: 'Seeking outside authority may preserve agency, but management has already shaped the system.'
    },
    incident: {
      durationMs: 60000,
      expiryDelta: { sanity: -5, soulRisk: 5, containment: -3 },
      expiryText: 'The inbox completes its own assessment and adds you to the queue as company property.',
      bonusInsight: 1
    }
  },
  's5-t02-grand-escalation': {
    focus: 'What pattern are enterprise leaders trying to turn into policy?',
    grades: { policy: 'strong', kindness: 'strong', barter: 'strong', exorcise: 'strong' },
    reasons: {
      policy: 'Documented consistency answers the complaint, but risks validating harmful enterprise priorities.',
      kindness: 'Refusing customer harm protects the principle behind an empathy-focused career.',
      barter: 'A suffering-neutral experiment offers a concrete compromise instead of accepting the false choice.',
      exorcise: 'Sealing the enterprise door rejects the pressure at its source, with clear operational cost.'
    }
  },
  's5-t03-crayon-summoner': {
    focus: 'What changes when the person behind the accidental summoning is a child?',
    grades: { kindness: 'strong', policy: 'missed', exorcise: 'strong', escalate: 'defensible' },
    reasons: {
      kindness: 'A calm explanation protects the child while closing the dangerous support doorway.',
      policy: 'Guardian procedure matters, but refusing immediate help leaves a child with an active closet portal.',
      exorcise: 'Sealing the logo removes the active summoning path before it can spread.',
      escalate: 'Customer Success can own the strange doorway, but the child still needs immediate safety action.'
    }
  },
  's5-t04-mirror-review': {
    focus: 'Is compliance with the review worth surrendering control to the mirror?',
    grades: { kindness: 'strong', policy: 'missed', exorcise: 'strong', escalate: 'defensible' },
    reasons: {
      kindness: 'A grounded self-review keeps the useful reflection while refusing the mirror\'s control.',
      policy: 'Exact compliance rewards the coercive eye-contact instruction and erodes your agency.',
      exorcise: 'Covering the mirror interrupts the coercion and protects the person completing the review.',
      escalate: 'A manager can challenge the process, although the mirror may already influence that chain.'
    }
  },
  's5-t05-offer-letter': {
    focus: 'Which cost are you willing to carry after seeing the pattern of your first week?',
    grades: { kindness: 'strong', loophole: 'strong', exorcise: 'strong', escalate: 'defensible' },
    reasons: {
      kindness: 'Declining to protect customers is a coherent culmination of an empathy-driven career.',
      loophole: 'Editing the soul clause turns legal instinct into a deliberate ending rather than blind acceptance.',
      exorcise: 'Destroying the offer is a decisive rejection of the system, paid for with personal strain.',
      escalate: 'Deferring the choice fits an escalation path, but leaves the final terms in someone else\'s hands.'
    }
  }
};
