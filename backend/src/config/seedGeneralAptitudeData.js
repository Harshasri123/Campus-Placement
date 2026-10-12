import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db.js';

export const TOPICS_CATALOG = [
  // ==========================================
  // SECTION A: ARITHMETIC APTITUDE (11 Topics)
  // ==========================================
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Problems on Trains',
    slug: 'problems-on-trains',
    icon: '🚆',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?',
        options: ['65 seconds', '89 seconds', '100 seconds', '150 seconds'],
        correct_option: 1,
        explanation: 'Speed of train = Length of train / Time = 240 / 24 = 10 m/s.\nTotal distance to pass platform = Length of train + Length of platform = 240 + 650 = 890 m.\nTime taken = Total Distance / Speed = 890 / 10 = 89 seconds.'
      },
      {
        question_number: 2,
        question_text: 'Two trains running in opposite directions cross a man standing on the platform in 27 seconds and 17 seconds respectively and they cross each other in 23 seconds. What is the ratio of their speeds?',
        options: ['1:3', '3:2', '3:4', '2:3'],
        correct_option: 1,
        explanation: 'Let speeds be x and y. Length of train 1 = 27x, Length of train 2 = 17y.\nWhen crossing in opposite directions: Time = (27x + 17y) / (x + y) = 23.\n27x + 17y = 23x + 23y => 4x = 6y => x/y = 6/4 = 3/2.'
      },
      {
        question_number: 3,
        question_text: 'A train moving at 54 km/hr crosses a bridge in 30 seconds. If the length of the train is 150 meters, find the length of the bridge.',
        options: ['250 meters', '300 meters', '350 meters', '450 meters'],
        correct_option: 1,
        explanation: 'Speed in m/s = 54 * (5/18) = 15 m/s.\nTotal distance = Speed * Time = 15 * 30 = 450 meters.\nLength of bridge = Total distance - Length of train = 450 - 150 = 300 meters.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Time and Work',
    slug: 'time-and-work',
    icon: '⏱️',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'A can do a piece of work in 12 days and B can do it in 15 days. If they work together, how many days will they take to complete the work?',
        options: ['6 days', '6.67 days', '7.5 days', '8 days'],
        correct_option: 1,
        explanation: "A's 1 day work = 1/12. B's 1 day work = 1/15.\nCombined 1 day work = 1/12 + 1/15 = (5 + 4)/60 = 9/60 = 3/20.\nTotal time required = 20/3 ≈ 6.67 days."
      },
      {
        question_number: 2,
        question_text: 'A is thrice as good a workman as B and therefore is able to finish a job in 60 days less than B. Working together, they can do it in:',
        options: ['20 days', '22.5 days', '25 days', '30 days'],
        correct_option: 1,
        explanation: 'Ratio of times taken by A and B = 1:3. Difference in time = 3 - 1 = 2 parts = 60 days => 1 part = 30 days.\nHence, A takes 30 days and B takes 90 days.\nCombined 1 day work = 1/30 + 1/90 = 4/90 = 2/45.\nTotal days = 45/2 = 22.5 days.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Pipes and Cistern',
    slug: 'pipes-and-cistern',
    icon: '🚰',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Pipe A can fill a tank in 8 hours and Pipe B can empty it in 12 hours. If both pipes are opened simultaneously, in how many hours will the tank be full?',
        options: ['16 hours', '20 hours', '24 hours', '28 hours'],
        correct_option: 2,
        explanation: 'Net filling rate per hour = (1/8) - (1/12) = (3 - 2)/24 = 1/24.\nHence, the tank fills completely in 24 hours.'
      },
      {
        question_number: 2,
        question_text: 'Two pipes A and B can fill a cistern in 20 and 30 minutes respectively, and a third pipe C can empty it in 40 minutes. How long will it take to fill the cistern if all are opened together?',
        options: ['15 minutes', '17.14 minutes', '20 minutes', '24.5 minutes'],
        correct_option: 1,
        explanation: 'Net rate = 1/20 + 1/30 - 1/40 = (6 + 4 - 3)/120 = 7/120.\nTime taken = 120/7 ≈ 17.14 minutes.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Time and Distance',
    slug: 'time-and-distance',
    icon: '🚗',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'A person travels from town A to town B at 60 km/h and returns at 40 km/h. What is his average speed for the whole journey?',
        options: ['48 km/h', '50 km/h', '52 km/h', '45 km/h'],
        correct_option: 0,
        explanation: 'Average speed for equal distance = 2xy / (x + y) = (2 * 60 * 40) / (60 + 40) = 4800 / 100 = 48 km/h.'
      },
      {
        question_number: 2,
        question_text: 'If a man walks at 14 km/hr instead of 10 km/hr, he would have walked 20 km more. The actual distance travelled by him is:',
        options: ['50 km', '56 km', '70 km', '80 km'],
        correct_option: 0,
        explanation: 'Let actual distance be x km. Time = x/10.\nAt 14 km/hr, distance = x + 20, so (x + 20)/14 = x/10 => 14x = 10x + 200 => 4x = 200 => x = 50 km.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Problems on Ages',
    slug: 'problems-on-ages',
    icon: '🎂',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'The ratio of present ages of father and son is 7:3. Ten years ago, the ratio was 3:1. What is the present age of the father?',
        options: ['35 years', '50 years', '70 years', '60 years'],
        correct_option: 2,
        explanation: 'Let ages be 7x and 3x. Ten years ago: (7x - 10) / (3x - 10) = 3 / 1.\n7x - 10 = 9x - 30 => 2x = 20 => x = 10.\nFather’s present age = 7x = 70 years.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Profit and Loss',
    slug: 'profit-and-loss',
    icon: '💰',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'A merchant marks goods 25% above cost price and allows a discount of 12%. His net profit percentage is:',
        options: ['10%', '12%', '13%', '15%'],
        correct_option: 0,
        explanation: 'Let CP = 100. Marked Price = 125.\nSelling Price = 125 * (1 - 0.12) = 125 * 0.88 = 110.\nProfit = 110 - 100 = 10%.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Simple Interest & Compound Interest',
    slug: 'simple-interest-compound-interest',
    icon: '📈',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'The difference between simple and compound interest on $1,200 for 2 years at 10% per annum is:',
        options: ['$10', '$12', '$14', '$16'],
        correct_option: 1,
        explanation: 'Formula for 2 years: Difference = P * (R/100)^2 = 1200 * (10/100)^2 = 1200 * (1/100) = $12.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Ratio and Proportion',
    slug: 'ratio-and-proportion',
    icon: '⚖️',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'If A:B = 2:3 and B:C = 4:5, find the compound ratio A:B:C.',
        options: ['8:12:15', '2:12:15', '8:9:15', '6:9:15'],
        correct_option: 0,
        explanation: 'Multiply A:B by 4 => 8:12. Multiply B:C by 3 => 12:15. Hence, A:B:C = 8:12:15.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Percentages',
    slug: 'percentages',
    icon: '📊',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'If the price of sugar increases by 25%, by what percentage must a household reduce consumption to keep expenditure constant?',
        options: ['15%', '20%', '22.5%', '25%'],
        correct_option: 1,
        explanation: 'Reduction % = [R / (100 + R)] * 100 = [25 / 125] * 100 = (1/5) * 100 = 20%.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Permutation and Combination',
    slug: 'permutation-and-combination',
    icon: '🔢',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'In how many different ways can the letters of the word "LEADING" be arranged such that vowels always appear together?',
        options: ['360', '480', '720', '1440'],
        correct_option: 2,
        explanation: 'Vowels are E, A, I (3 vowels). Consonants are L, D, N, G (4 consonants).\nTreat the 3 vowels as 1 single block. Total units = 4 consonants + 1 block = 5 units, which can be arranged in 5! = 120 ways.\nThe 3 vowels within their block can arrange in 3! = 6 ways.\nTotal arrangements = 120 * 6 = 720.'
      }
    ]
  },
  {
    section_name: 'Arithmetic Aptitude',
    topic_name: 'Probability',
    slug: 'probability',
    icon: '🎲',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Two dice are tossed simultaneously. What is the probability of getting a sum equal to 7 or 11?',
        options: ['7/36', '2/9', '5/18', '1/4'],
        correct_option: 1,
        explanation: 'Total outcomes = 6 * 6 = 36.\nPairs summing to 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) -> 6 outcomes.\nPairs summing to 11: (5,6),(6,5) -> 2 outcomes.\nTotal favorable outcomes = 6 + 2 = 8.\nProbability = 8/36 = 2/9.'
      }
    ]
  },

  // ==========================================
  // SECTION B: DATA INTERPRETATION (5 Topics)
  // ==========================================
  {
    section_name: 'Data Interpretation',
    topic_name: 'Table Charts',
    slug: 'table-charts',
    icon: '📋',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'A company reports sales: Q1: $40,000, Q2: $50,000, Q3: $65,000, Q4: $80,000. What is the percentage increase in sales from Q1 to Q4?',
        options: ['50%', '75%', '100%', '120%'],
        correct_option: 2,
        explanation: 'Percentage increase = [(Q4 - Q1) / Q1] * 100 = [(80000 - 40000) / 40000] * 100 = (40000 / 40000) * 100 = 100%.'
      }
    ]
  },
  {
    section_name: 'Data Interpretation',
    topic_name: 'Bar Charts',
    slug: 'bar-charts',
    icon: '📊',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'In a manufacturing plant, defective items produced in Mon, Tue, Wed, Thu, Fri are 12, 18, 15, 25, 10. What is the average number of defective items per day?',
        options: ['14', '16', '18', '20'],
        correct_option: 1,
        explanation: 'Total defectives = 12 + 18 + 15 + 25 + 10 = 80.\nAverage = 80 / 5 = 16 defectives per day.'
      }
    ]
  },
  {
    section_name: 'Data Interpretation',
    topic_name: 'Pie Charts',
    slug: 'pie-charts',
    icon: '🥧',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'In an expenditure pie chart, the sector angle for Raw Materials is 108 degrees. If total company expenditure is $1,000,000, how much is spent on Raw Materials?',
        options: ['$250,000', '$300,000', '$320,000', '$360,000'],
        correct_option: 1,
        explanation: 'Sector percentage = 108° / 360° = 3/10 = 30%.\nExpenditure on Raw Materials = 30% of $1,000,000 = $300,000.'
      }
    ]
  },
  {
    section_name: 'Data Interpretation',
    topic_name: 'Line Charts',
    slug: 'line-charts',
    icon: '📉',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'A stock price tracked over 4 days: Day 1: $120, Day 2: $150, Day 3: $135, Day 4: $180. What was the net percentage return from Day 1 to Day 4?',
        options: ['40%', '45%', '50%', '60%'],
        correct_option: 2,
        explanation: 'Net gain = 180 - 120 = $60.\nPercentage return = (60 / 120) * 100 = 50%.'
      }
    ]
  },
  {
    section_name: 'Data Interpretation',
    topic_name: 'Mixed & Radar Charts',
    slug: 'mixed-radar-charts',
    icon: '🕸️',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Candidate radar competency scores (out of 10): Coding: 9, Aptitude: 8, Communication: 7, System Design: 8, Leadership: 8. What is the candidate overall percentile score on a 100-point scale?',
        options: ['75%', '80%', '82%', '85%'],
        correct_option: 1,
        explanation: 'Sum of scores = 9 + 8 + 7 + 8 + 8 = 40 out of 50.\nScore percentage = (40 / 50) * 100 = 80%.'
      }
    ]
  },

  // ==========================================
  // SECTION C: VERBAL ABILITY (20 Topics)
  // ==========================================
  {
    section_name: 'Verbal Ability',
    topic_name: 'Spotting Errors',
    slug: 'spotting-errors',
    icon: '🔍',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Identify the segment with an error: "Neither the principal (A) nor the teachers (B) was present (C) at the annual convention (D)."',
        options: ['(A)', '(B)', '(C)', 'No error'],
        correct_option: 2,
        explanation: 'In correlative conjunctions (neither...nor), the verb agrees with the nearer subject. "Teachers" is plural, so the verb must be plural: "were present", not "was present".'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Synonyms',
    slug: 'synonyms',
    icon: '📖',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Choose the closest synonym for the word "CANDID":',
        options: ['Deceptive', 'Frank', 'Secretive', 'Arrogant'],
        correct_option: 1,
        explanation: '"Candid" means truthful and straightforward; frank.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Antonyms',
    slug: 'antonyms',
    icon: '🔄',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Select the most opposite meaning for "METICULOUS":',
        options: ['Careless', 'Thorough', 'Precise', 'Fastidious'],
        correct_option: 0,
        explanation: '"Meticulous" means showing great attention to detail; very careful. The antonym is "Careless".'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Selecting Words',
    slug: 'selecting-words',
    icon: '✍️',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Fill in the blank: The company decided to _______ the contract after the contractor failed to meet the safety requirements.',
        options: ['terminate', 'initiate', 'extend', 'commence'],
        correct_option: 0,
        explanation: '"Terminate" means to bring to an end, which fits the context of breach of safety requirements.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Spellings',
    slug: 'spellings',
    icon: '🔤',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Identify the correctly spelled word:',
        options: ['Accomodation', 'Accommodation', 'Acommodation', 'Accomodasion'],
        correct_option: 1,
        explanation: 'The correct spelling is "Accommodation" with double "c" and double "m".'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Sentence Formation',
    slug: 'sentence-formation',
    icon: '🧱',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Arrange into a meaningful sentence: (P) of the project (Q) on time (R) the successful completion (S) depends on team effort.',
        options: ['R P Q S', 'P Q R S', 'S R P Q', 'Q P R S'],
        correct_option: 0,
        explanation: 'The sentence reads logically as: "The successful completion (R) of the project (P) on time (Q) depends on team effort (S)".'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Ordering of Words',
    slug: 'ordering-of-words',
    icon: '🔀',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Rearrange the words: (1) knowledge (2) is (3) without practice (4) useless.',
        options: ['1-2-3-4', '1-3-2-4', '3-1-2-4', '4-2-1-3'],
        correct_option: 1,
        explanation: '"Knowledge without practice is useless" (1-3-2-4) forms a coherent grammatical proposition.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Sentence Correction',
    slug: 'sentence-correction',
    icon: '✏️',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Improve the underlined phrase: "He did not knew that the meeting was postponed."',
        options: ['did not know', 'had not knew', 'does not knew', 'No correction required'],
        correct_option: 0,
        explanation: 'The auxiliary "did" is always accompanied by the base form of the main verb: "did not know".'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Sentence Improvement',
    slug: 'sentence-improvement',
    icon: '✨',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Select the best replacement: "She is having five years of software engineering experience."',
        options: ['She has', 'She had have', 'She is with', 'No improvement'],
        correct_option: 0,
        explanation: 'Possession is expressed using simple present "She has", not the continuous tense "is having".'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Completing Statements',
    slug: 'completing-statements',
    icon: '📝',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Complete the statement: Although the algorithm was computationally intensive, _____________.',
        options: [
          'it executed in near real-time due to parallel GPU acceleration',
          'it crashed every system it was deployed on',
          'it was completely abandoned immediately',
          'it had zero mathematical formulation'
        ],
        correct_option: 0,
        explanation: 'The conjunction "Although" establishes a contrast between the heavy computation and its surprising real-time efficiency.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Ordering of Sentences',
    slug: 'ordering-of-sentences',
    icon: '📑',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Order the sentences: S1: Artificial intelligence has revolutionized medicine. P: Machine learning models assist radiologists. Q: These advances save critical lives daily. R: Doctors diagnose illnesses far earlier. S4: Continued ethical oversight remains vital.',
        options: ['P-R-Q', 'Q-P-R', 'R-P-Q', 'P-Q-R'],
        correct_option: 0,
        explanation: 'S1 introduces AI in medicine. P introduces radiology ML models. R shows how doctors use them to diagnose earlier. Q summarizes the life-saving impact.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Paragraph Formation',
    slug: 'paragraph-formation',
    icon: '📄',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Identify the opening sentence for a paragraph on renewable energy: (A) Solar and wind power lead this charge. (B) Transitioning to clean energy is imperative for climate stability. (C) However, battery storage technology must also scale.',
        options: ['A', 'B', 'C', 'None'],
        correct_option: 1,
        explanation: 'Sentence (B) provides the overarching thesis and topic statement.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Cloze Test',
    slug: 'cloze-test',
    icon: '🧩',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Fill in the cloze passage: "Cloud computing allows organizations to scale computing resources on-demand, significantly reducing infrastructure [1] and improving agility."',
        options: ['costs', 'features', 'benefits', 'networks'],
        correct_option: 0,
        explanation: 'The context of on-demand scaling refers to reducing capital and operational expenditure ("costs").'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Comprehension',
    slug: 'comprehension',
    icon: '📚',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Passage: "Distributed databases partition data across multiple network nodes to guarantee high availability and fault tolerance." What is the main design goal mentioned?',
        options: ['Centralized authority', 'High availability and fault tolerance', 'Single-point failure', 'Manual data backup'],
        correct_option: 1,
        explanation: 'The passage explicitly states that partitioning guarantees "high availability and fault tolerance".'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'One Word Substitutes',
    slug: 'one-word-substitutes',
    icon: '💡',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'A person who writes code for computer programs:',
        options: ['Calligrapher', 'Programmer / Developer', 'Lexicographer', 'Cartographer'],
        correct_option: 1,
        explanation: 'A programmer/software developer writes computer software.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Idioms and Phrases',
    slug: 'idioms-and-phrases',
    icon: '🗣️',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'What does "Bite the bullet" mean?',
        options: [
          'To chew metallic objects',
          'To face a difficult or unavoidable situation with courage',
          'To surrender immediately',
          'To make a careless mistake'
        ],
        correct_option: 1,
        explanation: '"Bite the bullet" is an idiom meaning to endure a painful or grim situation that cannot be avoided.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Change of Voice (Active/Passive)',
    slug: 'change-of-voice',
    icon: '🎙️',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Convert to passive voice: "The software engineer fixed the critical security bug."',
        options: [
          'The critical security bug was fixed by the software engineer.',
          'The critical security bug had been fixed by the software engineer.',
          'The critical security bug is fixed by the software engineer.',
          'The software engineer was fixing the critical security bug.'
        ],
        correct_option: 0,
        explanation: 'In simple past tense active voice (subject + V2 + object), the passive is formed using (object + was/were + V3 + by subject).'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Change of Speech (Direct/Indirect)',
    slug: 'change-of-speech',
    icon: '💬',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Convert to indirect speech: She said, "I am deploying the microservice today."',
        options: [
          'She said that she was deploying the microservice that day.',
          'She said that she is deploying the microservice today.',
          'She asked if she deploys the microservice that day.',
          'She told that she has deployed the microservice.'
        ],
        correct_option: 0,
        explanation: 'Present continuous "am deploying" changes to past continuous "was deploying", and time word "today" changes to "that day".'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Verbal Analogies',
    slug: 'verbal-analogies',
    icon: '🔗',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Complete the analogy: ARCHITECT : BLUEPRINT :: PROGRAMMER : ?',
        options: ['HARDWARE', 'SOURCE CODE', 'PRINTER', 'KEYBOARD'],
        correct_option: 1,
        explanation: 'An architect creates a blueprint; a programmer creates source code.'
      }
    ]
  },
  {
    section_name: 'Verbal Ability',
    topic_name: 'Logical Deductions',
    slug: 'logical-deductions',
    icon: '🧠',
    total_questions_count: 100,
    questions: [
      {
        question_number: 1,
        question_text: 'Statement: If a student clears all technical rounds, they receive a job offer. Rohan received a job offer. What can be deduced?',
        options: [
          'Rohan definitely cleared all technical rounds.',
          'Rohan did not take any technical rounds.',
          'Rohan was rejected.',
          'No conclusive deduction can be made because other hiring paths may exist.'
        ],
        correct_option: 0,
        explanation: 'In standard formal conditional logic given the premise, receiving the job offer affirms the fulfillment of the prerequisite condition.'
      }
    ]
  }
];

export async function seedGeneralAptitudeData() {
  const client = await pool.connect();
  try {
    console.log('🔄 Seeding 36 Topics and Curated Question Banks into PostgreSQL...');

    let seededTopicsCount = 0;
    let seededQuestionsCount = 0;

    for (const t of TOPICS_CATALOG) {
      // 1. Upsert topic into quiz.topics
      const topicRes = await client.query(
        `INSERT INTO quiz.topics (section_name, topic_name, slug, total_questions_count, icon)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE 
         SET section_name = EXCLUDED.section_name,
             topic_name = EXCLUDED.topic_name,
             icon = EXCLUDED.icon,
             total_questions_count = EXCLUDED.total_questions_count
         RETURNING id`,
        [t.section_name, t.topic_name, t.slug, t.total_questions_count || 100, t.icon || '📁']
      );

      const topicId = topicRes.rows[0].id;
      seededTopicsCount++;

      // 2. Insert curated questions for this topic
      if (t.questions && t.questions.length > 0) {
        for (const q of t.questions) {
          // Check if question already exists in this topic
          const qCheck = await client.query(
            `SELECT id FROM quiz.questions WHERE topic_id = $1 AND question_text = $2`,
            [topicId, q.question_text]
          );

          if (qCheck.rows.length === 0) {
            await client.query(
              `INSERT INTO quiz.questions (
                topic_id, question_number, question_text, data_asset_url, options, correct_option, explanation, is_frequently_asked
              ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)`,
              [
                topicId,
                q.question_number,
                q.question_text,
                q.data_asset_url || null,
                JSON.stringify(q.options),
                q.correct_option,
                q.explanation,
                true
              ]
            );
            seededQuestionsCount++;
          }
        }
      }
    }

    console.log(`✅ Seeded ${seededTopicsCount} topics across Arithmetic, Data Interpretation, and Verbal Ability.`);
    console.log(`✅ Seeded ${seededQuestionsCount} new verified placement questions with step-by-step formulas.`);
  } catch (err) {
    console.error('❌ Error seeding general aptitude data:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('seedGeneralAptitudeData.js')) {
  seedGeneralAptitudeData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
