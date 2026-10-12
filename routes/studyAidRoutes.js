const express = require('express');

const router = express.Router();

const FORMULA_SHEETS = [
  {
    topicId: 'problems-on-trains',
    topicName: 'Problems on Trains',
    category: 'Quantitative Aptitude',
    icon: '🚆',
    summary: 'Speed, Distance, Relative Velocity & Platform Crossing Shortcuts',
    formulas: [
      {
        name: 'Unit Conversion (km/hr to m/s)',
        formula: 'Speed (m/s) = Speed (km/hr) × (5 / 18)',
        shortcut: 'Remember: 18 km/hr = 5 m/s, 36 km/hr = 10 m/s, 54 km/hr = 15 m/s, 72 km/hr = 20 m/s.'
      },
      {
        name: 'Unit Conversion (m/s to km/hr)',
        formula: 'Speed (km/hr) = Speed (m/s) × (18 / 5)',
        shortcut: 'Multiply by 18, divide by 5.'
      },
      {
        name: 'Time to Cross a Stationary Object of Negligible Length (Pole, Man)',
        formula: 'Time (t) = Length of Train (L) / Speed of Train (v)',
        shortcut: 'Distance is strictly the length of the train itself.'
      },
      {
        name: 'Time to Cross a Platform, Bridge, or Tunnel',
        formula: 'Time (t) = (Length of Train L1 + Length of Platform L2) / Speed (v)',
        shortcut: 'Total distance = L1 + L2. Ensure units match (meters and m/s).'
      },
      {
        name: 'Two Trains Moving in OPPOSITE Directions',
        formula: 'Relative Speed = v1 + v2 | Time to cross = (L1 + L2) / (v1 + v2)',
        shortcut: 'Opposite directions $\\to$ speeds ADD up.'
      },
      {
        name: 'Two Trains Moving in SAME Direction',
        formula: 'Relative Speed = |v1 - v2| | Time to cross = (L1 + L2) / |v1 - v2|',
        shortcut: 'Same direction $\\to$ speeds SUBTRACT.'
      }
    ]
  },
  {
    topicId: 'time-and-work',
    topicName: 'Time and Work',
    category: 'Quantitative Aptitude',
    icon: '⏳',
    summary: 'LCM Method, Efficiency Rates, and Pipes & Cisterns',
    formulas: [
      {
        name: 'Work Done Rate',
        formula: 'If A does work in n days, A\'s 1-day work = 1 / n',
        shortcut: 'Work = Efficiency × Time. Assume Total Work = LCM of individual day counts.'
      },
      {
        name: 'Combined Work (A and B together)',
        formula: 'Time = (a × b) / (a + b) days',
        shortcut: 'Product divided by Sum formula.'
      },
      {
        name: 'Man-Day Formula (M1 × D1 × H1 / W1 = M2 × D2 × H2 / W2)',
        formula: '(M1 × D1 × H1 × E1) / W1 = (M2 × D2 × H2 × E2) / W2',
        shortcut: 'Keep Men, Days, Hours on top; Work (units, toys, meters) in the denominator.'
      },
      {
        name: 'Pipes and Cisterns (Inlet + Outlet)',
        formula: 'Net Rate = (1 / Inlet Time) - (1 / Leak Time)',
        shortcut: 'Treat leaks or empty pipes as negative efficiency.'
      }
    ]
  },
  {
    topicId: 'percentages-profit-loss',
    topicName: 'Percentages, Profit & Loss',
    category: 'Quantitative Aptitude',
    icon: '💹',
    summary: 'Fraction Equivalents, Successive Discounts, and Markup Multipliers',
    formulas: [
      {
        name: 'Standard Percentage to Fraction Table',
        formula: '50%=1/2 | 33.33%=1/3 | 25%=1/4 | 20%=1/5 | 16.66%=1/6 | 14.28%=1/7 | 12.5%=1/8 | 11.11%=1/9 | 10%=1/10 | 9.09%=1/11 | 8.33%=1/12',
        shortcut: 'Memorizing these fractions reduces 90% of calculation time.'
      },
      {
        name: 'Successive Percentage Change',
        formula: 'Net Change % = x + y + (x × y / 100)',
        shortcut: 'Use positive for increase, negative for decrease or discount.'
      },
      {
        name: 'Profit % and Loss % on Cost Price',
        formula: 'Profit % = (Profit / CP) × 100 | Loss % = (Loss / CP) × 100',
        shortcut: 'Profit/Loss is ALWAYS calculated on Cost Price (CP) unless stated otherwise.'
      },
      {
        name: 'Selling at Loss and Profit of Same % (x%)',
        formula: 'Always a Net Loss = (x / 10)^2 %',
        shortcut: 'If two items sold at same SP, one at x% profit and one at x% loss $\\to$ net loss is x²/100 %.'
      }
    ]
  },
  {
    topicId: 'dbms-core',
    topicName: 'DBMS Core & SQL Cheats',
    category: 'Core Computer Science',
    icon: '🗄️',
    summary: 'ACID Properties, Normal Forms, and SQL Joins',
    formulas: [
      {
        name: 'ACID Properties',
        formula: 'Atomicity (All/None), Consistency (Rules valid), Isolation (Concurrent safe), Durability (Persisted committed data)',
        shortcut: 'Mnemonic: All Cash Is Distributed.'
      },
      {
        name: 'Database Normalization Hierarchy',
        formula: '1NF: Atomic values (no arrays/repeats)\n2NF: 1NF + No Partial Dependencies (all non-key fully depend on PK)\n3NF: 2NF + No Transitive Dependencies (non-key does not determine non-key)\nBCNF: 3NF + For every functional dependency X -> Y, X must be a super key.',
        shortcut: '1NF: Atomic | 2NF: The Key | 3NF: The Whole Key | BCNF: Nothing But The Key.'
      },
      {
        name: 'SQL Join Cardinalities',
        formula: 'INNER: Intersection | LEFT: All Left + Matched Right | FULL OUTER: Union of both tables',
        shortcut: 'NULL values appear where right table has no match in LEFT JOIN.'
      }
    ]
  },
  {
    topicId: 'os-core',
    topicName: 'Operating Systems Cheat Sheet',
    category: 'Core Computer Science',
    icon: '💻',
    summary: 'Scheduling Algorithms, Turnaround Time, and Deadlocks',
    formulas: [
      {
        name: 'Turnaround Time (TAT) and Waiting Time (WT)',
        formula: 'Turnaround Time (TAT) = Completion Time - Arrival Time\nWaiting Time (WT) = Turnaround Time - Burst Time',
        shortcut: 'Remember: WT = Completion - Arrival - Burst.'
      },
      {
        name: '4 Necessary Conditions for Deadlock (Coffman Conditions)',
        formula: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
        shortcut: 'Mnemonic: "Many Hands Never Clean" (Mutual, Hold, No preemption, Circular).'
      }
    ]
  }
];

const FLASHCARDS = [
  {
    id: 'fc-1',
    category: 'Vocabulary',
    front: 'UBIQUITOUS',
    back: 'Present, appearing, or found everywhere; omnipresent.\n\nSynonyms: Omnipresent, pervasive, universal.\nAntonyms: Rare, scarce, seldom.',
    tag: 'TCS Verbal'
  },
  {
    id: 'fc-2',
    category: 'Vocabulary',
    front: 'EPHEMERAL',
    back: 'Lasting for a very short time; transitory.\n\nSynonyms: Fleeting, transient, evanescent.\nAntonyms: Permanent, enduring, everlasting.',
    tag: 'Infosys Verbal'
  },
  {
    id: 'fc-3',
    category: 'Core CS (OS)',
    front: 'What is Thrashing in Operating Systems?',
    back: 'Thrashing occurs when the system spends more time page-faulting and swapping pages between main memory and virtual storage than executing user instructions.\n\nSolution: Increase RAM or reduce degree of multiprogramming.',
    tag: 'OS Theory'
  },
  {
    id: 'fc-4',
    category: 'Core CS (DBMS)',
    front: 'What is a Foreign Key vs Primary Key?',
    back: 'Primary Key: Uniquely identifies each record in a table (cannot be NULL, strictly unique).\n\nForeign Key: A field that refers to the Primary Key of another table, enforcing referential integrity (can be NULL, can have duplicates).',
    tag: 'DBMS'
  },
  {
    id: 'fc-5',
    category: 'Core CS (OOPs)',
    front: 'Explain Encapsulation vs Abstraction',
    back: 'Encapsulation: Bundling data and methods into a single unit (class) and restricting direct access using access modifiers (private, protected).\n\nAbstraction: Hiding internal implementation details and showing only the essential functionality to the user (via abstract classes & interfaces).',
    tag: 'OOPs'
  },
  {
    id: 'fc-6',
    category: 'Quantitative Aptitude',
    front: 'Speed of boat in Still Water (u) and Stream (v)',
    back: 'Downstream Speed (D) = u + v\nUpstream Speed (U) = u - v\n\nSpeed in Still Water u = (D + U) / 2\nSpeed of Current v = (D - U) / 2',
    tag: 'Boats & Streams'
  }
];

router.get('/formula-sheets', (req, res) => {
  res.json({ sheets: FORMULA_SHEETS });
});

router.get('/flashcards', (req, res) => {
  res.json({ flashcards: FLASHCARDS });
});

module.exports = router;
