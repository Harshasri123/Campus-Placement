import { pool } from './src/config/db.js';

export async function runPlacementMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running Placement Portal Schema Migration...');

    await client.query(`CREATE SCHEMA IF NOT EXISTS quiz AUTHORIZATION quiz_admin;`);
    await client.query(`SET search_path TO quiz, public;`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1. Create Question Type Enum if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_category_type') THEN
          CREATE TYPE question_category_type AS ENUM (
            'Aptitude', 
            'Verbal', 
            'Reasoning', 
            'Programming', 
            'Interview', 
            'PlacementPaper'
          );
        END IF;
      END $$;
    `);

    // 2. Enhanced Questions Table
    // Drop existing questions & dependent tables if structure needs overhaul
    await client.query(`DROP TABLE IF EXISTS quiz.placement_paper_questions CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS quiz.questions CASCADE;`);
    await client.query(`
      CREATE TABLE quiz.questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category question_category_type NOT NULL,
        sub_category VARCHAR(100) NOT NULL,
        topic_tag VARCHAR(100) NOT NULL,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option INT NOT NULL,
        explanation TEXT NOT NULL,
        is_daily_question BOOLEAN DEFAULT FALSE,
        daily_date DATE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Placement Test Papers Table
    await client.query(`DROP TABLE IF EXISTS quiz.placement_papers CASCADE;`);
    await client.query(`
      CREATE TABLE quiz.placement_papers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(150) NOT NULL,
        paper_title VARCHAR(255) NOT NULL,
        duration_minutes INT DEFAULT 60,
        total_marks INT DEFAULT 100,
        pass_marks INT DEFAULT 50,
        instructions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Mapping Questions to Placement Papers
    await client.query(`
      CREATE TABLE quiz.placement_paper_questions (
        paper_id UUID REFERENCES quiz.placement_papers(id) ON DELETE CASCADE,
        question_id UUID REFERENCES quiz.questions(id) ON DELETE CASCADE,
        question_order INT NOT NULL,
        PRIMARY KEY (paper_id, question_id)
      );
    `);

    // 5. Track Daily Quiz & Placement Paper Submissions
    await client.query(`DROP TABLE IF EXISTS quiz.quiz_attempts CASCADE;`);
    await client.query(`
      CREATE TABLE quiz.quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INT REFERENCES quiz.users(id) ON DELETE CASCADE,
        test_type VARCHAR(50) NOT NULL,
        reference_id UUID NULL,
        category VARCHAR(100),
        score INT NOT NULL,
        total_questions INT NOT NULL,
        time_taken_seconds INT NOT NULL,
        weak_areas JSONB DEFAULT '[]'::jsonb,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_daily_quiz ON quiz.questions (is_daily_question, daily_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_category_sub ON quiz.questions (category, sub_category);`);

    console.log('✅ Tables created: questions, placement_papers, placement_paper_questions, quiz_attempts');

    // 7. Seed starter questions
    const today = new Date().toISOString().slice(0, 10);

    const questionsSeed = [
      // Quantitative: Arithmetic
      {
        category: 'Aptitude',
        sub_category: 'Arithmetic',
        topic_tag: 'Time & Work',
        question_text: 'A can do a piece of work in 12 days and B in 15 days. How long will they take together?',
        options: ["6 days", "6.67 days", "7.5 days", "8 days"],
        correct_option: 1,
        explanation: '1/A + 1/B = 1/12 + 1/15 = 9/60 = 3/20. Total days = 20/3 ≈ 6.67 days.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Aptitude',
        sub_category: 'Arithmetic',
        topic_tag: 'Percentages',
        question_text: 'A shopkeeper marks an item 20% above cost price and allows a discount of 10%. What is his net profit percentage?',
        options: ["8%", "10%", "12%", "15%"],
        correct_option: 0,
        explanation: 'Net multiplier = 1.20 * 0.90 = 1.08 => 8% profit.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Aptitude',
        sub_category: 'Arithmetic',
        topic_tag: 'Speed & Distance',
        question_text: 'A train 150m long passes an electric pole in 9 seconds. What is the speed of the train in km/h?',
        options: ["50 km/h", "60 km/h", "65 km/h", "72 km/h"],
        correct_option: 1,
        explanation: 'Speed = 150m / 9s = 50/3 m/s. In km/h = (50/3) * (18/5) = 60 km/h.',
        is_daily_question: false,
        daily_date: null
      },
      // Quantitative: Data Interpretation
      {
        category: 'Aptitude',
        sub_category: 'Data Interpretation',
        topic_tag: 'Pie Charts',
        question_text: 'If a company spends 25% on R&D and 35% on Marketing from a total budget of $200,000, what is the combined spend?',
        options: ["$100,000", "$120,000", "$140,000", "$80,000"],
        correct_option: 1,
        explanation: 'Combined percentage is 60%. 60% of $200,000 = $120,000.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Aptitude',
        sub_category: 'Data Interpretation',
        topic_tag: 'Bar Graphs',
        question_text: 'Sales in 2023 were 500 units and in 2024 were 650 units. What is the percentage increase in sales?',
        options: ["25%", "30%", "35%", "20%"],
        correct_option: 1,
        explanation: 'Increase = (650 - 500) / 500 * 100 = 150 / 5 = 30%.',
        is_daily_question: false,
        daily_date: null
      },
      // Verbal (English)
      {
        category: 'Verbal',
        sub_category: 'Verbal Ability',
        topic_tag: 'Synonyms',
        question_text: 'Choose the closest synonym for "Pragmatic":',
        options: ["Theoretical", "Practical", "Careless", "Hesitant"],
        correct_option: 1,
        explanation: '"Pragmatic" means dealing with things sensibly and realistically based on practical considerations.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Verbal',
        sub_category: 'Verbal Test',
        topic_tag: 'Sentence Correction',
        question_text: 'Identify the error: "Each of the candidates have submitted their assignment."',
        options: ["Each of", "candidates have", "submitted", "No error"],
        correct_option: 1,
        explanation: '"Each" is singular and takes singular verb "has submitted".',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Verbal',
        sub_category: 'Verbal Ability',
        topic_tag: 'Idioms',
        question_text: 'What does the idiom "Bite the bullet" mean?',
        options: ["To eat quickly", "To face a difficult situation with courage", "To start a conflict", "To surrender"],
        correct_option: 1,
        explanation: '"Bite the bullet" means to endure a painful or grim situation bravely.',
        is_daily_question: false,
        daily_date: null
      },
      // Reasoning
      {
        category: 'Reasoning',
        sub_category: 'Logical Reasoning',
        topic_tag: 'Number Series',
        question_text: 'Complete the series: 2, 6, 12, 20, 30, ?',
        options: ["40", "42", "44", "46"],
        correct_option: 1,
        explanation: 'Differences between consecutive numbers increase by 2: +4, +6, +8, +10, next is +12. 30 + 12 = 42.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Reasoning',
        sub_category: 'Logical Reasoning',
        topic_tag: 'Blood Relations',
        question_text: 'Pointing to a gentleman, Deepak said, "His only brother is the father of my daughter\'s father." How is the gentleman related to Deepak?',
        options: ["Father", "Grandfather", "Uncle", "Brother-in-law"],
        correct_option: 2,
        explanation: 'Daughter\'s father = Deepak. Father of Deepak is his father. The gentleman\'s only brother is Deepak\'s father. So the gentleman is Deepak\'s uncle.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Reasoning',
        sub_category: 'Verbal Reasoning',
        topic_tag: 'Syllogism',
        question_text: 'Statements: All cats are dogs. All dogs are birds. Conclusion: (I) All cats are birds.',
        options: ["Only I follows", "Neither follows", "Both follow", "Cannot be determined"],
        correct_option: 0,
        explanation: 'Cats ⊆ Dogs ⊆ Birds, hence All cats are birds is true.',
        is_daily_question: false,
        daily_date: null
      },
      // Programming: Python
      {
        category: 'Programming',
        sub_category: 'Python Programming',
        topic_tag: 'Data Types',
        question_text: 'What is the output of: print(type([1, 2, (3, 4)]))?',
        options: ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "SyntaxError"],
        correct_option: 1,
        explanation: 'The outermost container is enclosed in square brackets `[]`, which is a list.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Programming',
        sub_category: 'Python Programming',
        topic_tag: 'Recursion',
        question_text: 'What is the base case in a recursive function intended to prevent?',
        options: ["Memory allocation", "Infinite recursion / Stack Overflow", "Slow compilation", "Type casting error"],
        correct_option: 1,
        explanation: 'The base case provides a terminating condition to prevent infinite recursive calls and stack overflow.',
        is_daily_question: false,
        daily_date: null
      },
      // Programming: Java
      {
        category: 'Programming',
        sub_category: 'Java Programming',
        topic_tag: 'OOPs Concepts',
        question_text: 'Which keyword prevents a class from being inherited in Java?',
        options: ["static", "abstract", "final", "private"],
        correct_option: 2,
        explanation: 'The `final` keyword applied to a class prevents any subclassing/inheritance.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Programming',
        sub_category: 'C Programming',
        topic_tag: 'Pointers',
        question_text: 'What does the `*` operator represent when used in declaration like `int *ptr;` in C?',
        options: ["Multiplication", "Pointer to an integer", "Address-of operator", "Bitwise AND"],
        correct_option: 1,
        explanation: 'In C declarations, `*` signifies that the variable is a pointer holding the memory address of an integer.',
        is_daily_question: false,
        daily_date: null
      },
      // Interview
      {
        category: 'Interview',
        sub_category: 'Technical Interview',
        topic_tag: 'DBMS',
        question_text: 'What does ACID stand for in database management systems?',
        options: [
          "Atomicity, Consistency, Isolation, Durability",
          "Accuracy, Control, Integrity, Data",
          "Access, Concurrency, Index, Durability",
          "Action, Commit, Instance, Data"
        ],
        correct_option: 0,
        explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
        is_daily_question: true,
        daily_date: today
      },
      {
        category: 'Interview',
        sub_category: 'HR Interview',
        topic_tag: 'Behavioral Questions',
        question_text: 'Which methodology is widely recommended for structuring responses to behavioral interview questions?',
        options: ["SWOT Framework", "STAR Method (Situation, Task, Action, Result)", "Agile Sprint", "Waterfall Model"],
        correct_option: 1,
        explanation: 'The STAR method (Situation, Task, Action, Result) is the gold standard for answering behavioral questions with concise evidence.',
        is_daily_question: false,
        daily_date: null
      }
    ];

    const insertedQuestionIds = [];
    for (const q of questionsSeed) {
      const res = await client.query(`
        INSERT INTO quiz.questions (category, sub_category, topic_tag, question_text, options, correct_option, explanation, is_daily_question, daily_date)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
        RETURNING id
      `, [
        q.category,
        q.sub_category,
        q.topic_tag,
        q.question_text,
        JSON.stringify(q.options),
        q.correct_option,
        q.explanation,
        q.is_daily_question,
        q.daily_date
      ]);
      insertedQuestionIds.push(res.rows[0].id);
    }
    console.log(`✅ Seeded ${insertedQuestionIds.length} hierarchical placement questions.`);

    // 8. Seed Placement Papers (TCS NQT, Infosys, Cognizant, Wipro, Accenture)
    const papers = [
      {
        company_name: 'TCS NQT',
        paper_title: 'TCS NQT Cognitive Practice Test 1',
        duration_minutes: 45,
        total_marks: 30,
        pass_marks: 15,
        instructions: 'Contains Quantitative Aptitude, Logical Reasoning, and Verbal Ability based on TCS NQT exam pattern.'
      },
      {
        company_name: 'Infosys',
        paper_title: 'Infosys Springboard Assessment Model Paper',
        duration_minutes: 50,
        total_marks: 40,
        pass_marks: 20,
        instructions: 'Covers Mathematical Thinking, Reasoning Ability, and Verbal English.'
      },
      {
        company_name: 'Cognizant',
        paper_title: 'Cognizant GenC Analytical & Technical Test',
        duration_minutes: 40,
        total_marks: 30,
        pass_marks: 18,
        instructions: 'Covers Quants, Code Analysis, and Logical Problem Solving.'
      },
      {
        company_name: 'Wipro',
        paper_title: 'Wipro Elite National Talent Hunt (NTH) Paper',
        duration_minutes: 45,
        total_marks: 30,
        pass_marks: 16,
        instructions: 'Aptitude, Logical Reasoning, and Foundational Programming concepts.'
      },
      {
        company_name: 'Accenture',
        paper_title: 'Accenture Cognitive & Technical Assessment 2026',
        duration_minutes: 60,
        total_marks: 50,
        pass_marks: 25,
        instructions: 'Critical Thinking, Abstract Reasoning, and Technical fundamentals.'
      }
    ];

    for (let i = 0; i < papers.length; i++) {
      const p = papers[i];
      const pRes = await client.query(`
        INSERT INTO quiz.placement_papers (company_name, paper_title, duration_minutes, total_marks, pass_marks, instructions)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [p.company_name, p.paper_title, p.duration_minutes, p.total_marks, p.pass_marks, p.instructions]);
      const paperId = pRes.rows[0].id;

      // Link 4 to 8 questions to each placement paper
      const questionsForPaper = insertedQuestionIds.slice(0, 8);
      for (let order = 0; order < questionsForPaper.length; order++) {
        await client.query(`
          INSERT INTO quiz.placement_paper_questions (paper_id, question_id, question_order)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [paperId, questionsForPaper[order], order + 1]);
      }
    }

    console.log(`✅ Seeded 5 Company Placement Papers with mapped questions.`);
    console.log('🎉 Placement Portal Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct run
if (process.argv[1]?.endsWith('migrate_placement.js')) {
  runPlacementMigration().then(() => pool.end());
}
