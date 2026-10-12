import { pool } from './db.js';
import bcrypt from 'bcrypt';
import { seedProgrammingLanguages } from './seedProgrammingLanguages.js';

export async function initPlacementDb() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing Campus Placement & Career Prep Engine Schema...');

    await client.query(`CREATE SCHEMA IF NOT EXISTS quiz AUTHORIZATION quiz_admin;`);
    await client.query(`SET search_path TO quiz, public;`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1. Question Category Type Enum
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

    // 2. Users Table (Ensure UUID id)
    // Check if quiz.users exists with integer id; if so, drop old table to migrate to UUID schema
    const checkUserCol = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'quiz' AND table_name = 'users' AND column_name = 'id';
    `);

    if (checkUserCol.rows.length > 0 && checkUserCol.rows[0].data_type === 'integer') {
      console.log('🔄 Upgrading users table from SERIAL integer to UUID...');
      await client.query(`DROP TABLE IF EXISTS quiz.user_security_questions CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS quiz.quiz_attempts CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS quiz.users CASCADE;`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        failed_reset_attempts INT DEFAULT 0,
        lockout_until TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. User Security Questions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.user_security_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES quiz.users(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        answer_hash VARCHAR(255) NOT NULL
      );
    `);

    // 4. Questions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.questions (
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

    // 5. Placement Papers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.placement_papers (
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

    // 6. Placement Paper Questions Mapping Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.placement_paper_questions (
        paper_id UUID REFERENCES quiz.placement_papers(id) ON DELETE CASCADE,
        question_id UUID REFERENCES quiz.questions(id) ON DELETE CASCADE,
        question_order INT NOT NULL,
        PRIMARY KEY (paper_id, question_id)
      );
    `);

    // 7. Quiz Attempts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES quiz.users(id) ON DELETE SET NULL,
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

    // 8. Indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_daily_quiz ON quiz.questions (is_daily_question, daily_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_category_sub ON quiz.questions (category, sub_category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_attempts ON quiz.quiz_attempts (user_id);`);

    console.log('✅ PostgreSQL Schema initialized for Campus Placement & Career Prep Engine.');

    // 9. Seed default sample student if users is empty
    const usersCount = await client.query('SELECT COUNT(*) FROM quiz.users');
    if (parseInt(usersCount.rows[0].count, 10) === 0) {
      const hashedPass = await bcrypt.hash('student123', 10);
      const userRes = await client.query(`
        INSERT INTO quiz.users (full_name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id
      `, ['Aditya Verma', 'aditya@placement.edu', hashedPass]);

      const userId = userRes.rows[0].id;
      const hashedA1 = await bcrypt.hash('hyderabad', 10);
      const hashedA2 = await bcrypt.hash('blue', 10);

      await client.query(`
        INSERT INTO quiz.user_security_questions (user_id, question_text, answer_hash)
        VALUES 
          ($1, 'What city were you born in?', $2),
          ($1, 'What is your favorite color?', $3)
      `, [userId, hashedA1, hashedA2]);

      console.log('✅ Seeded default student: aditya@placement.edu (pass: student123)');
    }

    // 10. Check if questions exist, seed placement questions if empty
    const qCount = await client.query('SELECT COUNT(*) FROM quiz.questions');
    if (parseInt(qCount.rows[0].count, 10) < 15) {
      const today = new Date().toISOString().slice(0, 10);
      const seedQuestions = [
        // Quantitative: Arithmetic
        {
          category: 'Aptitude',
          sub_category: 'Arithmetic',
          topic_tag: 'Time & Work',
          question_text: 'Pipe A can fill a tank in 8 hours, and Pipe B can empty it in 12 hours. If both pipes are opened simultaneously, in how many hours will the tank be full?',
          options: ["18 hours", "24 hours", "20 hours", "16 hours"],
          correct_option: 1,
          explanation: 'Net rate = (1/8) - (1/12) = (3 - 2)/24 = 1/24. Thus, the tank will be full in 24 hours.',
          is_daily_question: true,
          daily_date: today
        },
        {
          category: 'Aptitude',
          sub_category: 'Arithmetic',
          topic_tag: 'Profit & Loss',
          question_text: 'A merchant sells an article at a profit of 20%. If he had bought it at 20% less and sold it for $20 less, he would have gained 25%. What is the cost price?',
          options: ["$100", "$120", "$150", "$200"],
          correct_option: 0,
          explanation: 'Let CP = 100x. SP = 120x. New CP = 80x. New SP = 80x * 1.25 = 100x. Difference = 120x - 100x = 20x = $20 => x = 1. CP = $100.',
          is_daily_question: true,
          daily_date: today
        },
        {
          category: 'Aptitude',
          sub_category: 'Arithmetic',
          topic_tag: 'Speed & Distance',
          question_text: 'A person crosses a 600m long street in 5 minutes. What is his speed in km per hour?',
          options: ["3.6 km/h", "7.2 km/h", "8.4 km/h", "10 km/h"],
          correct_option: 1,
          explanation: 'Speed = 600m / 300s = 2 m/s. In km/h = 2 * (18/5) = 7.2 km/h.',
          is_daily_question: false,
          daily_date: null
        },
        // Quantitative: Data Interpretation
        {
          category: 'Aptitude',
          sub_category: 'Data Interpretation',
          topic_tag: 'Pie Charts',
          question_text: 'A company allocates 30% of its budget to Marketing, 25% to R&D, 20% to Operations, and the rest to Sales. If the total budget is $500,000, what is the Sales budget?',
          options: ["$100,000", "$125,000", "$150,000", "$75,000"],
          correct_option: 1,
          explanation: 'Sales percentage = 100% - (30% + 25% + 20%) = 25%. 25% of $500,000 = $125,000.',
          is_daily_question: true,
          daily_date: today
        },
        {
          category: 'Aptitude',
          sub_category: 'Data Interpretation',
          topic_tag: 'Tables & Ratios',
          question_text: 'If Company X produced 12,000 units in Q1 and 15,000 units in Q2, what is the ratio of Q1 to Q2 production in simplest terms?',
          options: ["3:4", "4:5", "5:6", "2:3"],
          correct_option: 1,
          explanation: '12,000 / 15,000 = 12 / 15 = 4 / 5.',
          is_daily_question: false,
          daily_date: null
        },
        // Verbal: Verbal Ability
        {
          category: 'Verbal',
          sub_category: 'Verbal Ability',
          topic_tag: 'Vocabulary',
          question_text: 'Choose the word that is most nearly opposite in meaning to "Ephemeral":',
          options: ["Transient", "Permanent", "Fragile", "Superficial"],
          correct_option: 1,
          explanation: '"Ephemeral" means lasting for a very short time. Its direct antonym is "Permanent".',
          is_daily_question: true,
          daily_date: today
        },
        {
          category: 'Verbal',
          sub_category: 'Verbal Test',
          topic_tag: 'Spotting Errors',
          question_text: 'Find the grammatically incorrect section: "Neither the manager nor the employees (A) was present (B) during the audit (C) yesterday (D)."',
          options: ["(A)", "(B)", "(C)", "No error"],
          correct_option: 1,
          explanation: 'When using "neither...nor", the verb agrees with the subject closest to it. "Employees" is plural, so it should be "were present".',
          is_daily_question: true,
          daily_date: today
        },
        {
          category: 'Verbal',
          sub_category: 'Verbal Ability',
          topic_tag: 'Idioms & Phrases',
          question_text: 'What is the true meaning of the idiom "Burning the midnight oil"?',
          options: ["Wasting resources", "Working or studying late into the night", "Causing a fire hazard", "Complaining about duties"],
          correct_option: 1,
          explanation: '"Burning the midnight oil" means reading, studying, or working diligently until very late at night.',
          is_daily_question: false,
          daily_date: null
        },
        // Reasoning: Logical Reasoning
        {
          category: 'Reasoning',
          sub_category: 'Logical Reasoning',
          topic_tag: 'Coding-Decoding',
          question_text: 'If in a code language, "APPLE" is written as "EQTPI", what is the code for "GRAPE"?',
          options: ["KVETI", "KTETH", "LVEUI", "KVEUI"],
          correct_option: 0,
          explanation: 'Each letter is shifted forward: A(+4)=E, P(+1)=Q, P(+4)=T, L(+4)=P, E(+4)=I. For GRAPE: G(+4)=K, R(+4)=V, A(+4)=E, P(+4)=T, E(+4)=I => KVETI.',
          is_daily_question: true,
          daily_date: today
        },
        {
          category: 'Reasoning',
          sub_category: 'Logical Reasoning',
          topic_tag: 'Syllogisms',
          question_text: 'Statements: (1) All engineers are innovative. (2) Some innovative people are leaders. Conclusions: (I) Some engineers are leaders. (II) All leaders are innovative.',
          options: ["Only (I) follows", "Only (II) follows", "Either (I) or (II) follows", "Neither follows"],
          correct_option: 3,
          explanation: 'There is no direct universal overlap established between engineers and leaders, so neither conclusion necessarily follows.',
          is_daily_question: true,
          daily_date: today
        },
        {
          category: 'Reasoning',
          sub_category: 'Verbal Reasoning',
          topic_tag: 'Cause & Effect',
          question_text: 'Event A: Government increased subsidies on solar panels. Event B: Rooftop solar installations increased by 65%.',
          options: [
            "A is the cause and B is its effect",
            "B is the cause and A is its effect",
            "Both are independent causes",
            "Both are effects of common cause"
          ],
          correct_option: 0,
          explanation: 'Increased government subsidies made solar panels affordable, leading directly to higher installation rates.',
          is_daily_question: false,
          daily_date: null
        },
        // Programming & Tech: Python
        {
          category: 'Programming',
          sub_category: 'Python Programming',
          topic_tag: 'Memory & Mutability',
          question_text: 'What happens when you execute: `a = [1, 2]; b = a; b.append(3); print(len(a))`?',
          options: ["2", "3", "Error", "None"],
          correct_option: 1,
          explanation: 'In Python, lists are mutable references. `b = a` assigns the reference; appending to `b` alters the same underlying list object, so `len(a)` is 3.',
          is_daily_question: true,
          daily_date: today
        },
        // Programming & Tech: Java
        {
          category: 'Programming',
          sub_category: 'Java Programming',
          topic_tag: 'Multithreading',
          question_text: 'Which method must be overridden when implementing the `java.lang.Runnable` interface?',
          options: ["start()", "run()", "execute()", "init()"],
          correct_option: 1,
          explanation: 'The `Runnable` functional interface declares a single abstract method: `public void run()`.',
          is_daily_question: true,
          daily_date: today
        },
        // Programming & Tech: C++
        {
          category: 'Programming',
          sub_category: 'C++ Programming',
          topic_tag: 'Virtual Functions',
          question_text: 'What is the primary purpose of declaring a virtual destructor in a C++ base class?',
          options: [
            "To prevent instantiation of the base class",
            "To ensure proper cleanup of derived class objects when deleted through a base class pointer",
            "To speed up compilation time",
            "To make all member functions static"
          ],
          correct_option: 1,
          explanation: 'Virtual destructors ensure that the derived class destructor is invoked polymorphically, preventing undefined behavior and memory leaks.',
          is_daily_question: false,
          daily_date: null
        },
        // Interview Preparation: Technical
        {
          category: 'Interview',
          sub_category: 'Technical Interview',
          topic_tag: 'Database Indexing',
          question_text: 'Why are B+ Trees predominantly preferred over Hash tables for indexing relational database tables?',
          options: [
            "Hash tables use too much memory",
            "B+ Trees support efficient range queries and sequential scans",
            "B+ Trees have O(1) worst-case lookup",
            "Hash tables cannot store strings"
          ],
          correct_option: 1,
          explanation: 'B+ Trees keep data ordered on leaf nodes linked together, allowing O(log N) point queries as well as high-speed range scans (e.g. BETWEEN, >, <).',
          is_daily_question: true,
          daily_date: today
        },
        {
          category: 'Interview',
          sub_category: 'Technical Interview',
          topic_tag: 'Operating Systems',
          question_text: 'What are the four necessary and sufficient conditions for a Deadlock to occur in an operating system?',
          options: [
            "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait",
            "Paging, Segmentation, Swapping, Thrashing",
            "Semaphore, Mutex, Monitor, Spinlock",
            "Critical Section, Race Condition, Starvation, Aging"
          ],
          correct_option: 0,
          explanation: "Coffman's four conditions for deadlock are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
          is_daily_question: false,
          daily_date: null
        },
        // Interview Preparation: HR
        {
          category: 'Interview',
          sub_category: 'HR Interview',
          topic_tag: 'Behavioral Responses',
          question_text: 'In the STAR interview methodology, what does the "A" stand for?',
          options: ["Accuracy", "Action", "Analysis", "Achievement"],
          correct_option: 1,
          explanation: 'STAR stands for Situation, Task, Action, and Result.',
          is_daily_question: false,
          daily_date: null
        }
      ];

      for (const q of seedQuestions) {
        await client.query(`
          INSERT INTO quiz.questions (category, sub_category, topic_tag, question_text, options, correct_option, explanation, is_daily_question, daily_date)
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
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
      }
      console.log(`✅ Seeded ${seedQuestions.length} comprehensive placement questions.`);
    }

    // 11. Seed placement papers if empty
    const paperCount = await client.query('SELECT COUNT(*) FROM quiz.placement_papers');
    if (parseInt(paperCount.rows[0].count, 10) === 0) {
      const papers = [
        {
          company_name: 'TCS NQT',
          paper_title: 'TCS National Qualifier Test 2026 Model Paper 1',
          duration_minutes: 60,
          total_marks: 100,
          pass_marks: 60,
          instructions: 'Timed assessment covering Numerical Ability, Reasoning Ability, and Verbal Ability according to TCS NQT standard.'
        },
        {
          company_name: 'Infosys',
          paper_title: 'Infosys Springboard Assessment Model Paper',
          duration_minutes: 55,
          total_marks: 80,
          pass_marks: 50,
          instructions: 'Covers Mathematical Thinking, Logical Problem Solving, and Pseudocode Analysis.'
        },
        {
          company_name: 'Cognizant',
          paper_title: 'Cognizant GenC Analytical & Technical Test',
          duration_minutes: 45,
          total_marks: 60,
          pass_marks: 38,
          instructions: 'Quantitative problem solving, code debugging, and critical reasoning.'
        },
        {
          company_name: 'Wipro',
          paper_title: 'Wipro Elite National Talent Hunt (NTH) Paper',
          duration_minutes: 45,
          total_marks: 60,
          pass_marks: 35,
          instructions: 'Aptitude, Logical Reasoning, and Core CS Fundamentals.'
        },
        {
          company_name: 'Accenture',
          paper_title: 'Accenture Cognitive & Technical Assessment 2026',
          duration_minutes: 60,
          total_marks: 100,
          pass_marks: 65,
          instructions: 'Critical Thinking, Abstract Reasoning, and Technical Application concepts.'
        }
      ];

      const qIdsRes = await client.query('SELECT id FROM quiz.questions LIMIT 12');
      const qIds = qIdsRes.rows.map(r => r.id);

      for (const p of papers) {
        const pRes = await client.query(`
          INSERT INTO quiz.placement_papers (company_name, paper_title, duration_minutes, total_marks, pass_marks, instructions)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [p.company_name, p.paper_title, p.duration_minutes, p.total_marks, p.pass_marks, p.instructions]);

        const paperId = pRes.rows[0].id;
        for (let i = 0; i < qIds.length; i++) {
          await client.query(`
            INSERT INTO quiz.placement_paper_questions (paper_id, question_id, question_order)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
          `, [paperId, qIds[i], i + 1]);
        }
      }
      console.log('✅ Seeded 5 Company Placement Papers with mapped questions.');
    }

    // 12. Seed C, C++, and C# sample questions
    await seedProgrammingLanguages();

    console.log('🎉 Database initialization complete!');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}
