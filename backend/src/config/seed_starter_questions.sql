-- Campus Placement Portal - Comprehensive Starter Questions Seed Script

INSERT INTO questions (category, sub_category, topic_tag, question_text, options, correct_option, explanation, is_daily_question, daily_date) VALUES
-- 1. Quantitative: Arithmetic (Time & Work)
('Aptitude', 'Arithmetic', 'Time & Work', 
 'A can do a piece of work in 12 days and B in 15 days. How long will they take working together?', 
 '["6 days", "6.67 days", "7.5 days", "8 days"]'::jsonb, 1, 
 '1/A + 1/B = 1/12 + 1/15 = 9/60 = 3/20. Total days = 20/3 ≈ 6.67 days.', TRUE, CURRENT_DATE),

-- 2. Quantitative: Arithmetic (Percentages)
('Aptitude', 'Arithmetic', 'Percentages',
 'If the price of sugar increases by 25%, by what percentage must a family reduce consumption to keep expenditure constant?',
 '["15%", "20%", "25%", "30%"]'::jsonb, 1,
 'Required reduction = (r / (100 + r)) * 100 = (25 / 125) * 100 = 20%.', TRUE, CURRENT_DATE),

-- 3. Quantitative: Arithmetic (Speed & Distance)
('Aptitude', 'Arithmetic', 'Speed & Distance',
 'A train 180 meters long is traveling at 54 km/h. How many seconds will it take to pass a telegraph post?',
 '["10 seconds", "12 seconds", "15 seconds", "18 seconds"]'::jsonb, 1,
 'Speed in m/s = 54 * (5/18) = 15 m/s. Time = Distance / Speed = 180 / 15 = 12 seconds.', TRUE, CURRENT_DATE),

-- 4. Quantitative: Arithmetic (Profit & Loss)
('Aptitude', 'Arithmetic', 'Profit & Loss',
 'An article is sold for $840 at a profit of 20%. What was the cost price?',
 '["$680", "$700", "$720", "$750"]'::jsonb, 1,
 'Cost Price = Selling Price / (1 + Profit%) = 840 / 1.20 = $700.', FALSE, NULL),

-- 5. Quantitative: Data Interpretation (Pie Charts)
('Aptitude', 'Data Interpretation', 'Pie Charts', 
 'If a company spends 25% on R&D and 35% on Marketing from a total budget of $200,000, what is the combined spend?', 
 '["$100,000", "$120,000", "$140,000", "$80,000"]'::jsonb, 1, 
 'Combined percentage is 60%. 60% of $200,000 = $120,000.', TRUE, CURRENT_DATE),

-- 6. Quantitative: Data Interpretation (Bar Graphs)
('Aptitude', 'Data Interpretation', 'Bar Graphs',
 'In a college, the number of CS students increased from 120 in 2024 to 180 in 2026. What is the percentage increase?',
 '["40%", "45%", "50%", "60%"]'::jsonb, 2,
 'Percentage increase = ((180 - 120) / 120) * 100 = (60 / 120) * 100 = 50%.', FALSE, NULL),

-- 7. Verbal: Verbal Ability (Synonyms)
('Verbal', 'Verbal Ability', 'Synonyms', 
 'Choose the closest synonym for "Pragmatic":', 
 '["Theoretical", "Practical", "Careless", "Hesitant"]'::jsonb, 1, 
 '"Pragmatic" means dealing with things sensibly and realistically based on practical considerations.', TRUE, CURRENT_DATE),

-- 8. Verbal: Verbal Ability (Antonyms)
('Verbal', 'Verbal Ability', 'Antonyms',
 'Select the most appropriate antonym for "Candid":',
 '["Blunt", "Deceptive", "Sincere", "Spontaneous"]'::jsonb, 1,
 '"Candid" means truthful and straightforward; "Deceptive" is the direct antonym.', TRUE, CURRENT_DATE),

-- 9. Verbal: Verbal Test (Sentence Correction)
('Verbal', 'Verbal Test', 'Sentence Correction',
 'Identify the correct sentence: "Neither of the candidates _____ submitted their resume yet."',
 '["have", "has", "are", "were"]'::jsonb, 1,
 '"Neither" is an indefinite pronoun that takes a singular verb: "Neither of the candidates has submitted...".', TRUE, CURRENT_DATE),

-- 10. Verbal: Verbal Test (Spotting Errors)
('Verbal', 'Verbal Test', 'Spotting Errors',
 'Find the error in: "She has been working in this firm since five years."',
 '["She has been", "working in", "since five years", "No error"]'::jsonb, 2,
 '"Since" denotes a specific point in time; for a duration/period of time, use "for five years".', FALSE, NULL),

-- 11. Reasoning: Logical Reasoning (Number Series)
('Reasoning', 'Logical Reasoning', 'Number Series', 
 'Complete the series: 2, 6, 12, 20, 30, ?', 
 '["40", "42", "44", "46"]'::jsonb, 1, 
 'Differences between consecutive numbers increase by 2: +4, +6, +8, +10, next is +12. 30 + 12 = 42.', TRUE, CURRENT_DATE),

-- 12. Reasoning: Logical Reasoning (Blood Relations)
('Reasoning', 'Logical Reasoning', 'Blood Relations',
 'Pointing to a photograph, Rohit said, "She is the daughter of my grandfather''s only son." How is the girl related to Rohit?',
 '["Sister", "Mother", "Aunt", "Cousin"]'::jsonb, 0,
 'Grandfather''s only son is Rohit''s father. The daughter of Rohit''s father is Rohit''s sister.', TRUE, CURRENT_DATE),

-- 13. Reasoning: Logical Reasoning (Syllogisms)
('Reasoning', 'Logical Reasoning', 'Syllogisms',
 'Statements: All cats are animals. Some animals are pets. Conclusion: Some cats are pets.',
 '["Definitely true", "Definitely false", "Cannot be determined", "None of these"]'::jsonb, 2,
 'The intersection of pets and cats cannot be definitively determined from the given premises.', TRUE, CURRENT_DATE),

-- 14. Reasoning: Verbal Reasoning (Analogy)
('Reasoning', 'Verbal Reasoning', 'Analogy',
 'Odometer is to Mileage as Compass is to:',
 '["Speed", "Hiking", "Needle", "Direction"]'::jsonb, 3,
 'An odometer measures mileage/distance; a compass determines direction.', FALSE, NULL),

-- 15. Programming: Python
('Programming', 'Python Programming', 'Data Types', 
 'What is the output of: print(type([1, 2, (3, 4)]))?', 
 '["<class ''tuple''>", "<class ''list''>", "<class ''dict''>", "SyntaxError"]'::jsonb, 1, 
 'The outermost container is enclosed in square brackets `[]`, which is a list.', TRUE, CURRENT_DATE),

-- 16. Programming: Python (Recursion)
('Programming', 'Python Programming', 'Recursion',
 'What will happen if a recursive function in Python lacks a base condition?',
 '["Returns None", "RecursionError: maximum recursion depth exceeded", "Runs forever without error", "SyntaxError"]'::jsonb, 1,
 'Python raises a RecursionError when the recursion limit (default 1000) is exceeded.', FALSE, NULL),

-- 17. Programming: Java (OOPs Concepts)
('Programming', 'Java Programming', 'OOPs Concepts', 
 'Which keyword prevents a class from being inherited in Java?', 
 '["static", "abstract", "final", "private"]'::jsonb, 2, 
 'The `final` keyword applied to a class prevents any subclassing/inheritance.', FALSE, NULL),

-- 18. Programming: C Programming (Pointers)
('Programming', 'C Programming', 'Pointers',
 'What does the operator `*` represent when used in `*ptr`?',
 '["Address of operator", "Dereference / value-at operator", "Multiplication only", "Bitwise AND"]'::jsonb, 1,
 'When used with a pointer, `*ptr` dereferences the pointer to access the value stored at that address.', FALSE, NULL),

-- 19. Programming: C++ Programming (Virtual Functions)
('Programming', 'C++ Programming', 'OOPs',
 'In C++, runtime polymorphism is achieved through:',
 '["Function overloading", "Operator overloading", "Virtual functions", "Templates"]'::jsonb, 2,
 'Virtual functions enable dynamic dispatch (late binding), achieving runtime polymorphism in C++.', FALSE, NULL),

-- 20. Interview: Technical Interview (DBMS)
('Interview', 'Technical Interview', 'DBMS', 
 'What does ACID stand for in database management systems?', 
 '["Atomicity, Consistency, Isolation, Durability", "Accuracy, Control, Integrity, Data", "Access, Concurrency, Index, Durability", "Action, Commit, Instance, Data"]'::jsonb, 0, 
 'ACID stands for Atomicity, Consistency, Isolation, and Durability.', FALSE, NULL),

-- 21. Interview: Technical Interview (Operating Systems)
('Interview', 'Technical Interview', 'Operating Systems',
 'Which of the following is NOT a necessary condition for a deadlock to occur?',
 '["Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait"]'::jsonb, 2,
 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Thus Preemption prevents deadlock.', FALSE, NULL),

-- 22. Interview: HR Interview (Behavioral Questions)
('Interview', 'HR Interview', 'Behavioral Questions',
 'What is the STAR method used in behavioral interviews?',
 '["Situation, Task, Action, Result", "Strategy, Team, Analysis, Report", "Scope, Timeline, Assessment, Review", "Strength, Talent, Ability, Role"]'::jsonb, 0,
 'The STAR method stands for Situation, Task, Action, and Result, a structured technique to answer behavioral interview questions.', FALSE, NULL)
ON CONFLICT DO NOTHING;

-- Populate Placement Papers
INSERT INTO placement_papers (company_name, paper_title, duration_minutes, total_marks, pass_marks, instructions)
VALUES 
('TCS NQT', 'TCS NQT Cognitive Practice Test 1', 45, 30, 15, 'Contains Quantitative Aptitude, Logical Reasoning, and Verbal English.'),
('Infosys', 'Infosys Springboard Assessment Model 1', 60, 40, 20, 'Covers Mathematical Thinking, Reasoning Ability, and Verbal Ability.'),
('Cognizant', 'Cognizant GenC Diagnostic Paper 2026', 50, 35, 18, 'Includes Quantitative Aptitude, Analytical Ability, and Programming Foundations.'),
('Wipro', 'Wipro Elite NTH Practice Assessment', 45, 30, 15, 'Aptitude, Logical Reasoning, and Foundational Programming concepts.'),
('Accenture', 'Accenture Cognitive & Technical Assessment', 60, 50, 25, 'Critical Thinking, Problem Solving, and Tech Essentials.')
ON CONFLICT DO NOTHING;
