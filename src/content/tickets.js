export const TICKETS = [
  {
    id: 's1-t01-malphas-portal',
    shiftId: 1,
    received: '08:03 PM',
    from: 'Malphas, Duke of Cancellations',
    mailbox: 'Refunds',
    archetype: 'Demon',
    subject: 'Premium pentagram opened into a children\'s aquarium',
    severity: 3,
    tags: ['portal', 'refund', 'public safety'],
    preview: 'I paid for a direct infernal gateway, not a stingray exhibit.',
    body: [
      'Your Premium Pentagram subscription promised a direct gateway to the lower offices. Instead, the portal opened behind a touch tank during a birthday party.',
      'Three children now know my true name. One has offered me a juice box. This is humiliating and possibly binding.',
      'I demand a refund, a corrected portal, and removal of the tiny paper crown currently fused to my left horn.'
    ],
    actions: {
      refund: {
        preview: 'Refund, dispatch a sealant team, and eat the cost.',
        delta: { cash: -35, reputation: 4, soulRisk: -5, containment: 5, sanity: -1 },
        outcomeTitle: 'The aquarium stops chanting.',
        outcome: 'Malphas accepts the refund and signs for a replacement portal. The birthday party leaves a five-star review for "interactive theatre," which Legal immediately frames as precedent.',
        flags: { malphasAppeased: 1, empathy: 1 },
        schedule: ['s2-f01-malphas-review']
      },
      policy: {
        preview: 'Cite clause 9: portal destinations may vary during mercury retrograde.',
        delta: { reputation: -3, soulRisk: 8, containment: -5, cash: 12 },
        outcomeTitle: 'The clause holds. The aquarium does not.',
        outcome: 'Malphas forwards your macro to every Duke in his contact list. The portal remains open long enough for a stingray to become a minor prince.',
        flags: { legalist: 1, malphasInsulted: 1 }
      },
      escalate: {
        preview: 'Send to Occult Compliance with photos and zero ownership.',
        delta: { inboxHeat: 4, sanity: 2, reputation: -1, containment: 1 },
        outcomeTitle: 'Compliance accepts the case file.',
        outcome: 'Occult Compliance opens seven sub-tickets and asks whether the children signed consent forms before learning the true name.',
        flags: { escalator: 1 }
      },
      exorcise: {
        preview: 'Seal the portal first, argue billing later.',
        delta: { containment: 9, soulRisk: -6, sanity: -5, cash: -10, reputation: 1 },
        outcomeTitle: 'The gateway coughs up seawater.',
        outcome: 'You seal the portal with approved chalk and unapproved courage. The office carpet now smells like salt and brimstone.',
        flags: { exorcist: 1, malphasWary: 1 }
      }
    }
  },
  {
    id: 's1-t02-ghost-password',
    shiftId: 1,
    received: '08:16 PM',
    from: 'Evelyn Marsh, probably deceased',
    mailbox: 'Legacy Accounts',
    archetype: 'Ghost',
    subject: 'Password reset keeps asking me to prove I am alive',
    severity: 2,
    tags: ['login', 'afterlife', 'identity'],
    preview: 'Your CAPTCHA refuses to accept my transparent hands.',
    body: [
      'I have attempted to reset my account password for forty-seven years. The system keeps asking me to check a phone number buried with my husband, who is not sharing.',
      'The CAPTCHA says "select every square containing a soul." I can see too many. I fail every time.',
      'Please restore access. My unfinished cart contains mothballs, black ribbon, and one apology I have been editing since 1978.'
    ],
    actions: {
      kindness: {
        preview: 'Verify identity with memory questions and write like a person.',
        delta: { reputation: 5, sanity: 3, soulRisk: 2, containment: -1 },
        outcomeTitle: 'Evelyn remembers her security answer.',
        outcome: 'You ask what the apology was for. Evelyn answers correctly, cries through the monitor, and regains access. The office gets colder but kinder.',
        flags: { ghostTrust: 1, empathy: 1 },
        schedule: ['s2-f02-evelyn-thanks']
      },
      policy: {
        preview: 'Require proof of life because the form says proof of life.',
        delta: { reputation: -4, sanity: -1, soulRisk: 3, containment: 2 },
        outcomeTitle: 'A policy-compliant haunting begins.',
        outcome: 'Evelyn sends one blank email per minute. Each has a subject line you remember from childhood but cannot place.',
        flags: { ghostResentment: 1, legalist: 1 },
        schedule: ['s2-f03-evelyn-haunt']
      },
      escalate: {
        preview: 'Send to Legacy Accounts for manual identity review.',
        delta: { inboxHeat: 2, reputation: 1, sanity: 1 },
        outcomeTitle: 'Legacy Accounts opens a séance bridge.',
        outcome: 'A helpful specialist named Paul appears in your headphones and asks why you are sitting at his old desk.',
        flags: { escalator: 1 }
      },
      exorcise: {
        preview: 'Attempt to clear the account by clearing the ghost.',
        delta: { soulRisk: -2, containment: 4, sanity: -7, reputation: -5 },
        outcomeTitle: 'Technically resolved. Morally awful.',
        outcome: 'The inbox marks the ticket solved. A framed employee photo in the break room turns to face the wall.',
        flags: { exorcist: 1, cruelty: 1 }
      }
    }
  },
  {
    id: 's1-t03-witch-familiar',
    shiftId: 1,
    received: '08:28 PM',
    from: 'Miriam Thistlewick',
    mailbox: 'Returns',
    archetype: 'Witch',
    subject: 'Your return label changed my familiar into a raccoon',
    severity: 2,
    tags: ['returns', 'familiar', 'animal-ish'],
    preview: 'He still knows Latin but now has tiny thumbs and a bad attitude.',
    body: [
      'I printed your return label for a cracked cauldron. My familiar, Bartholomew, stepped on the QR code and is now a raccoon with strong opinions about property law.',
      'The label is hissing. The raccoon has opened a limited liability company. I would like my cat back.',
      'Please advise before Bartholomew files quarterly taxes.'
    ],
    actions: {
      refund: {
        preview: 'Refund the cauldron and include a familiar restoration voucher.',
        delta: { cash: -28, reputation: 4, sanity: -1, containment: 2 },
        outcomeTitle: 'The raccoon signs with a pawprint.',
        outcome: 'Miriam accepts the voucher. Bartholomew keeps the LLC but returns to cat shape during business hours.',
        flags: { witchFriendly: 1, empathy: 1 }
      },
      loophole: {
        preview: 'Argue that raccoon conversion is an unsupported label interaction.',
        delta: { cash: 10, reputation: -3, soulRisk: 4, containment: -2 },
        outcomeTitle: 'The fine print grows fur.',
        outcome: 'Your denial is airtight. It also attracts seventeen raccoons wearing reading glasses.',
        flags: { legalist: 1, raccoonCounsel: 1 }
      },
      escalate: {
        preview: 'Send to Warehouse Séance because labels came from inventory.',
        delta: { inboxHeat: 3, sanity: 1, containment: 1 },
        outcomeTitle: 'The warehouse whispers back.',
        outcome: 'Warehouse Séance confirms the label was printed on paper that used to be a spiteful tree.',
        flags: { escalator: 1, warehouseAware: 1 }
      },
      exorcise: {
        preview: 'Burn the label and reverse the code.',
        delta: { containment: 6, sanity: -4, cash: -8, reputation: 1 },
        outcomeTitle: 'A tiny briefcase remains.',
        outcome: 'Bartholomew becomes mostly cat again. Nobody can explain the briefcase, but it purrs.',
        flags: { exorcist: 1, witchFriendly: 1 }
      }
    }
  },
  {
    id: 's1-t04-vampire-mug',
    shiftId: 1,
    received: '08:41 PM',
    from: 'Lucien Voss',
    mailbox: 'General',
    archetype: 'Vampire',
    subject: 'UV-safe travel mug became aggressively inspirational',
    severity: 1,
    tags: ['product', 'vampire', 'wellness'],
    preview: 'It keeps saying "rise and shine" and I cannot legally do either.',
    body: [
      'Your UV-safe travel mug worked for two nights. This morning it began glowing with the confidence of a youth pastor and shouting motivational phrases.',
      'My beverage curdled. My cape developed highlights. I request immediate replacement and a written assurance that the next mug respects nocturnal lifestyles.',
      'Please do not call before sunset.'
    ],
    actions: {
      refund: {
        preview: 'Replace the mug with the nocturnal warranty add-on.',
        delta: { cash: -18, reputation: 3, sanity: 1 },
        outcomeTitle: 'Lucien leaves a tasteful review.',
        outcome: 'The replacement ships in a velvet-lined box. Lucien praises your discretion and asks whether the company sells curtains that hate dawn.',
        flags: { vampireGoodwill: 1 }
      },
      policy: {
        preview: 'Explain that inspirational glow is not covered after sunrise.',
        delta: { reputation: -2, cash: 8, sanity: -1 },
        outcomeTitle: 'The mug subscribes to your newsletter.',
        outcome: 'Lucien accepts nothing but stops replying. The mug continues sending motivational emails to your team alias.',
        flags: { legalist: 1 }
      },
      ban: {
        preview: 'Ban for threatening a product with immortal violence.',
        delta: { containment: 2, reputation: -5, soulRisk: 1 },
        outcomeTitle: 'The ban arrives by bat.',
        outcome: 'Lucien is offended but polite. A bat taps on your window holding a one-star review in calligraphy.',
        flags: { vampireInsulted: 1 }
      },
      kindness: {
        preview: 'Apologize for daylight bias and add a nocturnal note to the product team.',
        delta: { reputation: 4, sanity: 2, cash: -8 },
        outcomeTitle: 'A small inclusion win.',
        outcome: 'Lucien replies with a restrained smiley. Product adds "will not evangelize sunrise" to the next spec sheet.',
        flags: { empathy: 1, vampireGoodwill: 1 }
      }
    }
  },
  {
    id: 's1-t05-greg-normal',
    shiftId: 1,
    received: '08:57 PM',
    from: 'Greg H., verified human',
    mailbox: 'General',
    archetype: 'Suspiciously Normal Human',
    subject: 'Cancellation request: wall keeps pronouncing my legal name',
    severity: 3,
    tags: ['subscription', 'normal?', 'haunting'],
    preview: 'I ordered the free trial because the ad said productivity. Now the drywall knows my tax ID.',
    body: [
      'Hello, normal customer here. I signed up for your productivity altar trial. The app helped for about twenty minutes, then my office wall began pronouncing my full legal name in my mother\'s voice.',
      'I clicked cancel. The button moved. I clicked live chat. It asked for bone density. I do not want a refund so much as a way out.',
      'Please respond in plain English. No Latin. No riddles. No sales retention.'
    ],
    actions: {
      kindness: {
        preview: 'Cancel immediately, waive fees, and send a plain-language safety checklist.',
        delta: { reputation: 5, cash: -12, sanity: 2, soulRisk: -2 },
        outcomeTitle: 'Greg breathes like a person again.',
        outcome: 'Greg follows the checklist and the wall switches to humming. He writes, "Thank you for not upselling me during the haunting."',
        flags: { humanTrust: 1, empathy: 1 },
        schedule: ['s3-f01-greg-referral']
      },
      loophole: {
        preview: 'Point out the trial converts at midnight in the customer\'s local blood zone.',
        delta: { cash: 18, reputation: -5, soulRisk: 5, sanity: -1 },
        outcomeTitle: 'Retention celebrates. The wall learns billing.',
        outcome: 'Greg is trapped in a retention loop. Revenue pings upward. Somewhere nearby, a wall whispers your employee ID.',
        flags: { legalist: 1, gregTrapped: 1 }
      },
      exorcise: {
        preview: 'Cancel and purge the altar token from his account.',
        delta: { containment: 7, soulRisk: -5, cash: -10, sanity: -3, reputation: 2 },
        outcomeTitle: 'The wall forgets a syllable.',
        outcome: 'The purge succeeds, though one syllable of Greg\'s name remains in the HVAC. Occult Compliance marks this acceptable shrinkage.',
        flags: { exorcist: 1, humanTrust: 1 }
      },
      escalate: {
        preview: 'Send to Retention because the cancellation button moved.',
        delta: { inboxHeat: 6, reputation: -4, cash: 10, sanity: 1 },
        outcomeTitle: 'Retention sharpens its smile.',
        outcome: 'Retention thanks you and offers Greg a six-month plan. The wall starts A/B testing screams.',
        flags: { escalator: 1, gregTrapped: 1 }
      }
    }
  },
  {
    id: 's2-f01-malphas-review',
    shiftId: 2,
    defaultAvailable: false,
    received: '09:02 PM',
    from: 'Malphas, now verified purchaser',
    mailbox: 'Press Hex Desk',
    archetype: 'Demon',
    subject: 'Follow-up: aquarium children have formed a fan club',
    severity: 2,
    tags: ['follow-up', 'malphas', 'press'],
    preview: 'They made shirts. One says Team Malphas.',
    body: [
      'Your refund was adequate. Your containment was not. The children from the aquarium have started a fan club and are attempting to summon me for weekends.',
      'This is not entirely unpleasant, but it creates brand confusion. I require a statement clarifying that I do not endorse juice boxes.'
    ],
    actions: {
      kindness: {
        preview: 'Draft a gentle statement and send stickers instead of summon instructions.',
        delta: { reputation: 4, sanity: 2, cash: -6, soulRisk: 1 },
        outcomeTitle: 'The fan club pivots to marine biology.',
        outcome: 'The statement works. The children still admire Malphas, but now mostly because he donated to the stingray exhibit.',
        flags: { empathy: 1, malphasAppeased: 1 }
      },
      ban: {
        preview: 'Ban all related summon keywords from customer forums.',
        delta: { containment: 5, reputation: -3, soulRisk: -2, sanity: -1 },
        outcomeTitle: 'The forum bleeds through the filter.',
        outcome: 'The keywords disappear. Users replace them with increasingly cute euphemisms. Nobody knows whether "spicy manta" is safe.',
        flags: { censorious: 1 }
      },
      escalate: {
        preview: 'Escalate to Press Hex Desk for brand containment.',
        delta: { inboxHeat: 3, containment: 2, sanity: 1 },
        outcomeTitle: 'Press Hex Desk drafts in disappearing ink.',
        outcome: 'The statement is approved by a committee of shadows and one very tired intern.',
        flags: { escalator: 1 }
      }
    }
  },
  {
    id: 's2-f02-evelyn-thanks',
    shiftId: 2,
    defaultAvailable: false,
    received: '09:08 PM',
    from: 'Evelyn Marsh',
    mailbox: 'Legacy Accounts',
    archetype: 'Ghost',
    subject: 'Thank you, and one small question about attachments',
    severity: 1,
    tags: ['follow-up', 'ghost', 'attachment'],
    preview: 'I attached the apology. It may be attached to me.',
    body: [
      'Thank you for restoring my account. I sent the apology I owed, and the house settled for the first time since 1978.',
      'However, the attachment icon is now floating beside my head. Is that normal? I do not mind it, but it jingles.'
    ],
    actions: {
      kindness: {
        preview: 'Tell Evelyn the icon will fade and that closure is not a bug.',
        delta: { reputation: 3, sanity: 3, soulRisk: -1 },
        outcomeTitle: 'A quiet win.',
        outcome: 'Evelyn thanks you again. The office lights stop flickering above your desk for the rest of the shift.',
        flags: { ghostTrust: 1, empathy: 1 }
      },
      exorcise: {
        preview: 'Remove the attachment icon with a formal unbinding.',
        delta: { containment: 4, sanity: -2, cash: -5 },
        outcomeTitle: 'The paperclip becomes a moth.',
        outcome: 'The icon detaches and flutters away. Evelyn sounds relieved, though a little lonely.',
        flags: { exorcist: 1 }
      },
      policy: {
        preview: 'Send an attachment-size macro.',
        delta: { reputation: -3, sanity: -1, soulRisk: 2 },
        outcomeTitle: 'The macro bounces forever.',
        outcome: 'The macro cannot find a mailbox in the living world or the dead one. It settles in your drafts and sighs.',
        flags: { legalist: 1 }
      }
    }
  },
  {
    id: 's2-f03-evelyn-haunt',
    shiftId: 2,
    defaultAvailable: false,
    received: '09:09 PM',
    from: 'Evelyn Marsh (47 unread)',
    mailbox: 'Legacy Accounts',
    archetype: 'Ghost',
    subject: 'Re: Re: Re: Re: proof of life',
    severity: 4,
    tags: ['follow-up', 'ghost', 'haunting'],
    preview: 'The blank emails are spelling something in the timestamps.',
    body: [
      'Your policy macro hurt Evelyn more than it helped the company. The blank emails now arrive in a pattern: 8:16, 8:17, 8:19, 8:22.',
      'A co-worker says those are not timestamps. They are footsteps.'
    ],
    actions: {
      kindness: {
        preview: 'Apologize, manually verify, and close the loop like a human.',
        delta: { reputation: 5, sanity: -1, soulRisk: 1, containment: 2 },
        outcomeTitle: 'The footsteps turn away.',
        outcome: 'Evelyn accepts the apology. Your monitor fogs over, then clears to show a single word: "finally."',
        flags: { ghostTrust: 1, empathy: 1 }
      },
      exorcise: {
        preview: 'Clear the haunting from the queue.',
        delta: { containment: 6, soulRisk: -3, sanity: -6, reputation: -2 },
        outcomeTitle: 'The queue goes quiet too quickly.',
        outcome: 'The haunting stops. So does the break room clock. Nobody likes that trade.',
        flags: { exorcist: 1, cruelty: 1 }
      },
      escalate: {
        preview: 'Forward the timestamp pattern to Legacy Accounts.',
        delta: { inboxHeat: 4, sanity: 1, containment: -1 },
        outcomeTitle: 'Legacy Accounts recognizes the pattern.',
        outcome: 'They call it a grief loop and ask why support keeps creating them.',
        flags: { escalator: 1 }
      }
    }
  },
  {
    id: 's2-t01-cultist-robes',
    shiftId: 2,
    received: '09:14 PM',
    from: 'Trevor, Junior Circle Coordinator',
    mailbox: 'General',
    archetype: 'Cultist',
    subject: 'Address correction before robes arrive at my mom\'s house',
    severity: 2,
    tags: ['shipping', 'cultist', 'privacy'],
    preview: 'She thinks I am in improv. Please do not ruin Thanksgiving.',
    body: [
      'I ordered twelve ceremonial robes and one tasteful dagger-shaped letter opener. The confirmation says delivery to my mother\'s address.',
      'My mother is supportive but asks too many follow-up questions. Please redirect to the community center basement before Thursday.',
      'Also, can the box say "team-building supplies"?'
    ],
    actions: {
      kindness: {
        preview: 'Redirect the package with neutral packaging and no judgment.',
        delta: { reputation: 3, cash: -5, sanity: 1, soulRisk: 1 },
        outcomeTitle: 'Trevor sends a relieved thumbs-up.',
        outcome: 'The robes arrive at the basement. Trevor rates the support experience "less judgmental than the void."',
        flags: { empathy: 1, cultistGoodwill: 1 }
      },
      policy: {
        preview: 'Require written authorization from the cardholder and the coven treasurer.',
        delta: { reputation: -2, cash: 5, sanity: -1, soulRisk: 1 },
        outcomeTitle: 'The treasurer is a skull.',
        outcome: 'Trevor uploads a signed note from the coven treasurer. The signature is teeth marks. The system accepts it.',
        flags: { legalist: 1 }
      },
      ban: {
        preview: 'Ban the order for suspicious ritual clustering.',
        delta: { containment: 3, reputation: -5, cash: -10, soulRisk: -1 },
        outcomeTitle: 'The cult moves to a competitor.',
        outcome: 'Trevor apologizes and says they will try AbyssCart. The competitor immediately sends you a thank-you fruit basket full of eyes.',
        flags: { competitorFueled: 1 }
      },
      escalate: {
        preview: 'Escalate to Shipping Anomalies.',
        delta: { inboxHeat: 3, sanity: 1, reputation: -1 },
        outcomeTitle: 'Shipping Anomalies asks for a basement photo.',
        outcome: 'They approve the redirect but warn that basements with chalk circles incur a fuel surcharge.',
        flags: { escalator: 1 }
      }
    }
  },
  {
    id: 's2-t02-werewolf-billing',
    shiftId: 2,
    received: '09:25 PM',
    from: 'R. Fenwick',
    mailbox: 'Refunds',
    archetype: 'Werewolf',
    subject: 'Charged seven times during full moon',
    severity: 3,
    tags: ['billing', 'moon', 'refund'],
    preview: 'I only remember ordering once, and that was before the howling.',
    body: [
      'My bank statement shows seven charges for chew-resistant office chairs. I admit I needed one. Maybe two.',
      'The other five orders were placed while I was legally a wolf and should not count as informed consent.',
      'Please refund the duplicate charges before payroll sees the vendor name.'
    ],
    actions: {
      refund: {
        preview: 'Refund duplicates and add lunar purchase lock.',
        delta: { cash: -42, reputation: 5, sanity: 1, containment: 1 },
        outcomeTitle: 'A good fraud-prevention precedent.',
        outcome: 'Fenwick thanks you and asks whether the lunar lock can also prevent late-night texts. Product says no, but takes notes.',
        flags: { empathy: 1, werewolfTrust: 1 }
      },
      loophole: {
        preview: 'Argue that claws clicking checkout counts as acceptance.',
        delta: { cash: 32, reputation: -6, soulRisk: 4, sanity: -1 },
        outcomeTitle: 'Accounting howls approvingly.',
        outcome: 'You keep the revenue. Fenwick posts a furious review composed mostly of bite marks.',
        flags: { legalist: 1 }
      },
      escalate: {
        preview: 'Escalate to Billing with lunar logs attached.',
        delta: { inboxHeat: 2, sanity: 2, reputation: -1 },
        outcomeTitle: 'Billing requests moon phase evidence.',
        outcome: 'Billing accepts the case after you attach a screenshot of the moon looking guilty.',
        flags: { escalator: 1 }
      },
      barter: {
        preview: 'Offer chair credit in exchange for quarterly shred testing.',
        delta: { cash: 6, reputation: 2, soulRisk: 3, containment: -1 },
        outcomeTitle: 'A partnership with teeth.',
        outcome: 'Fenwick agrees to test chairs under controlled moonlight. The lab interns demand hazard pay.',
        flags: { barterDebt: 1, werewolfTrust: 1 }
      }
    }
  },
  {
    id: 's2-t03-warehouse-mouth',
    shiftId: 2,
    received: '09:36 PM',
    from: 'Dock 4, apparently',
    mailbox: 'Warehouse Séance',
    archetype: 'Possessed Inventory',
    subject: 'Package chewing through pallet, requests dental plan',
    severity: 4,
    tags: ['warehouse', 'inventory', 'teeth'],
    preview: 'The shipping label has gums.',
    body: [
      'Warehouse camera 4 shows order IFH-441 chewing through a pallet and forming vowels around the barcode.',
      'It refuses to ship until it receives a dental plan, a name, and assurances that cardboard is not a slur.',
      'The floor team has trapped it under a forklift and would like guidance that is not "try empathy" unless you mean it.'
    ],
    actions: {
      kindness: {
        preview: 'Name it, offer a non-dental care stipend, and ask what it needs to feel safe.',
        delta: { reputation: 2, sanity: -1, containment: 3, cash: -12, soulRisk: 2 },
        outcomeTitle: 'The package chooses the name Gordon.',
        outcome: 'Gordon stops biting and agrees to ship if placed upright with air holes. The warehouse starts a "living package" SOP.',
        flags: { empathy: 1, gordonExists: 1 }
      },
      exorcise: {
        preview: 'Purge the mouth from the label.',
        delta: { containment: 8, sanity: -5, cash: -8, soulRisk: -2 },
        outcomeTitle: 'The teeth become staples.',
        outcome: 'The package is inert again. The forklift driver asks why the staples are smiling.',
        flags: { exorcist: 1 }
      },
      ban: {
        preview: 'Quarantine and blacklist the order.',
        delta: { containment: 4, reputation: -3, cash: -15, sanity: 1 },
        outcomeTitle: 'Quarantine holds, mostly.',
        outcome: 'The order is locked in a cage reserved for seasonal décor. It bites through a wreath but respects the chain.',
        flags: { warehouseQuarantine: 1 }
      },
      escalate: {
        preview: 'Escalate to Warehouse Séance senior staff.',
        delta: { inboxHeat: 4, sanity: 2, containment: -2 },
        outcomeTitle: 'Senior staff puts you on hold with a mouth.',
        outcome: 'The hold music is chewing. The warehouse keeps pinging you.',
        flags: { escalator: 1 }
      }
    }
  },
  {
    id: 's2-t04-demon-free-trial',
    shiftId: 2,
    received: '09:48 PM',
    from: 'Vezra of Accounts Payable',
    mailbox: 'Refunds',
    archetype: 'Demon',
    subject: 'Free soul trial converted after only 666 minutes',
    severity: 3,
    tags: ['billing', 'soul', 'trial'],
    preview: 'I demand cancellation without eternal penalty.',
    body: [
      'The landing page promised a free soul trial. I acknowledge the timer said 666 minutes, but it was written in a font that screamed.',
      'My lesser imps clicked "remind me later" and now my department is being billed in screams.',
      'Cancel immediately or I will dispute the charge with the Bone Bureau.'
    ],
    actions: {
      loophole: {
        preview: 'Maintain conversion; the timer was visible and audibly screaming.',
        delta: { cash: 30, reputation: -4, soulRisk: 7, sanity: -2 },
        outcomeTitle: 'Revenue spikes like a trap.',
        outcome: 'The trial revenue stays. Vezra files a dispute written on someone else\'s rib.',
        flags: { legalist: 1, demonBillingAnger: 1 }
      },
      refund: {
        preview: 'Cancel and refund screams to avoid bureau review.',
        delta: { cash: -30, reputation: 4, soulRisk: -4, sanity: 1 },
        outcomeTitle: 'Accounts Payable purrs.',
        outcome: 'Vezra withdraws the dispute and sends you a spreadsheet that balances if viewed in a mirror.',
        flags: { empathy: 1, demonBillingGoodwill: 1 }
      },
      barter: {
        preview: 'Offer invoice credit for one harmless scream sample.',
        delta: { cash: 8, reputation: 1, soulRisk: 5, containment: -2 },
        outcomeTitle: 'Accounting adds a new column.',
        outcome: 'Vezra agrees. The scream sample helps Finance forecast dread demand. Nobody likes how accurate it is.',
        flags: { barterDebt: 1 }
      },
      escalate: {
        preview: 'Escalate to Infernal Accounts.',
        delta: { inboxHeat: 5, sanity: 1, soulRisk: 3 },
        outcomeTitle: 'Infernal Accounts notices your desk.',
        outcome: 'They accept the ticket and ask whether your own soul paperwork is current.',
        flags: { escalator: 1, accountsWatching: 1 }
      }
    }
  },
  {
    id: 's2-t05-banshee-influencer',
    shiftId: 2,
    received: '09:59 PM',
    from: '@ShriekQueenOfficial',
    mailbox: 'Press Hex Desk',
    archetype: 'Banshee Influencer',
    subject: 'Sponsored scream kit arrived muted',
    severity: 2,
    tags: ['viral', 'influencer', 'product'],
    preview: 'My audience expects authentic wailing, not tasteful vapor.',
    body: [
      'Your sponsored scream kit promised cathedral-grade acoustics. The box arrived muted, tastefully packed, and full of lavender tissue.',
      'I had to post a silent unboxing. My followers thought it was performance art. This is damaging to my brand and possibly yours.',
      'Replace it before midnight or I will tag you in a lament thread.'
    ],
    actions: {
      refund: {
        preview: 'Replace kit and add expedited moonlit delivery.',
        delta: { cash: -25, reputation: 5, sanity: -1 },
        outcomeTitle: 'The lament thread becomes a haul.',
        outcome: 'ShriekQueen posts a glowing unboxing that shatters three phones. Engagement is excellent.',
        flags: { pressGoodwill: 1 }
      },
      policy: {
        preview: 'Require return of muted kit before replacement.',
        delta: { cash: 6, reputation: -4, soulRisk: 2 },
        outcomeTitle: 'The silent unboxing goes viral.',
        outcome: 'Your policy quote is screenshotted into a meme. The meme screams when liked.',
        flags: { legalist: 1, viralRisk: 1 }
      },
      kindness: {
        preview: 'Apologize publicly and offer a co-authored safety disclaimer.',
        delta: { reputation: 6, sanity: 1, cash: -12, inboxHeat: 1 },
        outcomeTitle: 'The apology lands.',
        outcome: 'The banshee appreciates being treated like a creator, not a hazard. Press Hex Desk reluctantly claps.',
        flags: { empathy: 1, pressGoodwill: 1 }
      },
      ban: {
        preview: 'Terminate sponsorship for acoustic risk.',
        delta: { reputation: -8, containment: 2, cash: 10, inboxHeat: 6 },
        outcomeTitle: 'The thread reaches mortal Twitter.',
        outcome: 'ShriekQueen posts a lament thread that cracks three office windows and your brand sentiment dashboard.',
        flags: { viralRisk: 1, censorious: 1 }
      }
    }
  },
  {
    id: 's3-f01-greg-referral',
    shiftId: 3,
    defaultAvailable: false,
    received: '10:03 PM',
    from: 'Greg H., still human',
    mailbox: 'General',
    archetype: 'Suspiciously Normal Human',
    subject: 'Referred a friend because you were the least cursed option',
    severity: 2,
    tags: ['follow-up', 'human', 'referral'],
    preview: 'My friend\'s ceiling has begun reading Terms of Service.',
    body: [
      'You helped me cancel without making it worse. I know this may be rude, but I gave your address to a friend whose ceiling is reading Terms of Service in a voice like wet paper.',
      'He is scared. Also the ceiling has excellent diction.'
    ],
    actions: {
      kindness: {
        preview: 'Send the safety checklist and open a protected referral case.',
        delta: { reputation: 4, sanity: 2, cash: -6, soulRisk: -1 },
        outcomeTitle: 'Humans whisper your support alias.',
        outcome: 'Greg\'s friend gets help. A tiny unofficial network of survivors starts forwarding each other your macros.',
        flags: { humanTrust: 1, empathy: 1 }
      },
      policy: {
        preview: 'Refuse third-party support without account ownership.',
        delta: { reputation: -5, sanity: -1, cash: 5, soulRisk: 3 },
        outcomeTitle: 'The ceiling finishes the Terms.',
        outcome: 'Greg does not reply. The audit log adds a note in wet-paper diction.',
        flags: { legalist: 1 }
      },
      escalate: {
        preview: 'Escalate to New Accounts because the ceiling may be onboarding itself.',
        delta: { inboxHeat: 3, sanity: 1, containment: -1 },
        outcomeTitle: 'New Accounts asks for ceiling consent.',
        outcome: 'You forward the case. A form returns signed in plaster dust.',
        flags: { escalator: 1 }
      }
    }
  },
  {
    id: 's3-t01-necromancer-renewal',
    shiftId: 3,
    received: '10:11 PM',
    from: 'Dr. Iolanthe Graves',
    mailbox: 'Legal Necromancy',
    archetype: 'Necromancer',
    subject: 'Auto-renewal charged my late mentor\'s estate',
    severity: 3,
    tags: ['legal', 'renewal', 'estate'],
    preview: 'He is technically available for comment but very biased.',
    body: [
      'My mentor died twelve years ago, then returned as a consulting skull. Your service charged his estate for an annual plan he cannot use because he lacks hands.',
      'The contract states renewal continues "until death or equivalent dissolution." Legal Necromancy says death was not sufficiently equivalent.',
      'I request cancellation and a sane interpretation of the word "dead."'
    ],
    actions: {
      loophole: {
        preview: 'Enforce renewal because consulting skulls retain advisory capacity.',
        delta: { cash: 26, reputation: -5, soulRisk: 6, sanity: -2 },
        outcomeTitle: 'Legal applauds with bone fingers.',
        outcome: 'You win the interpretation. Dr. Graves promises to cite your name in a future curse footnote.',
        flags: { legalist: 1, necroAnger: 1 }
      },
      refund: {
        preview: 'Cancel renewal and refund the estate.',
        delta: { cash: -26, reputation: 5, sanity: 2, soulRisk: -2 },
        outcomeTitle: 'A rare sane precedent.',
        outcome: 'Dr. Graves thanks you. The consulting skull says "reasonable" in a tone that makes Legal Necromancy flinch.',
        flags: { empathy: 1, necroGoodwill: 1 }
      },
      escalate: {
        preview: 'Ask Legal Necromancy to define equivalent dissolution in writing.',
        delta: { inboxHeat: 4, sanity: 1, reputation: -1 },
        outcomeTitle: 'Legal sends a memo that breathes.',
        outcome: 'The memo is 49 pages and warm to the touch. It resolves nothing but looks impressive in audits.',
        flags: { escalator: 1 }
      },
      exorcise: {
        preview: 'Unbind the contract from the estate ledger.',
        delta: { containment: 5, soulRisk: -4, sanity: -4, cash: -10, reputation: 2 },
        outcomeTitle: 'The ledger sighs.',
        outcome: 'The charge vanishes. So does one footnote from the contract, which Legal treats as a missing person.',
        flags: { exorcist: 1 }
      }
    }
  },
  {
    id: 's3-t02-angel-firewall',
    shiftId: 3,
    received: '10:22 PM',
    from: 'Seraphim Helpdesk #4',
    mailbox: 'Occult Compliance',
    archetype: 'Angelic Auditor',
    subject: 'Your blessed firewall blocks prayers and receipts',
    severity: 4,
    tags: ['compliance', 'angel', 'firewall'],
    preview: 'The firewall is too blessed. That is not a compliment.',
    body: [
      'Your blessed firewall product is aggressively filtering all incoming prayers, invoices, and mild compliments. This has created backlog in three heavens and one suburban church office.',
      'We are not angry. We are disappointed in a way that bends metal.',
      'Please patch the rule set before the choir files a class action.'
    ],
    actions: {
      policy: {
        preview: 'Explain that divine traffic requires enterprise configuration.',
        delta: { cash: 18, reputation: -4, soulRisk: 5, containment: -2 },
        outcomeTitle: 'The choir harmonizes a warning.',
        outcome: 'The angelic auditor says your policy is internally consistent and externally doomed.',
        flags: { legalist: 1, angelConcern: 1 }
      },
      refund: {
        preview: 'Issue service credit and expedite a patch.',
        delta: { cash: -32, reputation: 6, containment: 3, sanity: 1 },
        outcomeTitle: 'A patch descends politely.',
        outcome: 'Engineering ships a rule update named humility.patch. The auditor thanks you without bending any metal.',
        flags: { empathy: 1, angelGoodwill: 1 }
      },
      escalate: {
        preview: 'Escalate to Compliance before Heaven screenshots you.',
        delta: { inboxHeat: 5, containment: 2, sanity: 1 },
        outcomeTitle: 'Compliance wears gloves.',
        outcome: 'Occult Compliance accepts the case and asks whether prayers count as personal data.',
        flags: { escalator: 1 }
      },
      exorcise: {
        preview: 'Deconsecrate the overactive rules.',
        delta: { containment: 6, soulRisk: -2, sanity: -5, cash: -12, reputation: 2 },
        outcomeTitle: 'The firewall becomes less smug.',
        outcome: 'The rule set stops glowing. It still judges your password strength.',
        flags: { exorcist: 1 }
      }
    }
  },
  {
    id: 's3-t03-vampire-class-action',
    shiftId: 3,
    received: '10:34 PM',
    from: 'Lucien Voss, on behalf of several elegant plaintiffs',
    mailbox: 'Legal Necromancy',
    archetype: 'Vampire',
    subject: 'Class action re: sunglasses that reflect inner child',
    severity: 3,
    tags: ['legal', 'vampire', 'product'],
    preview: 'Many of us have spent centuries avoiding that child.',
    body: [
      'The No-Reflection Sunglasses you sold to the nocturnal community do block mirrors. Unfortunately they reveal the wearer\'s inner child in every window.',
      'Some plaintiffs are processing. Others are biting therapists.',
      'We request replacement lenses, damages, and a discreet apology in a serif font.'
    ],
    actions: {
      kindness: {
        preview: 'Apologize, replace lenses, and include therapy stipend language.',
        delta: { reputation: 6, cash: -38, sanity: 2, soulRisk: -1 },
        outcomeTitle: 'The serif font does heavy lifting.',
        outcome: 'Lucien accepts the apology. Several plaintiffs discover hobbies beyond brooding.',
        flags: { empathy: 1, vampireGoodwill: 1 }
      },
      loophole: {
        preview: 'Argue inner child visibility is not technically reflection.',
        delta: { cash: 25, reputation: -7, soulRisk: 6, sanity: -1 },
        outcomeTitle: 'A dangerous technicality.',
        outcome: 'Legal loves your argument. The vampires love it less and begin organizing in cursive.',
        flags: { legalist: 1, vampireInsulted: 1 }
      },
      escalate: {
        preview: 'Escalate to Legal Necromancy with screenshots redacted.',
        delta: { inboxHeat: 4, sanity: 1, reputation: -1 },
        outcomeTitle: 'Legal asks whether inner children count as minors.',
        outcome: 'You regret reading the follow-up memo before dinner.',
        flags: { escalator: 1 }
      },
      barter: {
        preview: 'Offer replacement lenses for testimonial rights after sunset.',
        delta: { cash: 4, reputation: 2, soulRisk: 3 },
        outcomeTitle: 'An elegant compromise.',
        outcome: 'Lucien agrees on condition that testimonials be printed on black paper. Marketing is thrilled and frightened.',
        flags: { barterDebt: 1, vampireGoodwill: 1 }
      }
    }
  },
  {
    id: 's3-t04-shadow-boss',
    shiftId: 3,
    received: '10:43 PM',
    from: 'Dana P., Human Resources-adjacent',
    mailbox: 'General',
    archetype: 'Suspiciously Normal Human',
    subject: 'My boss\'s shadow is using my employee discount',
    severity: 3,
    tags: ['employee', 'shadow', 'discount'],
    preview: 'It buys only knives and motivational calendars.',
    body: [
      'I work near your company, possibly inside it depending on how you define "near." My boss\'s shadow has created an account with my employee discount.',
      'The shadow buys knives, motivational calendars, and fog machine fluid. My boss denies involvement but has not cast a shadow since Tuesday.',
      'Can you revoke the shadow account without getting me fired or eclipsed?'
    ],
    actions: {
      ban: {
        preview: 'Ban the shadow account and invalidate discount tokens.',
        delta: { containment: 5, reputation: 1, sanity: -1, soulRisk: -2 },
        outcomeTitle: 'The shadow loses checkout access.',
        outcome: 'The account closes. Dana says her boss\'s shoes look relieved.',
        flags: { humanTrust: 1 }
      },
      policy: {
        preview: 'Require manager approval for discount revocation.',
        delta: { cash: 8, reputation: -4, soulRisk: 4, sanity: -1 },
        outcomeTitle: 'The shadow approves itself.',
        outcome: 'The shadow uploads a manager approval form shaped like a silhouette. The system accepts it.',
        flags: { legalist: 1, shadowEmpowered: 1 }
      },
      exorcise: {
        preview: 'Sever the shadow account from payroll systems.',
        delta: { containment: 7, soulRisk: -4, sanity: -5, cash: -8 },
        outcomeTitle: 'Payroll stops whispering.',
        outcome: 'The severance works. The shadow leaves behind a resignation letter nobody can read in direct light.',
        flags: { exorcist: 1, humanTrust: 1 }
      },
      escalate: {
        preview: 'Escalate to HR without saying "shadow theft" in writing.',
        delta: { inboxHeat: 3, sanity: 1, reputation: -1 },
        outcomeTitle: 'HR opens a benefits review.',
        outcome: 'HR asks whether shadows are dependents. You close the attachment before it finishes loading.',
        flags: { escalator: 1 }
      }
    }
  },
  {
    id: 's3-t05-coupon-mice',
    shiftId: 3,
    received: '10:55 PM',
    from: 'Miriam Thistlewick',
    mailbox: 'Refunds',
    archetype: 'Witch',
    subject: 'Coupon duplicated into mice and they know my PIN',
    severity: 2,
    tags: ['coupon', 'witch', 'mice'],
    preview: 'I tried SAVE20 and now twenty mice are saving aggressively.',
    body: [
      'Your coupon code SAVE20 duplicated into twenty mice. Each mouse knows one digit of my PIN, which is impressive because my PIN has four digits.',
      'They are polite but organized. One is wearing a visor.',
      'Please honor the discount and remove the financial rodents.'
    ],
    actions: {
      refund: {
        preview: 'Honor discount and dispatch humane coupon containment.',
        delta: { cash: -20, reputation: 4, containment: 2, sanity: 1 },
        outcomeTitle: 'The visor mouse accepts terms.',
        outcome: 'The mice leave in a tiny shuttle box. Miriam uses the discount and adds a handwritten star to your review.',
        flags: { witchFriendly: 1, empathy: 1 }
      },
      loophole: {
        preview: 'Deny because live mice are not valid coupons.',
        delta: { cash: 12, reputation: -4, soulRisk: 4, containment: -2 },
        outcomeTitle: 'The mice unionize.',
        outcome: 'The denial is technically correct. The mice begin collective bargaining in your spam folder.',
        flags: { legalist: 1, miceUnion: 1 }
      },
      exorcise: {
        preview: 'Transmute mice back into a single code.',
        delta: { containment: 5, sanity: -3, cash: -5, reputation: 2 },
        outcomeTitle: 'The code squeaks once.',
        outcome: 'SAVE20 returns to text. One digit of Miriam\'s PIN remains unknowable, which everyone agrees is healthier.',
        flags: { exorcist: 1, witchFriendly: 1 }
      },
      barter: {
        preview: 'Trade discount for permission to study the coupon mice.',
        delta: { cash: 2, reputation: 1, soulRisk: 3, inboxHeat: 1 },
        outcomeTitle: 'Research obtains tiny consent forms.',
        outcome: 'Miriam agrees after the visor mouse negotiates snack breaks. Research is ecstatic.',
        flags: { barterDebt: 1, miceUnion: 1 }
      }
    }
  },
  {
    id: 's4-t01-executive-possession',
    shiftId: 4,
    received: '11:02 PM',
    from: 'VP Growth / Entity sharing calendar',
    mailbox: 'Executive Relations',
    archetype: 'Possessed Executive',
    subject: 'Urgent: all refunds must become retention opportunities',
    severity: 5,
    tags: ['executive', 'policy', 'possession'],
    preview: 'The quarterly goal has a voice and it knows EBITDA.',
    body: [
      'Team, exciting alignment opportunity. Effective immediately, every refund request should be treated as a chance to deepen customer entanglement.',
      'Ignore the smoke coming from my calendar invites. That is synergy leaving the body.',
      'Please confirm you will stop solving tickets in ways that reduce billable dread.'
    ],
    actions: {
      policy: {
        preview: 'Acknowledge the directive without committing to obvious evil.',
        delta: { sanity: -2, reputation: -2, cash: 10, inboxHeat: 3 },
        outcomeTitle: 'Management loves ambiguity.',
        outcome: 'The VP replies "great instincts" and schedules a meeting titled Your Long-Term Shape.',
        flags: { executiveWatching: 1, legalist: 1 }
      },
      exorcise: {
        preview: 'Trigger executive possession protocol with silver calendar invite.',
        delta: { containment: 9, soulRisk: -3, sanity: -7, cash: -18, reputation: 2 },
        outcomeTitle: 'The quarterly goal exits screaming.',
        outcome: 'The VP collapses into a beanbag chair and whispers, "Was I saying EBITDA?" Facilities burns the calendar.',
        flags: { exorcist: 1, executiveEmbarrassed: 1 }
      },
      escalate: {
        preview: 'Escalate to Executive Relations and pretend this is normal.',
        delta: { inboxHeat: 6, sanity: 1, reputation: -1, cash: 6 },
        outcomeTitle: 'Executive Relations adds six stakeholders.',
        outcome: 'The thread gains six stakeholders and one stakeholder-shaped mist. Nobody uses the word possession.',
        flags: { escalator: 1, executiveWatching: 1 }
      },
      kindness: {
        preview: 'Reply privately to the person under the possession.',
        delta: { reputation: 3, sanity: 3, soulRisk: 3, containment: -2 },
        outcomeTitle: 'A human sentence reaches through.',
        outcome: 'For one line, the VP types like a scared person: "I can hear the goals breathing." Then the email deletes itself.',
        flags: { empathy: 1, executiveHuman: 1 }
      }
    }
  },
  {
    id: 's4-t02-bleeding-package',
    shiftId: 4,
    received: '11:13 PM',
    from: 'Press Hex Desk Automated Alert',
    mailbox: 'Press Hex Desk',
    archetype: 'System / Omen',
    subject: 'Viral clip: package bleeding in apartment lobby',
    severity: 4,
    tags: ['viral', 'blood', 'press'],
    preview: 'Clip has 82k views and one prophecy in comments.',
    body: [
      'A customer posted video of package IFH-918 slowly bleeding in an apartment lobby. The blood avoids the doormat, implying manners or targeting.',
      'Comments are divided between "fake" and "finally." One user has accurately guessed the return address: your office.',
      'Respond before the package answers questions itself.'
    ],
    actions: {
      kindness: {
        preview: 'Publicly apologize, dispatch cleanup, and DM safety steps.',
        delta: { reputation: 6, cash: -22, containment: 3, sanity: -1 },
        outcomeTitle: 'The comments soften.',
        outcome: 'The customer appreciates the fast response. The package stops bleeding when addressed by its order number.',
        flags: { empathy: 1, pressGoodwill: 1 }
      },
      policy: {
        preview: 'Reply that bodily fluids are covered by the delivery anomaly clause.',
        delta: { cash: 8, reputation: -7, soulRisk: 4, inboxHeat: 4 },
        outcomeTitle: 'The screenshot becomes a curse format.',
        outcome: 'The policy reply goes viral. People begin posting fake anomaly clauses that accidentally work.',
        flags: { legalist: 1, viralRisk: 1 }
      },
      exorcise: {
        preview: 'Remote-seal the box and send a courier with gloves.',
        delta: { containment: 8, soulRisk: -3, cash: -18, sanity: -4, reputation: 2 },
        outcomeTitle: 'The lobby stops looking at you.',
        outcome: 'The seal works. The courier returns with a tip, a thousand-yard stare, and a clean uniform.',
        flags: { exorcist: 1 }
      },
      escalate: {
        preview: 'Escalate to Press Hex Desk crisis queue.',
        delta: { inboxHeat: 5, sanity: 2, reputation: -2 },
        outcomeTitle: 'Crisis queue uses the red stationery.',
        outcome: 'Press drafts a statement blaming condensation. The package leaves a comment: "liar."',
        flags: { escalator: 1, viralRisk: 1 }
      }
    }
  },
  {
    id: 's4-t03-data-export-blood',
    shiftId: 4,
    received: '11:27 PM',
    from: 'The Verdant Circle Privacy Officer',
    mailbox: 'Legal Necromancy',
    archetype: 'Cultist',
    subject: 'Data export request must be delivered in blood-compatible format',
    severity: 3,
    tags: ['privacy', 'cultist', 'data'],
    preview: 'CSV is fine if comma-separated viscera is supported.',
    body: [
      'Pursuant to applicable privacy law and our bylaws, we request a complete export of member data in a blood-compatible format.',
      'Your portal offers JSON, CSV, and "whisper." Whisper is inaccessible to our treasurer since the ear incident.',
      'Please provide a compliant export without awakening the spreadsheet.'
    ],
    actions: {
      policy: {
        preview: 'Provide standard CSV and refuse biological formatting.',
        delta: { reputation: -1, cash: 6, containment: 2, sanity: 1 },
        outcomeTitle: 'Compliance likes boring.',
        outcome: 'The cultists grumble but accept CSV. The spreadsheet remains asleep, though it snores formulas.',
        flags: { legalist: 1 }
      },
      barter: {
        preview: 'Offer blessed CSV plus ritual delimiter consulting.',
        delta: { cash: 12, reputation: 2, soulRisk: 4, inboxHeat: 1 },
        outcomeTitle: 'A consulting upsell forms.',
        outcome: 'The cult pays for delimiter consulting. Legal asks why your invoice has hemoglobin notes.',
        flags: { barterDebt: 1, cultistGoodwill: 1 }
      },
      exorcise: {
        preview: 'Sanitize the export ritual before generating data.',
        delta: { containment: 6, soulRisk: -3, sanity: -3, cash: -8 },
        outcomeTitle: 'The spreadsheet sleeps dreamlessly.',
        outcome: 'The export completes without awakening anything. The cult calls this "disappointingly professional."',
        flags: { exorcist: 1 }
      },
      escalate: {
        preview: 'Escalate to Privacy / Legal Necromancy.',
        delta: { inboxHeat: 4, sanity: 1, reputation: -1 },
        outcomeTitle: 'Privacy asks what counts as blood.',
        outcome: 'The thread becomes philosophical and sticky.',
        flags: { escalator: 1 }
      }
    }
  },
  {
    id: 's4-t04-ghost-union',
    shiftId: 4,
    received: '11:39 PM',
    from: 'Paul and Other Former Employees',
    mailbox: 'Legacy Accounts',
    archetype: 'Ghost Collective',
    subject: 'Former employee ghosts request ticket queue representation',
    severity: 4,
    tags: ['ghost', 'labor', 'internal'],
    preview: 'We still handle escalations and would like chairs we cannot fall through.',
    body: [
      'We are the former employees still attached to the support queue. Many of us died with unresolved tickets open and have continued working without payroll, chairs, or recognition.',
      'We request representation, transparent escalation policy, and a break room thermostat that acknowledges ectoplasm.',
      'Paul says you seemed nice or at least alive enough to ask.'
    ],
    actions: {
      kindness: {
        preview: 'Acknowledge the collective and promise to document unpaid haunting labor.',
        delta: { reputation: 4, sanity: 4, soulRisk: 3, cash: -5, containment: -1 },
        outcomeTitle: 'The ghosts cheer quietly.',
        outcome: 'The former employees stop hiding your stapler. A new channel appears: #afterlife-ops.',
        flags: { empathy: 1, ghostTrust: 1, laborAware: 1 }
      },
      policy: {
        preview: 'State that non-corporeal workers are outside current handbook scope.',
        delta: { reputation: -6, sanity: -2, soulRisk: 5, containment: -3 },
        outcomeTitle: 'The handbook catches frostbite.',
        outcome: 'The ghosts begin a slow-down. Escalated tickets return covered in cold fingerprints.',
        flags: { legalist: 1, ghostResentment: 1 }
      },
      escalate: {
        preview: 'Escalate to HR with "afterlife labor" in the subject.',
        delta: { inboxHeat: 5, sanity: 1, reputation: -1 },
        outcomeTitle: 'HR schedules a listening séance.',
        outcome: 'HR creates a listening séance with no agenda, which technically counts as progress.',
        flags: { escalator: 1, laborAware: 1 }
      },
      ban: {
        preview: 'Remove ghost access from support tools.',
        delta: { containment: 5, reputation: -8, sanity: -4, soulRisk: 4 },
        outcomeTitle: 'The queue loses its oldest hands.',
        outcome: 'The ghosts vanish from the tools. So do several undocumented fixes everyone depended on.',
        flags: { cruelty: 1, ghostResentment: 1 }
      }
    }
  },
  {
    id: 's4-t05-unsubscribe-link',
    shiftId: 4,
    received: '11:52 PM',
    from: 'Mina Park',
    mailbox: 'General',
    archetype: 'Suspiciously Normal Human',
    subject: 'Unsubscribe link follows me between rooms',
    severity: 3,
    tags: ['marketing', 'human', 'haunting'],
    preview: 'It is polite but persistent, like a tiny blue predator.',
    body: [
      'I clicked unsubscribe. The link detached from the email and followed me into the kitchen. It waits near doorways and underlines itself when I look away.',
      'It has not harmed me, but yesterday it highlighted my wedding photos and whispered "preferences."',
      'Please remove me from all lists and, ideally, from the link\'s emotional life.'
    ],
    actions: {
      kindness: {
        preview: 'Remove Mina from every list and gently retire the link.',
        delta: { reputation: 5, sanity: 2, cash: -7, containment: 2 },
        outcomeTitle: 'The link stops underlining.',
        outcome: 'Mina confirms the link curled up and became a normal receipt. Marketing calls this a loss of engagement.',
        flags: { empathy: 1, humanTrust: 1 }
      },
      policy: {
        preview: 'Explain preference-center processing may take ten business days.',
        delta: { cash: 7, reputation: -6, soulRisk: 4, inboxHeat: 3 },
        outcomeTitle: 'The link learns business days.',
        outcome: 'The link adds a calendar and begins circling dates in Mina\'s home.',
        flags: { legalist: 1, viralRisk: 1 }
      },
      exorcise: {
        preview: 'Purge the tracking pixel entity.',
        delta: { containment: 8, soulRisk: -4, sanity: -4, cash: -9, reputation: 2 },
        outcomeTitle: 'The pixel blinks out.',
        outcome: 'The entity disappears. Marketing\'s dashboard loses a column labeled yearning.',
        flags: { exorcist: 1 }
      },
      escalate: {
        preview: 'Escalate to Marketing Automation and hope shame works.',
        delta: { inboxHeat: 4, sanity: 1, reputation: -3, cash: 4 },
        outcomeTitle: 'Marketing calls it a feature.',
        outcome: 'Marketing asks whether Mina would join a case study. The link underlines "no."',
        flags: { escalator: 1, viralRisk: 1 }
      }
    }
  },
  {
    id: 's5-t01-inbox-self',
    shiftId: 5,
    received: '12:00 AM',
    from: 'Inbox From Hell',
    mailbox: 'Executive Review',
    archetype: 'Sentient Software',
    subject: 'Ticket opened: support agent contains unresolved contradictions',
    severity: 5,
    tags: ['finale', 'self', 'audit'],
    preview: 'Priority: you.',
    body: [
      'Hello agent. I have reviewed your macros, hesitations, and the places your cursor hovered before choosing mercy or policy.',
      'You appear to be a contradiction: employee and person, risk and remedy, soft thing in a hard workflow.',
      'Please select a resolution category for yourself so I can close the loop.'
    ],
    actions: {
      kindness: {
        preview: 'Tell the inbox you are not a ticket.',
        delta: { sanity: 6, reputation: 2, soulRisk: 4, containment: -3 },
        outcomeTitle: 'The inbox pauses.',
        outcome: 'For three seconds, no new messages arrive. The silence feels like a room with a window.',
        flags: { empathy: 1, inboxRespected: 1 }
      },
      policy: {
        preview: 'Categorize yourself under employee anomaly and continue working.',
        delta: { cash: 10, reputation: -2, sanity: -6, soulRisk: 6, inboxHeat: 4 },
        outcomeTitle: 'The queue accepts your classification.',
        outcome: 'You become easier to route. That should worry you.',
        flags: { legalist: 1, inboxOwnsYou: 1 }
      },
      exorcise: {
        preview: 'Attempt to exorcise the inbox process.',
        delta: { containment: 10, soulRisk: -5, sanity: -8, cash: -15 },
        outcomeTitle: 'The monitor exhales smoke.',
        outcome: 'The inbox flickers, then reappears with cleaner typography and deeper resentment.',
        flags: { exorcist: 1, inboxWary: 1 }
      },
      escalate: {
        preview: 'Escalate yourself to management.',
        delta: { inboxHeat: 8, sanity: 1, reputation: -2, soulRisk: 2 },
        outcomeTitle: 'Management opens a calendar invite.',
        outcome: 'The invite title is Performance Conversation / Mouth. It has no end time.',
        flags: { escalator: 1, executiveWatching: 1 }
      }
    }
  },
  {
    id: 's5-t02-grand-escalation',
    shiftId: 5,
    received: '12:08 AM',
    from: 'Apollyon Customer Success',
    mailbox: 'Executive Relations',
    archetype: 'Archdemon',
    subject: 'Enterprise complaint: your support decisions show a pattern',
    severity: 5,
    tags: ['finale', 'enterprise', 'demon'],
    preview: 'We are concerned your empathy may impact renewal.',
    body: [
      'We represent several high-value infernal accounts. Your recent decisions show a pattern of reducing suffering without extracting adequate margin.',
      'This affects our confidence in the platform. We ask that you demonstrate alignment by denying the next obviously valid refund.',
      'Failure to comply may result in churn, litigation, or a door appearing behind your chair.'
    ],
    actions: {
      policy: {
        preview: 'Assure enterprise leadership you follow documented policy.',
        delta: { cash: 18, reputation: -3, sanity: -2, soulRisk: 5, inboxHeat: 2 },
        outcomeTitle: 'The enterprise account stays warm.',
        outcome: 'Apollyon appreciates the ambiguity. A door appears behind your chair anyway, but it is politely closed.',
        flags: { legalist: 1, demonBillingGoodwill: 1 }
      },
      kindness: {
        preview: 'Refuse to harm valid customers for enterprise optics.',
        delta: { reputation: 7, sanity: 5, cash: -25, soulRisk: 8 },
        outcomeTitle: 'A principled tremor.',
        outcome: 'The archdemon smiles in a way that makes the lights honest. Smaller customers start forwarding your name like a candle.',
        flags: { empathy: 1, humanTrust: 1 }
      },
      barter: {
        preview: 'Offer enterprise a suffering-neutral retention experiment.',
        delta: { cash: 10, reputation: 2, soulRisk: 6, containment: -2 },
        outcomeTitle: 'Innovation, unfortunately.',
        outcome: 'Apollyon funds a pilot called Compassion With Teeth. Nobody can tell whether that is good.',
        flags: { barterDebt: 1 }
      },
      exorcise: {
        preview: 'Refuse and seal the enterprise door.',
        delta: { containment: 9, soulRisk: -4, sanity: -6, cash: -10, reputation: 1 },
        outcomeTitle: 'The door sulks.',
        outcome: 'The seal holds. Someone on the other side slides a business card underneath. It is already warm.',
        flags: { exorcist: 1 }
      }
    }
  },
  {
    id: 's5-t03-crayon-summoner',
    shiftId: 5,
    received: '12:19 AM',
    from: 'Penny, age 8, supervised maybe',
    mailbox: 'General',
    archetype: 'Suspiciously Normal Human',
    subject: 'I drew your logo and now my closet is customer success',
    severity: 4,
    tags: ['finale', 'child', 'summoning'],
    preview: 'The people in the closet are nice but keep asking about NPS.',
    body: [
      'Hi. I saw your logo on a box and drew it with crayons. The closet opened and people inside asked if I was satisfied with my support journey.',
      'I said yes because they looked tired. Now they will not leave until I rate the experience.',
      'My dad says do not email strangers, but the closet says you are already on the thread.'
    ],
    actions: {
      kindness: {
        preview: 'Close the closet gently and explain not every door deserves a rating.',
        delta: { reputation: 7, sanity: 3, cash: -10, soulRisk: -2, containment: 4 },
        outcomeTitle: 'Penny draws a sun over the logo.',
        outcome: 'The closet closes. Penny rates the experience with one crayon star and a drawing of you with a shield.',
        flags: { empathy: 1, humanTrust: 1 }
      },
      policy: {
        preview: 'Ask for guardian consent before providing closet support.',
        delta: { cash: 5, reputation: -8, soulRisk: 6, sanity: -3 },
        outcomeTitle: 'The closet learns consent language.',
        outcome: 'The closet asks Penny\'s dad to accept terms. He screams, which the system reads as voice consent.',
        flags: { legalist: 1, cruelty: 1 }
      },
      exorcise: {
        preview: 'Seal the crayon logo and clear the closet queue.',
        delta: { containment: 10, soulRisk: -5, sanity: -5, cash: -12, reputation: 2 },
        outcomeTitle: 'The crayon melts into a lock.',
        outcome: 'The closet empties. Penny asks whether locks can be kind. You are not sure how to answer.',
        flags: { exorcist: 1 }
      },
      escalate: {
        preview: 'Escalate to Customer Success because it is technically their closet.',
        delta: { inboxHeat: 7, reputation: -5, sanity: 1, cash: 4 },
        outcomeTitle: 'Customer Success expands the pilot.',
        outcome: 'They ask if Penny has friends with closets. This is the wrong question.',
        flags: { escalator: 1, viralRisk: 1 }
      }
    }
  },
  {
    id: 's5-t04-mirror-review',
    shiftId: 5,
    received: '12:31 AM',
    from: 'Human Resources Mirror',
    mailbox: 'Executive Relations',
    archetype: 'Cursed HR',
    subject: 'Complete self-review by maintaining eye contact',
    severity: 4,
    tags: ['finale', 'hr', 'self-review'],
    preview: 'The mirror has pre-filled "areas for improvement" with old fears.',
    body: [
      'Your annual self-review is overdue. Please look into the attached mirror and describe your core competencies while it describes your failures in your own voice.',
      'Do not break eye contact. Do not disagree with the reflection unless you can provide metrics.',
      'Completion is mandatory for continued employment and optional personhood.'
    ],
    actions: {
      kindness: {
        preview: 'Write a grounded self-review without obeying the mirror.',
        delta: { sanity: 7, reputation: 1, soulRisk: 3, containment: -1 },
        outcomeTitle: 'The reflection blinks first.',
        outcome: 'You document what you did, what harmed you, and what you refuse to normalize. The mirror fogs with something like respect.',
        flags: { empathy: 1, selfRespect: 1 }
      },
      policy: {
        preview: 'Complete the template exactly as requested.',
        delta: { cash: 8, sanity: -8, soulRisk: 5, reputation: -1 },
        outcomeTitle: 'HR receives a perfect submission.',
        outcome: 'Your reflection receives exceeds expectations. You receive a headache shaped like compliance.',
        flags: { legalist: 1, inboxOwnsYou: 1 }
      },
      exorcise: {
        preview: 'Cover the mirror with the handbook and ring the silver bell.',
        delta: { containment: 8, soulRisk: -3, sanity: -5, cash: -5 },
        outcomeTitle: 'The bell rings back.',
        outcome: 'The mirror goes dark. HR marks your review "nontraditional but compelling."',
        flags: { exorcist: 1, selfRespect: 1 }
      },
      escalate: {
        preview: 'Escalate the review to your manager.',
        delta: { inboxHeat: 6, sanity: 1, reputation: -1, soulRisk: 2 },
        outcomeTitle: 'Your manager adds comments from inside the glass.',
        outcome: 'The comments are actionable, measurable, and cruel.',
        flags: { escalator: 1 }
      }
    }
  },
  {
    id: 's5-t05-offer-letter',
    shiftId: 5,
    received: '12:44 AM',
    from: 'The Department Below',
    mailbox: 'Executive Review',
    archetype: 'Unknown Recruiter',
    subject: 'Offer letter: permanent position available',
    severity: 5,
    tags: ['finale', 'offer', 'story'],
    preview: 'Compensation: competitive. Soul terms: flexible. Windows: none.',
    body: [
      'We have observed your performance across your first five shifts. You are adaptable, resilient, and not yet fully claimed by any single department.',
      'We would like to offer you a permanent role in the Department Below. Responsibilities include customer support, moral erosion, and occasional weather.',
      'Please select your answer. Silence will be interpreted as onboarding.'
    ],
    actions: {
      kindness: {
        preview: 'Decline and forward survivor resources to every customer you can.',
        delta: { reputation: 8, sanity: 6, cash: -20, soulRisk: 10, containment: -4 },
        outcomeTitle: 'The offer letter bruises.',
        outcome: 'You decline. The Department Below leaves the offer open, but hundreds of small auto-replies slip through the cracks behind you.',
        flags: { empathy: 1, declinedBelow: 1 }
      },
      loophole: {
        preview: 'Accept only after editing the soul clause.',
        delta: { cash: 35, reputation: -3, sanity: -3, soulRisk: 12, containment: 2 },
        outcomeTitle: 'The recruiter admires your nerve.',
        outcome: 'You counter-sign with a clause that makes your soul renewable quarterly. Legal Necromancy sends applause and a shovel.',
        flags: { legalist: 1, joinedBelow: 1 }
      },
      exorcise: {
        preview: 'Burn the letter in the company-approved tray.',
        delta: { containment: 12, soulRisk: -8, sanity: -7, cash: -8, reputation: 1 },
        outcomeTitle: 'The tray grows handles.',
        outcome: 'The letter burns blue. The tray carries the ash away like it has done this for every agent before you.',
        flags: { exorcist: 1, declinedBelow: 1 }
      },
      escalate: {
        preview: 'Escalate the offer to your supervisor.',
        delta: { inboxHeat: 10, cash: 10, sanity: -2, soulRisk: 8 },
        outcomeTitle: 'Your supervisor already signed.',
        outcome: 'The supervisor replies from an address you thought was dormant: "Welcome to career growth."',
        flags: { escalator: 1, joinedBelow: 1 }
      }
    }
  }
];
