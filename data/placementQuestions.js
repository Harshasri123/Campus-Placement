/**
 * Campus Placement & Career Preparation Questions Repository
 * Multi-Tier Tracks: Quantitative Aptitude, Verbal, Reasoning, Programming & Tech, Interview, Placement Papers
 */

const PLACEMENT_QUESTIONS = [
  // 1. Quantitative Aptitude - Arithmetic (Time & Work)
  {
    id: 'q-apt-1',
    category: 'Aptitude',
    sub_category: 'Arithmetic',
    topic_tag: 'Time & Work',
    question_text: 'A can do a piece of work in 12 days and B in 15 days. How long will they take working together?',
    options: ['6 days', '6.67 days', '7.5 days', '8 days'],
    correct_option: 1,
    explanation: '1/A + 1/B = 1/12 + 1/15 = 9/60 = 3/20. Total days = 20/3 ≈ 6.67 days.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 2. Quantitative Aptitude - Arithmetic (Percentages)
  {
    id: 'q-apt-2',
    category: 'Aptitude',
    sub_category: 'Arithmetic',
    topic_tag: 'Percentages',
    question_text: 'If the price of sugar increases by 25%, by what percentage must a family reduce consumption to keep expenditure constant?',
    options: ['15%', '20%', '25%', '30%'],
    correct_option: 1,
    explanation: 'Required reduction = (r / (100 + r)) * 100 = (25 / 125) * 100 = 20%.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 3. Quantitative Aptitude - Arithmetic (Speed & Distance)
  {
    id: 'q-apt-3',
    category: 'Aptitude',
    sub_category: 'Arithmetic',
    topic_tag: 'Speed & Distance',
    question_text: 'A train 180 meters long is traveling at 54 km/h. How many seconds will it take to pass a telegraph post?',
    options: ['10 seconds', '12 seconds', '15 seconds', '18 seconds'],
    correct_option: 1,
    explanation: 'Speed in m/s = 54 * (5/18) = 15 m/s. Time = Distance / Speed = 180 / 15 = 12 seconds.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 4. Quantitative Aptitude - Arithmetic (Profit & Loss)
  {
    id: 'q-apt-4',
    category: 'Aptitude',
    sub_category: 'Arithmetic',
    topic_tag: 'Profit & Loss',
    question_text: 'An article is sold for $840 at a profit of 20%. What was the original cost price?',
    options: ['$680', '$700', '$720', '$750'],
    correct_option: 1,
    explanation: 'Cost Price = Selling Price / (1 + Profit%) = 840 / 1.20 = $700.',
    is_daily_question: false,
    daily_date: null
  },
  // 5. Quantitative Aptitude - Data Interpretation (Pie Charts)
  {
    id: 'q-apt-5',
    category: 'Aptitude',
    sub_category: 'Data Interpretation',
    topic_tag: 'Pie Charts',
    question_text: 'If a company spends 25% on R&D and 35% on Marketing from a total budget of $200,000, what is the combined spend?',
    options: ['$100,000', '$120,000', '$140,000', '$80,000'],
    correct_option: 1,
    explanation: 'Combined percentage is 60%. 60% of $200,000 = $120,000.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 6. Quantitative Aptitude - Data Interpretation (Bar Graphs)
  {
    id: 'q-apt-6',
    category: 'Aptitude',
    sub_category: 'Data Interpretation',
    topic_tag: 'Bar Graphs',
    question_text: 'In a tech college, the number of engineering hires rose from 120 in 2024 to 180 in 2026. What is the percentage increase?',
    options: ['40%', '45%', '50%', '60%'],
    correct_option: 2,
    explanation: 'Percentage increase = ((180 - 120) / 120) * 100 = (60 / 120) * 100 = 50%.',
    is_daily_question: false,
    daily_date: null
  },
  // 7. Verbal (English) - Verbal Ability (Synonyms)
  {
    id: 'q-vrb-1',
    category: 'Verbal',
    sub_category: 'Verbal Ability',
    topic_tag: 'Synonyms',
    question_text: 'Choose the closest synonym for "Pragmatic":',
    options: ['Theoretical', 'Practical', 'Careless', 'Hesitant'],
    correct_option: 1,
    explanation: '"Pragmatic" means dealing with things sensibly and realistically based on practical considerations.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 8. Verbal (English) - Verbal Ability (Antonyms)
  {
    id: 'q-vrb-2',
    category: 'Verbal',
    sub_category: 'Verbal Ability',
    topic_tag: 'Antonyms',
    question_text: 'Select the most appropriate antonym for "Candid":',
    options: ['Blunt', 'Deceptive', 'Sincere', 'Spontaneous'],
    correct_option: 1,
    explanation: '"Candid" means truthful and straightforward; "Deceptive" is the direct antonym.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 9. Verbal (English) - Verbal Test (Sentence Correction)
  {
    id: 'q-vrb-3',
    category: 'Verbal',
    sub_category: 'Verbal Test',
    topic_tag: 'Sentence Correction',
    question_text: 'Identify the correct sentence: "Neither of the candidates _____ submitted their resume yet."',
    options: ['have', 'has', 'are', 'were'],
    correct_option: 1,
    explanation: '"Neither" is an indefinite pronoun that takes a singular verb: "Neither of the candidates has submitted...".',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 10. Verbal (English) - Verbal Test (Spotting Errors)
  {
    id: 'q-vrb-4',
    category: 'Verbal',
    sub_category: 'Verbal Test',
    topic_tag: 'Spotting Errors',
    question_text: 'Find the grammatical error: "She has been working in this firm since five years."',
    options: ['She has been', 'working in', 'since five years', 'No error'],
    correct_option: 2,
    explanation: '"Since" denotes a specific start point in time; for a duration/period of time, use "for five years".',
    is_daily_question: false,
    daily_date: null
  },
  // 11. Reasoning - Logical Reasoning (Number Series)
  {
    id: 'q-rsn-1',
    category: 'Reasoning',
    sub_category: 'Logical Reasoning',
    topic_tag: 'Number Series',
    question_text: 'Complete the series: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '46'],
    correct_option: 1,
    explanation: 'Differences between consecutive numbers increase by 2: +4, +6, +8, +10, next is +12. 30 + 12 = 42.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 12. Reasoning - Logical Reasoning (Blood Relations)
  {
    id: 'q-rsn-2',
    category: 'Reasoning',
    sub_category: 'Logical Reasoning',
    topic_tag: 'Blood Relations',
    question_text: 'Pointing to a photograph, Rohit said, "She is the daughter of my grandfather\'s only son." How is the girl related to Rohit?',
    options: ['Sister', 'Mother', 'Aunt', 'Cousin'],
    correct_option: 0,
    explanation: 'Grandfather\'s only son is Rohit\'s father. The daughter of Rohit\'s father is Rohit\'s sister.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 13. Reasoning - Logical Reasoning (Syllogisms)
  {
    id: 'q-rsn-3',
    category: 'Reasoning',
    sub_category: 'Logical Reasoning',
    topic_tag: 'Syllogisms',
    question_text: 'Statements: All cats are animals. Some animals are pets. Conclusion: Some cats are pets.',
    options: ['Definitely true', 'Definitely false', 'Cannot be determined', 'None of these'],
    correct_option: 2,
    explanation: 'The intersection of pets and cats cannot be determined from the given premises.',
    is_daily_question: false,
    daily_date: null
  },
  // 14. Reasoning - Verbal Reasoning (Analogy)
  {
    id: 'q-rsn-4',
    category: 'Reasoning',
    sub_category: 'Verbal Reasoning',
    topic_tag: 'Analogy',
    question_text: 'Odometer is to Mileage as Compass is to:',
    options: ['Speed', 'Hiking', 'Needle', 'Direction'],
    correct_option: 3,
    explanation: 'An odometer measures mileage/distance; a compass determines direction.',
    is_daily_question: false,
    daily_date: null
  },
  // 15. Programming - Python Programming (Data Types)
  {
    id: 'q-prg-1',
    category: 'Programming',
    sub_category: 'Python Programming',
    topic_tag: 'Data Types',
    question_text: 'What is the output of: print(type([1, 2, (3, 4)]))?',
    options: ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", 'SyntaxError'],
    correct_option: 1,
    explanation: 'The outermost container is enclosed in square brackets [], which makes it a list.',
    is_daily_question: true,
    daily_date: new Date().toISOString().slice(0, 10)
  },
  // 16. Programming - Python Programming (Recursion)
  {
    id: 'q-prg-2',
    category: 'Programming',
    sub_category: 'Python Programming',
    topic_tag: 'Recursion',
    question_text: 'What will happen if a recursive function in Python lacks a base termination condition?',
    options: ['Returns None', 'RecursionError: maximum recursion depth exceeded', 'Runs forever without error', 'SyntaxError'],
    correct_option: 1,
    explanation: 'Python raises a RecursionError when the recursion call stack limit (default 1000) is exceeded.',
    is_daily_question: false,
    daily_date: null
  },
  // 17. Programming - Java Programming (OOPs Concepts)
  {
    id: 'q-prg-3',
    category: 'Programming',
    sub_category: 'Java Programming',
    topic_tag: 'OOPs Concepts',
    question_text: 'Which keyword prevents a class from being inherited in Java?',
    options: ['static', 'abstract', 'final', 'private'],
    correct_option: 2,
    explanation: 'The final keyword applied to a class prevents any subclassing/inheritance.',
    is_daily_question: false,
    daily_date: null
  },
  // 18. Programming - C Programming (Pointers)
  {
    id: 'q-prg-4',
    category: 'Programming',
    sub_category: 'C Programming',
    topic_tag: 'Pointers',
    question_text: 'What does the operator * represent when used as in *ptr?',
    options: ['Address of operator', 'Dereference / value-at operator', 'Multiplication only', 'Bitwise AND'],
    correct_option: 1,
    explanation: 'When used with a pointer, *ptr dereferences the pointer to access the value stored at that memory address.',
    is_daily_question: false,
    daily_date: null
  },
  // 19. Programming - C++ Programming (OOPs)
  {
    id: 'q-prg-5',
    category: 'Programming',
    sub_category: 'C++ Programming',
    topic_tag: 'Virtual Functions',
    question_text: 'In C++, runtime polymorphism is achieved through:',
    options: ['Function overloading', 'Operator overloading', 'Virtual functions', 'Templates'],
    correct_option: 2,
    explanation: 'Virtual functions enable dynamic dispatch (late binding), achieving runtime polymorphism in C++.',
    is_daily_question: false,
    daily_date: null
  },
  // 20. Interview - Technical Interview (DBMS)
  {
    id: 'q-int-1',
    category: 'Interview',
    sub_category: 'Technical Interview',
    topic_tag: 'DBMS',
    question_text: 'What does ACID stand for in database management systems?',
    options: ['Atomicity, Consistency, Isolation, Durability', 'Accuracy, Control, Integrity, Data', 'Access, Concurrency, Index, Durability', 'Action, Commit, Instance, Data'],
    correct_option: 0,
    explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
    is_daily_question: false,
    daily_date: null
  },
  // 21. Interview - Technical Interview (Operating Systems)
  {
    id: 'q-int-2',
    category: 'Interview',
    sub_category: 'Technical Interview',
    topic_tag: 'Operating Systems',
    question_text: 'Which of the following is NOT a necessary condition for a deadlock to occur?',
    options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption', 'Circular Wait'],
    correct_option: 2,
    explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Thus Preemption prevents deadlock.',
    is_daily_question: false,
    daily_date: null
  },
  // 22. Interview - HR Interview (Behavioral Questions)
  {
    id: 'q-int-3',
    category: 'Interview',
    sub_category: 'HR Interview',
    topic_tag: 'Behavioral Questions',
    question_text: 'What is the STAR method used in behavioral interviews?',
    options: ['Situation, Task, Action, Result', 'Strategy, Team, Analysis, Report', 'Scope, Timeline, Assessment, Review', 'Strength, Talent, Ability, Role'],
    correct_option: 0,
    explanation: 'The STAR method stands for Situation, Task, Action, and Result, a structured technique to answer behavioral interview questions.',
    is_daily_question: false,
    daily_date: null
  }
];

const PLACEMENT_PAPERS = [
  {
    id: 'paper-tcs-nqt-1',
    company_name: 'TCS NQT',
    paper_title: 'TCS NQT Cognitive Practice Test 1',
    duration_minutes: 45,
    total_marks: 30,
    pass_marks: 15,
    total_questions: 10,
    instructions: 'Contains Quantitative Aptitude, Logical Reasoning, and Verbal English.'
  },
  {
    id: 'paper-infosys-1',
    company_name: 'Infosys',
    paper_title: 'Infosys Springboard Assessment Model 1',
    duration_minutes: 60,
    total_marks: 40,
    pass_marks: 20,
    total_questions: 10,
    instructions: 'Covers Mathematical Thinking, Reasoning Ability, and Verbal Ability.'
  },
  {
    id: 'paper-cognizant-1',
    company_name: 'Cognizant',
    paper_title: 'Cognizant GenC Diagnostic Paper 2026',
    duration_minutes: 50,
    total_marks: 35,
    pass_marks: 18,
    total_questions: 10,
    instructions: 'Includes Quantitative Aptitude, Analytical Ability, and Programming Foundations.'
  },
  {
    id: 'paper-wipro-1',
    company_name: 'Wipro',
    paper_title: 'Wipro Elite NTH Practice Assessment',
    duration_minutes: 45,
    total_marks: 30,
    pass_marks: 15,
    total_questions: 10,
    instructions: 'Aptitude, Logical Reasoning, and Foundational Programming concepts.'
  },
  {
    id: 'paper-accenture-1',
    company_name: 'Accenture',
    paper_title: 'Accenture Cognitive & Technical Assessment',
    duration_minutes: 60,
    total_marks: 50,
    pass_marks: 25,
    total_questions: 10,
    instructions: 'Critical Thinking, Problem Solving, and Tech Essentials.'
  }
];

module.exports = {
  PLACEMENT_QUESTIONS,
  PLACEMENT_PAPERS
};
