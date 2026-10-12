/**
 * Authentic Previous-Year Interview Questions (PYQs) Repository
 * Distributed across TCS, Infosys, Cognizant, Wipro, and Accenture.
 * Contains both Technical Rounds and HR & Behavioral Rounds.
 * Over 50 authentic questions with expected keywords, follow-up probes, and STAR model answers.
 */

const INTERVIEW_PYQ_DATASET = [
  // =========================================================================
  // 1. TCS NQT / Digital / Ninja (Technical: 6 Qs, HR: 4 Qs)
  // =========================================================================
  {
    id: 'tcs-tech-1',
    company: 'TCS NQT',
    roundType: 'Technical',
    topic: 'Operating Systems',
    question: 'Can you walk me through the key differences between a process and a thread, and how context switching differs between them?',
    expectedKeywords: ['process', 'thread', 'memory space', 'context switch', 'overhead', 'pcb', 'tcb', 'shared memory'],
    followUpProbes: [
      'You mentioned shared memory; how does a race condition occur when two threads write to the same variable?',
      'Which context switch is heavier on CPU cache—process or thread, and why?'
    ],
    modelAnswer: {
      starMethod: 'Concept & Real-World Mechanism',
      answer: 'A process is an executing program with its own dedicated address space, PCB (Process Control Block), file descriptors, and registers. A thread is the smallest unit of CPU execution within a process, sharing the parent process\'s code, data, and heap segments while maintaining its own stack and registers.\n\nContext switching between processes is computationally expensive because the OS must invalidate and reload CPU cache lines (TLB - Translation Lookaside Buffer) and switch page directories. In contrast, context switching between threads within the same process is significantly lighter because the memory space remains identical, requiring only register and stack pointer adjustments.'
    }
  },
  {
    id: 'tcs-tech-2',
    company: 'TCS NQT',
    roundType: 'Technical',
    topic: 'DBMS & SQL',
    question: 'What is the purpose of Database Normalization, and can you explain how 3NF differs from BCNF with an example?',
    expectedKeywords: ['normalization', 'redundancy', 'anomaly', '3nf', 'bcnf', 'transitive dependency', 'functional dependency', 'super key'],
    followUpProbes: [
      'In what scenario would you deliberately denormalize a database table in production?',
      'Does BCNF always preserve functional dependencies?'
    ],
    modelAnswer: {
      starMethod: 'Technical Deep-Dive',
      answer: 'Database Normalization systematically eliminates redundant data to prevent insertion, update, and deletion anomalies. A relation is in 3NF if it is in 2NF and has no transitive dependencies for non-prime attributes—meaning for every functional dependency X -> Y, either X is a super key or Y is a prime attribute.\n\nBCNF (Boyce-Codd Normal Form) is a stricter version where for EVERY non-trivial functional dependency X -> Y, X MUST be a super key, with no exceptions for prime attributes. For example, in a Student-Advisor-Department relation where an Advisor belongs to only one Department, a non-super key determines a prime attribute; BCNF resolves this anomaly by decomposing into separate tables.'
    }
  },
  {
    id: 'tcs-tech-3',
    company: 'TCS NQT',
    roundType: 'Technical',
    topic: 'Data Structures',
    question: 'How does a Hash Map handle collisions under the hood, and what is the difference between Chaining and Open Addressing?',
    expectedKeywords: ['hash function', 'collision', 'separate chaining', 'open addressing', 'linear probing', 'load factor', 'linked list', 'red-black tree'],
    followUpProbes: [
      'What happens in Java 8 HashMap when a single bucket chain exceeds 8 elements?',
      'How does the load factor affect Rehashing?'
    ],
    modelAnswer: {
      starMethod: 'Internal Architecture',
      answer: 'When two different keys produce the same hash bucket index via the hash function, a collision occurs. Two primary collision resolution techniques exist:\n1. Separate Chaining: Each bucket holds a linked list (or balanced Red-Black Tree in Java 8+ when entries exceed threshold 8) of colliding entries. It handles high load factors gracefully.\n2. Open Addressing (Linear Probing / Quadratic Probing / Double Hashing): All elements reside directly in the table array. If a collision occurs, the algorithm probes alternative slots in a deterministic sequence until an empty cell is found.'
    }
  },
  {
    id: 'tcs-tech-4',
    company: 'TCS NQT',
    roundType: 'Technical',
    topic: 'Object-Oriented Programming',
    question: 'What is the difference between an Abstract Class and an Interface, and when should you prefer one over the other?',
    expectedKeywords: ['abstract class', 'interface', 'multiple inheritance', 'default methods', 'state', 'contract', 'is-a', 'can-do'],
    followUpProbes: [
      'Can an abstract class have a constructor?',
      'Since Java 8 introduced default methods in interfaces, why do we still need abstract classes?'
    ],
    modelAnswer: {
      starMethod: 'Architectural Design Choice',
      answer: 'An Abstract Class represents an "is-a" relationship and can maintain state via instance variables, constructors, and partial implementation of methods. A class can extend only one abstract class due to single inheritance. An Interface represents a "can-do" capability or behavioral contract. A class can implement multiple interfaces.\n\nPrefer an Abstract Class when closely related classes share common state, protected members, or non-static helper methods. Prefer an Interface when defining a contractual capability (like Comparable or Serializable) across unrelated classes or when designing decoupled microservice APIs.'
    }
  },
  {
    id: 'tcs-tech-5',
    company: 'TCS NQT',
    roundType: 'Technical',
    topic: 'Operating Systems & Concurrency',
    question: 'What are the four necessary conditions for a Deadlock to occur, and how does Banker\'s Algorithm achieve Deadlock Avoidance?',
    expectedKeywords: ['mutual exclusion', 'hold and wait', 'no preemption', 'circular wait', 'safe state', 'resource allocation', 'banker algorithm'],
    followUpProbes: [
      'What is the difference between Deadlock Prevention and Deadlock Avoidance?',
      'How does a resource allocation graph detect cycles with multiple resource instances?'
    ],
    modelAnswer: {
      starMethod: 'OS Theoretical Framework',
      answer: 'A deadlock occurs only when four Coffman conditions hold simultaneously: 1. Mutual Exclusion (resources cannot be shared), 2. Hold and Wait (process holds resource while requesting another), 3. No Preemption (resources cannot be forcefully seized), 4. Circular Wait (a closed chain of processes each waiting for resource held by the next).\n\nBanker\'s Algorithm avoids deadlock by testing for safety on every resource request. It simulates the allocation and verifies whether a "safe execution sequence" exists where every process can eventually claim its maximum stated demand and terminate. If granting the request leads to an unsafe state, the requesting process is forced to wait.'
    }
  },
  {
    id: 'tcs-tech-6',
    company: 'TCS NQT',
    roundType: 'Technical',
    topic: 'Algorithms & Dynamic Programming',
    question: 'How do you determine if a problem can be solved using Dynamic Programming, and what is the difference between Top-Down Memoization and Bottom-Up Tabulation?',
    expectedKeywords: ['optimal substructure', 'overlapping subproblems', 'memoization', 'tabulation', 'recursion', 'space complexity', 'base case'],
    followUpProbes: [
      'In the 0/1 Knapsack problem, how do you optimize space complexity from O(N*W) to O(W)?',
      'What is an example of a problem that has optimal substructure but does NOT require dynamic programming?'
    ],
    modelAnswer: {
      starMethod: 'Algorithmic Optimization',
      answer: 'A problem is suitable for Dynamic Programming if it exhibits two core properties: 1. Overlapping Subproblems (the same subproblems are solved repeatedly, unlike Divide & Conquer), and 2. Optimal Substructure (an optimal solution to the overall problem incorporates optimal solutions to subproblems).\n\nTop-Down (Memoization) maintains the natural recursive call stack while caching subproblem results in a hash table or array on-demand. Bottom-Up (Tabulation) iteratively computes solutions starting from base cases upwards, completely eliminating recursion call-stack overhead and often permitting space optimization.'
    }
  },
  {
    id: 'tcs-hr-1',
    company: 'TCS NQT',
    roundType: 'HR',
    topic: 'Situational & Alignment',
    question: 'Why do you want to start your professional career with TCS, and how comfortable are you with relocating to any TCS development center in India?',
    expectedKeywords: ['ilp', 'training', 'tcs ethos', 'learning', 'relocation', 'adaptable', 'growth', 'client projects'],
    followUpProbes: [
      'How do you plan to handle adapting to a completely new city and project domain in your initial months?',
      'Are you open to working in rotational shifts if a global banking client requires it?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: As an aspiring software engineer, I seek a global technology leader known for exceptional employee development.\nTask: To align my career goals with TCS\'s continuous upskilling ecosystem.\nAction: I have researched TCS\'s world-class Initial Learning Program (ILP) and continuous learning platforms like iEvolve and Elevate Wings. I am 100% willing and excited to relocate to any development center across India, whether Chennai, Hyderabad, Pune, or Bengaluru, because living in new environments accelerates personal maturity and professional agility.\nResult: This flexibility ensures I can actively contribute to high-impact enterprise accounts from day one.'
    }
  },
  {
    id: 'tcs-hr-2',
    company: 'TCS NQT',
    roundType: 'HR',
    topic: 'Conflict Resolution',
    question: 'Describe a situation where you had a strong disagreement with a team member during a technical project. How did you resolve it?',
    expectedKeywords: ['conflict', 'perspective', 'communication', 'objective data', 'compromise', 'project goal', 'resolution'],
    followUpProbes: [
      'If the team member had still refused to agree with the data, what would your next escalation step have been?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: During our final-year project, my classmate wanted to use MongoDB for an e-commerce ledger, whereas I proposed PostgreSQL for ACID compliance.\nTask: Resolve the architectural impasse without delaying our sprint deadline or compromising relationship dynamics.\nAction: Instead of arguing preferences, I scheduled a 30-minute benchmark session. We wrote sample debit/credit scripts and demonstrated that without foreign key constraints and transactional rollback, partial failures created phantom balances. Seeing the reproducible results, my teammate agreed PostgreSQL was technically appropriate.\nResult: We delivered the project on time with zero transactional bugs and maintained a strong collaborative friendship.'
    }
  },
  {
    id: 'tcs-hr-3',
    company: 'TCS NQT',
    roundType: 'HR',
    topic: 'Pressure & Deadlines',
    question: 'Tell me about a time you had to deliver an academic or project submission under an extremely tight deadline. How did you organize your priorities?',
    expectedKeywords: ['prioritize', 'triage', 'deadline', 'milestones', 'time management', 'composure', 'outcome'],
    followUpProbes: [
      'What is one non-essential task that you deliberately dropped to hit that deadline?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: In our 6th semester, our team had 48 hours to complete a web portal after an external teammate had to take medical leave.\nTask: Restructure the deliverables to ensure full submission without missing requirements.\nAction: I applied the Eisenhower matrix. We froze UI styling enhancements to focus strictly on database schema integrity and authentication APIs. I instituted 2-hour mini-sprints and automated integration checks.\nResult: We completed testing 4 hours before the portal closed and earned the top score in our laboratory section.'
    }
  },
  {
    id: 'tcs-hr-4',
    company: 'TCS NQT',
    roundType: 'HR',
    topic: 'Failure & Self-Correction',
    question: 'Can you share an instance where a project or examination did not go as planned? What did you learn and how did you bounce back?',
    expectedKeywords: ['setback', 'accountability', 'root cause', 'learning', 'resilience', 'improvement', 'reflection'],
    followUpProbes: [
      'How has that experience changed how you approach software testing or project planning today?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: In a hackathon, our mobile app crashed during the live demo because we hardcoded local API endpoints and did not handle network timeouts.\nTask: Acknowledge the oversight, understand the failure point, and implement safeguards.\nAction: Rather than making excuses, I analyzed the crash logs immediately after the round, set up automated Postman tests with varying latency, and added global error boundary fallbacks.\nResult: In our next college hackathon, we implemented automated CI tests and won second place, proving that diagnosing failure yields lasting technical discipline.'
    }
  },

  // =========================================================================
  // 2. INFOSYS (Springboard / DSE / SE: 6 Qs Technical, 4 Qs HR)
  // =========================================================================
  {
    id: 'inf-tech-1',
    company: 'Infosys',
    roundType: 'Technical',
    topic: 'Java & Memory Management',
    question: 'How does Garbage Collection operate in the Java Virtual Machine, and what is the difference between the Young and Old generations?',
    expectedKeywords: ['jvm', 'garbage collector', 'eden', 'survivor', 'tenured', 'mark and sweep', 'stop the world', 'memory leak'],
    followUpProbes: [
      'Can an object in Java be eligible for Garbage Collection even if it still has circular references?',
      'What happens when the Tenured space runs out of memory?'
    ],
    modelAnswer: {
      starMethod: 'JVM Memory Internals',
      answer: 'Java\'s Garbage Collector automates heap memory reclamation using Generational Collection based on the weak generational hypothesis (most objects die young). Heap memory is partitioned into:\n1. Young Generation: Includes Eden space and two Survivor spaces (S0 and S1). New objects are allocated in Eden. Minor GC collects dead objects quickly, and survivors are aged.\n2. Old (Tenured) Generation: Objects that survive multiple GC cycles (threshold aging) get promoted here. Major/Full GC runs less frequently.\n\nThe Mark-and-Sweep algorithm traverses root references (GC Roots) to identify reachable objects and sweeps unreferenced ones. Circular references without an external GC root are properly collected because reachability analysis identifies them as unreachable.'
    }
  },
  {
    id: 'inf-tech-2',
    company: 'Infosys',
    roundType: 'Technical',
    topic: 'Database & SQL Optimization',
    question: 'How do Clustered and Non-Clustered Indexes work in relational databases, and when does an index degrade write performance?',
    expectedKeywords: ['index', 'b-tree', 'clustered', 'non-clustered', 'leaf node', 'pointer', 'write overhead', 'table scan'],
    followUpProbes: [
      'Why can a table have only ONE Clustered Index?',
      'What is a Covering Index in SQL?'
    ],
    modelAnswer: {
      starMethod: 'Storage Engine Mechanics',
      answer: 'A Clustered Index dictates the actual physical order of data rows on disk. Because rows can only be sorted physically in one sequence, a table can possess exactly one clustered index (usually on the Primary Key). The leaf nodes of a clustered B-Tree contain the actual data rows.\n\nA Non-Clustered Index maintains a separate logical structure containing the indexed column keys alongside row locators (pointers or clustered key values) that point to data pages. While indexes speed up SELECT lookups from O(N) to O(log N), every INSERT, UPDATE, or DELETE requires the DB engine to rebalance B-Tree nodes and update index trees, creating write overhead.'
    }
  },
  {
    id: 'inf-tech-3',
    company: 'Infosys',
    roundType: 'Technical',
    topic: 'Graph Algorithms',
    question: 'Explain Dijkstra\'s algorithm for single-source shortest paths, its time complexity using a Min-Priority Queue, and why it fails with negative edge weights.',
    expectedKeywords: ['dijkstra', 'greedy', 'priority queue', 'min-heap', 'relaxation', 'negative edges', 'bellman-ford', 'adjacency list'],
    followUpProbes: [
      'What is the exact time complexity of Dijkstra when implemented with a Fibonacci Heap versus a Binary Heap?',
      'Which algorithm would you use if the graph contains negative cycles?'
    ],
    modelAnswer: {
      starMethod: 'Algorithm Complexity & Limitations',
      answer: 'Dijkstra\'s algorithm finds the shortest path from a starting vertex to all other vertices in a weighted graph with non-negative edge weights. It maintains a distance array initialized to infinity and uses a Min-Heap (Priority Queue) to greedily extract the vertex with the current minimum distance, relaxing all its adjacent outgoing edges.\n\nWith an adjacency list and Binary Min-Heap, the time complexity is O((V + E) log V). It fails with negative weights because once a vertex is marked visited and its shortest distance finalized, the greedy assumption assumes no future edge can decrease that distance; negative weights violate this monotonic property, necessitating Bellman-Ford (O(V*E)).'
    }
  },
  {
    id: 'inf-tech-4',
    company: 'Infosys',
    roundType: 'Technical',
    topic: 'Object-Oriented Design',
    question: 'Can you explain the SOLID principles of Object-Oriented Software Design with concise code examples?',
    expectedKeywords: ['solid', 'single responsibility', 'open-closed', 'liskov substitution', 'interface segregation', 'dependency inversion'],
    followUpProbes: [
      'How does Dependency Inversion Principle facilitate unit testing with mock services?',
      'Can you give an example where Liskov Substitution Principle is commonly violated in geometric modeling?'
    ],
    modelAnswer: {
      starMethod: 'Software Architecture Principles',
      answer: 'SOLID stands for 5 core principles:\n- S (Single Responsibility): A class should have one, and only one, reason to change (e.g., separating user persistence from email notification).\n- O (Open-Closed): Open for extension, closed for modification (e.g., using strategy patterns rather than switch-cases).\n- L (Liskov Substitution): Subtypes must be substitutable for their base types without altering program correctness (the classic Square extending Rectangle violation).\n- I (Interface Segregation): Clients should not be forced to depend on interfaces they do not use (prefer small, granular interfaces).\n- D (Dependency Inversion): High-level modules should depend on abstractions rather than concrete implementations.'
    }
  },
  {
    id: 'inf-tech-5',
    company: 'Infosys',
    roundType: 'Technical',
    topic: 'Web Architecture & Microservices',
    question: 'What is the difference between Monolithic and Microservices architectures, and how do services communicate asynchronously?',
    expectedKeywords: ['monolith', 'microservices', 'coupling', 'scalability', 'message broker', 'kafka', 'rabbitmq', 'rest', 'event-driven'],
    followUpProbes: [
      'What is the CAP theorem, and how does it relate to distributed microservice databases?'
    ],
    modelAnswer: {
      starMethod: 'Distributed Systems',
      answer: 'A Monolithic architecture packages all business logic, UI handling, and database schemas into a single deployable artifact. It is simple to build initially but scales poorly and creates a single point of failure.\n\nMicroservices decouple business domains into independent, loosely coupled services communicating over lightweight protocols. Asynchronous communication is typically achieved using Message Brokers like Apache Kafka or RabbitMQ via publish-subscribe patterns, ensuring high availability, fault tolerance, and eventual consistency without blocking client threads.'
    }
  },
  {
    id: 'inf-tech-6',
    company: 'Infosys',
    roundType: 'Technical',
    topic: 'Data Structures & Trees',
    question: 'What is an AVL Tree, how does it maintain self-balancing properties, and what are the four rotation cases?',
    expectedKeywords: ['avl tree', 'binary search tree', 'balance factor', 'rotations', 'left-left', 'right-right', 'left-right', 'right-left', 'o(log n)'],
    followUpProbes: [
      'Why is AVL Tree preferred over Red-Black Tree for lookup-intensive workloads?'
    ],
    modelAnswer: {
      starMethod: 'Data Structure Balancing',
      answer: 'An AVL tree is a strictly self-balancing Binary Search Tree where the difference between heights of left and right subtrees (Balance Factor = Height(Left) - Height(Right)) for any node cannot exceed {-1, 0, +1}. When an insertion or deletion unbalances a node, it restores balance in O(1) time via four rotation cases:\n1. Left-Left (LL): Single Right Rotation.\n2. Right-Right (RR): Single Left Rotation.\n3. Left-Right (LR): Left rotation on child followed by Right rotation on parent.\n4. Right-Left (RL): Right rotation on child followed by Left rotation on parent.\n\nBecause AVL trees are more rigidly balanced than Red-Black trees, lookup operations are strictly bounded to 1.44 * log2(N), making them ideal for search-intensive applications.'
    }
  },
  {
    id: 'inf-hr-1',
    company: 'Infosys',
    roundType: 'HR',
    topic: 'Adaptability & Learning',
    question: 'At Infosys, continuous learning is deeply ingrained through our Mysore Training Center and Springboard platform. Tell me about a new programming language or framework you learned completely on your own.',
    expectedKeywords: ['self-taught', 'curiosity', 'documentation', 'hands-on', 'projects', 'debugging', 'growth mindset'],
    followUpProbes: [
      'What was the most challenging roadblock you encountered while learning it and how did you resolve it?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: In our 5th semester, our curriculum only covered C and Java, but our proposed web project required asynchronous JavaScript and Node.js.\nTask: Master modern JavaScript ES6, Node.js, and Express from scratch within 3 weeks.\nAction: I studied official MDN documentation, followed tutorial repositories, built 3 micro-projects (a CLI tool, a weather API consumer, and a JWT auth server), and practiced debugging asynchronous promises.\nResult: I completed our project backend ahead of schedule and mentored two classmates on asynchronous programming patterns.'
    }
  },
  {
    id: 'inf-hr-2',
    company: 'Infosys',
    roundType: 'HR',
    topic: 'Teamwork & Diversity',
    question: 'How do you handle collaborating with cross-functional team members from diverse backgrounds with differing communication styles?',
    expectedKeywords: ['active listening', 'empathy', 'clear documentation', 'respect', 'collaboration', 'alignment'],
    followUpProbes: [
      'How would you manage if a team member missed their committed deadline?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: During a multi-disciplinary college robotics competition, our team consisted of two computer science programmers, a mechanical engineer, and an electrical specialist.\nTask: Harmonize hardware specs and sensor output protocols across different terminologies.\nAction: I established a shared Notion workspace with concise interface definitions, scheduled daily 10-minute standups, and practiced active listening to ensure hardware constraints were understood before writing control code.\nResult: Our robot operated flawlessly during all 3 competition trial rounds with zero integration failures.'
    }
  },
  {
    id: 'inf-hr-3',
    company: 'Infosys',
    roundType: 'HR',
    topic: 'Integrity & Ethics',
    question: 'Suppose you found a critical defect in software right before client deployment, and your team lead suggested ignoring it to meet the milestone. What would you do?',
    expectedKeywords: ['transparency', 'client trust', 'risk mitigation', 'escalation', 'data integrity', 'ethics'],
    followUpProbes: [
      'What documentation would you prepare before speaking with your manager?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: Quality and integrity directly impact client trust and business operations.\nTask: Protect client data and production stability while respecting team timelines.\nAction: I would objectively document the bug with reproduction steps, assess its severity and likelihood in production, and formulate a targeted hotfix or fallback toggle. I would present this data to my lead calmly, emphasizing how a production outage would cost significantly more in reputation and SLA penalties than a brief coordinated patch window.\nResult: By proposing a clear solution rather than merely raising an alarm, we uphold ethical engineering and maintain client trust.'
    }
  },
  {
    id: 'inf-hr-4',
    company: 'Infosys',
    roundType: 'HR',
    topic: 'Career Vision',
    question: 'Where do you see yourself in 3 to 5 years at Infosys, and how do you plan to contribute to our digital transformation initiatives?',
    expectedKeywords: ['full stack', 'cloud certification', 'leadership', 'specialization', 'mentorship', 'client value'],
    followUpProbes: [
      'Which specific technical certification (e.g. AWS, Azure, Java) are you planning to pursue first?'
    ],
    modelAnswer: {
      starMethod: 'Professional Trajectory',
      answer: 'In the next 1 to 2 years, my priority is mastering Infosys foundation training, gaining AWS/Azure cloud certifications, and becoming a dependable core developer on an enterprise client account. In 3 to 5 years, I envision transitioning into a Senior Systems Engineer or Module Lead, architecting robust microservices and mentoring junior engineers while driving AI-assisted automation within client engagements.'
    }
  },

  // =========================================================================
  // 3. COGNIZANT (GenC / GenC Next: 6 Qs Technical, 4 Qs HR)
  // =========================================================================
  {
    id: 'cog-tech-1',
    company: 'Cognizant',
    roundType: 'Technical',
    topic: 'Computer Networks',
    question: 'Can you describe the TCP 3-Way Handshake and compare TCP vs UDP in terms of reliability, header overhead, and use cases?',
    expectedKeywords: ['syn', 'syn-ack', 'ack', 'connection-oriented', 'stateless', 'checksum', 'retransmission', 'flow control', 'streaming'],
    followUpProbes: [
      'Why does TCP require a 4-Way Handshake for connection teardown instead of 3?',
      'Why does DNS or Video Streaming prefer UDP over TCP?'
    ],
    modelAnswer: {
      starMethod: 'Networking Protocols',
      answer: 'The TCP 3-Way Handshake establishes a reliable full-duplex connection:\n1. SYN: Client sends a synchronization segment with an initial sequence number (ISN).\n2. SYN-ACK: Server acknowledges client\'s ISN and sends its own SYN sequence number.\n3. ACK: Client sends an acknowledgment back. The connection is now ESTABLISHED.\n\nTCP is connection-oriented, provides guaranteed in-order packet delivery, flow control, and error recovery via retransmissions (20-byte header). UDP is connectionless and lightweight (8-byte header) without retransmission or ordering guarantees. Use TCP for HTTP/HTTPS, file transfer, and banking; use UDP for live video streaming, VoIP, and gaming where low latency outweighs occasional dropped packets.'
    }
  },
  {
    id: 'cog-tech-2',
    company: 'Cognizant',
    roundType: 'Technical',
    topic: 'DBMS & Transactions',
    question: 'What are the four SQL Transaction Isolation Levels, and what concurrency anomalies (Dirty Read, Non-Repeatable Read, Phantom Read) does each prevent?',
    expectedKeywords: ['read uncommitted', 'read committed', 'repeatable read', 'serializable', 'dirty read', 'non-repeatable read', 'phantom read', 'locking'],
    followUpProbes: [
      'What is a Phantom Read, and how does Serializable isolation prevent it without table locks?',
      'What is the default isolation level in MySQL InnoDB versus Oracle/PostgreSQL?'
    ],
    modelAnswer: {
      starMethod: 'Concurrency & Isolation Matrix',
      answer: 'SQL defines four standard transaction isolation levels in order of increasing protection:\n1. Read Uncommitted: Permits dirty reads (reading uncommitted changes from concurrent transactions).\n2. Read Committed: Prevents Dirty Reads by ensuring queries only read committed data. However, Non-Repeatable Reads (reading different values of the same row on subsequent queries) can still occur.\n3. Repeatable Read: Prevents Dirty and Non-Repeatable Reads using snapshot MVCC or shared locks; however, Phantom Reads (new rows matching filter inserted by another transaction) can occur.\n4. Serializable: The strictest level; completely prevents Dirty, Non-Repeatable, and Phantom Reads by ensuring transactions execute as if strictly serial.'
    }
  },
  {
    id: 'cog-tech-3',
    company: 'Cognizant',
    roundType: 'Technical',
    topic: 'Data Structures & Pointers',
    question: 'How do you detect a cycle in a Singly Linked List, and can you walk me through Floyd\'s Cycle-Finding Algorithm (Tortoise and Hare)?',
    expectedKeywords: ['floyd', 'cycle detection', 'slow pointer', 'fast pointer', 'time complexity', 'space complexity', 'o(1) memory'],
    followUpProbes: [
      'Once a cycle is detected, how do you find the exact starting node of the cycle mathematically?',
      'Why does the fast pointer moving at 2x speed guarantee detection without skipping the slow pointer?'
    ],
    modelAnswer: {
      starMethod: 'Two-Pointer Technique',
      answer: 'Floyd\'s Cycle-Finding Algorithm employs two pointers moving at different speeds across the linked list: a slow pointer advancing 1 node per step, and a fast pointer advancing 2 nodes per step.\n\nIf the list is acyclic, the fast pointer reaches null in O(N) time with O(1) space. If a cycle exists, the relative distance between the fast and slow pointer increases by 1 node per iteration inside the loop; by modular arithmetic, the fast pointer is guaranteed to lap and meet the slow pointer within the cycle. To find the loop start, reset the slow pointer to the head; advance both pointers by 1 step simultaneously—their meeting point is the exact loop entrance.'
    }
  },
  {
    id: 'cog-tech-4',
    company: 'Cognizant',
    roundType: 'Technical',
    topic: 'Object-Oriented Programming',
    question: 'What is the difference between Method Overloading and Method Overriding, and how does the compiler/JVM resolve them?',
    expectedKeywords: ['overloading', 'overriding', 'compile-time', 'runtime', 'virtual method table', 'polymorphism', 'signature'],
    followUpProbes: [
      'Can you overload a method by changing only the return type in Java/C++? Why not?'
    ],
    modelAnswer: {
      starMethod: 'Polymorphism Mechanics',
      answer: 'Method Overloading represents Compile-Time (Static) Polymorphism: multiple methods in the same class share the identical name but differ in parameter count, types, or order. The compiler resolves the method binding during compilation based on static types.\n\nMethod Overriding represents Run-Time (Dynamic) Polymorphism: a subclass provides a specific implementation of a method already defined in its superclass with the identical signature. At runtime, the JVM uses dynamic dispatch via the Virtual Method Table (vtable) on the actual object instance to execute the appropriate version.'
    }
  },
  {
    id: 'cog-tech-5',
    company: 'Cognizant',
    roundType: 'Technical',
    topic: 'Web Technologies & Security',
    question: 'What is Cross-Origin Resource Sharing (CORS), why does the browser enforce the Same-Origin Policy, and what is a Preflight Request?',
    expectedKeywords: ['cors', 'same-origin policy', 'protocol', 'domain', 'port', 'preflight', 'options', 'access-control-allow-origin', 'security'],
    followUpProbes: [
      'Which HTTP methods trigger a CORS Preflight request?'
    ],
    modelAnswer: {
      starMethod: 'Browser Security Model',
      answer: 'The Same-Origin Policy (SOP) is a critical browser security boundary that blocks scripts on one origin (protocol + host + port) from reading private responses from another origin, preventing CSRF credential theft. CORS is a standard mechanism that allows servers to selectively permit cross-origin access by returning HTTP headers like `Access-Control-Allow-Origin: *`.\n\nFor non-simple HTTP requests (such as PUT, DELETE, or requests containing custom JSON headers), the browser automatically sends an HTTP OPTIONS Preflight request to inspect permissions before dispatching the actual payload.'
    }
  },
  {
    id: 'cog-tech-6',
    company: 'Cognizant',
    roundType: 'Technical',
    topic: 'Algorithms & Sorting',
    question: 'Explain the working of QuickSort, its average and worst-case time complexities, and how choosing a good pivot prevents worst-case degradation.',
    expectedKeywords: ['quicksort', 'divide and conquer', 'pivot', 'partitioning', 'o(n log n)', 'o(n^2)', 'randomized pivot', 'median-of-three'],
    followUpProbes: [
      'Why is QuickSort preferred over MergeSort for in-memory primitive sorting in standard libraries?'
    ],
    modelAnswer: {
      starMethod: 'Sorting Algorithms',
      answer: 'QuickSort is an in-place Divide-and-Conquer algorithm. It selects a "pivot" element, partitions the array such that all elements smaller than the pivot precede it and all larger elements follow it, and recursively sorts the sub-arrays. Average time complexity is O(N log N).\n\nWorst-case O(N^2) happens when the pivot consistently creates highly unbalanced partitions (e.g. picking the first element in an already sorted array). Implementing Randomized Pivot selection or Median-of-Three (median of first, middle, last elements) statistically prevents worst-case behavior. QuickSort is preferred for primitives because it operates in-place (O(log N) auxiliary space) and boasts exceptional CPU cache locality.'
    }
  },
  {
    id: 'cog-hr-1',
    company: 'Cognizant',
    roundType: 'HR',
    topic: 'Ambiguity & Problem Solving',
    question: 'Cognizant consultants frequently deal with ambiguous client requirements. Tell me about a time you worked on a project where instructions were unclear. How did you take ownership?',
    expectedKeywords: ['clarification', 'assumptions', 'mockups', 'iterative', 'proactive', 'stakeholders', 'ownership'],
    followUpProbes: [
      'How did you communicate your working assumptions to avoid unexpected rework?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: In our college department website revamp, the faculty coordinator provided only a one-line request: "Make the student placement portal modern and interactive."\nTask: Define concrete deliverables without getting stalled in analysis paralysis.\nAction: I created interactive Figma wireframes displaying 3 distinct design directions, drafted a clear feature matrix, and scheduled a 15-minute review to validate specific user flows for students and recruiters.\nResult: The coordinator immediately approved the second layout, and the portal launched without scope creep.'
    }
  },
  {
    id: 'cog-hr-2',
    company: 'Cognizant',
    roundType: 'HR',
    topic: 'Workplace Agility',
    question: 'What would you do if you were assigned to a project domain or technology stack that was completely outside your engineering specialization?',
    expectedKeywords: ['openness', 'versatile', 'fast learner', 'documentation', 'pairing', 'value creation'],
    followUpProbes: [
      'If the technology was legacy mainframe or proprietary tool, would that change your enthusiasm?'
    ],
    modelAnswer: {
      starMethod: 'Mindset & Approach',
      answer: 'I view unexpected technology assignments as unique differentiators. Computer science fundamentals—algorithms, data flows, problem breakdown—remain consistent across languages. I would immerse myself in documentation, review existing pull requests to understand architectural conventions, shadow a senior developer during sprint tasks, and build reference POCs. Being versatile makes an engineer indispensable.'
    }
  },
  {
    id: 'cog-hr-3',
    company: 'Cognizant',
    roundType: 'HR',
    topic: 'Feedback & Growth',
    question: 'Tell me about the most critical piece of feedback you received on your code or behavior, and how you responded to it.',
    expectedKeywords: ['constructive feedback', 'humility', 'refactoring', 'improvement', 'professionalism'],
    followUpProbes: [
      'Did you feel defensive initially, and how did you overcome that reaction?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: During a code review, a senior club mentor critiqued my 200-line monolithic controller function, noting it lacked unit testability and modularity.\nTask: Re-evaluate my approach without taking the critique personally.\nAction: I thanked the mentor, studied modular design patterns, broke the controller down into dedicated service layers with dependency injection, and added Jest unit tests for edge cases.\nResult: The refactored module had 95% test coverage and became our repository\'s gold-standard template for subsequent pull requests.'
    }
  },
  {
    id: 'cog-hr-4',
    company: 'Cognizant',
    roundType: 'HR',
    topic: 'Motivation & Long-Term Fit',
    question: 'What makes you confident that you will thrive in Cognizant\'s fast-paced corporate culture compared to startup or academic environments?',
    expectedKeywords: ['scale', 'global enterprise', 'structured training', 'mentorship', 'resilience', 'impact'],
    followUpProbes: [
      'How do you maintain work-life balance and manage burnout during intense project delivery phases?'
    ],
    modelAnswer: {
      starMethod: 'Alignment & Work Ethic',
      answer: 'Cognizant offers unmatched global enterprise scale, serving Fortune 500 leaders across healthcare, banking, and retail. I thrive in environments with clear processes, rigorous peer reviews, and structured career ladders where merit and technical excellence translate directly to leadership growth. My discipline, adaptability, and eagerness to solve enterprise-grade problems make Cognizant the natural home for my career.'
    }
  },

  // =========================================================================
  // 4. WIPRO (Elite NTH / Turbo: 6 Qs Technical, 4 Qs HR)
  // =========================================================================
  {
    id: 'wip-tech-1',
    company: 'Wipro',
    roundType: 'Technical',
    topic: 'C / C++ & Memory Allocation',
    question: 'Explain dynamic memory allocation in C/C++ (malloc vs calloc vs new), how memory leaks happen, and how tools detect dangling pointers.',
    expectedKeywords: ['malloc', 'calloc', 'free', 'new', 'delete', 'heap', 'memory leak', 'dangling pointer', 'valgrind'],
    followUpProbes: [
      'What is the fundamental difference between free() in C and delete in C++?',
      'How do smart pointers (std::unique_ptr, std::shared_ptr) in C++11 prevent memory leaks?'
    ],
    modelAnswer: {
      starMethod: 'Low-Level Memory Architecture',
      answer: '`malloc(size)` allocates uninitialized contiguous raw bytes on the heap, leaving garbage data. `calloc(num, size)` allocates memory and zero-initializes every byte. In C++, `new` allocates memory and automatically invokes the type\'s constructor.\n\nA Memory Leak occurs when dynamically allocated heap memory is not released via `free()` or `delete`, consuming system RAM indefinitely. A Dangling Pointer occurs when a pointer still references a memory location after it has been freed; dereferencing it triggers undefined behavior. Modern C++ solves this using RAII and Smart Pointers (`std::unique_ptr`, `std::shared_ptr`) that automatically free resources when going out of scope.'
    }
  },
  {
    id: 'wip-tech-2',
    company: 'Wipro',
    roundType: 'Technical',
    topic: 'Operating Systems & Synchronization',
    question: 'What is the Critical Section Problem, and what is the difference between a Mutex and a Counting Semaphore?',
    expectedKeywords: ['critical section', 'mutex', 'semaphore', 'locking', 'atomic', 'signaling', 'ownership', 'race condition'],
    followUpProbes: [
      'Can a Mutex be released by a thread other than the thread that acquired it? What about a Semaphore?'
    ],
    modelAnswer: {
      starMethod: 'Process Synchronization',
      answer: 'The Critical Section is a segment of code where shared resources (memory, file, variable) are accessed; concurrent modifications without synchronization cause race conditions. A valid synchronization solution must satisfy Mutual Exclusion, Progress, and Bounded Waiting.\n\nA Mutex (Mutual Exclusion) is a locking mechanism with strict ownership: only the thread that locks the mutex can unlock it (binary state 0 or 1). A Semaphore is a signaling mechanism with an integer counter (wait/signal operations); any thread can signal a semaphore to unblock another. Use a Mutex for exclusive resource protection and a Semaphore for signaling event completions or throttling connection pools.'
    }
  },
  {
    id: 'wip-tech-3',
    company: 'Wipro',
    roundType: 'Technical',
    topic: 'Software Engineering & Testing',
    question: 'Compare Agile Scrum vs Waterfall development methodologies, and explain the role of Unit Testing and CI/CD pipelines.',
    expectedKeywords: ['agile', 'waterfall', 'sprints', 'scrum', 'unit testing', 'ci/cd', 'automation', 'continuous integration'],
    followUpProbes: [
      'What are the key Scrum ceremonies and what happens in a Sprint Retrospective?'
    ],
    modelAnswer: {
      starMethod: 'SDLC Methodologies',
      answer: 'Waterfall is a linear sequential model where phases (Requirements, Design, Coding, Testing, Deployment) occur one after another; changes late in the lifecycle are extremely expensive. Agile Scrum is an iterative model where software is delivered in short increments (2-4 week sprints) with continuous stakeholder feedback.\n\nUnit Testing validates individual functions or components in isolation to catch regressions early. Continuous Integration and Continuous Deployment (CI/CD) pipelines automatically build, test, and package code on every repository commit, drastically accelerating time-to-market and release confidence.'
    }
  },
  {
    id: 'wip-tech-4',
    company: 'Wipro',
    roundType: 'Technical',
    topic: 'Data Structures & Recursion',
    question: 'How does Recursion utilize the Call Stack, what causes a Stack Overflow error, and how does Tail Call Optimization mitigate it?',
    expectedKeywords: ['recursion', 'call stack', 'stack frame', 'base case', 'stack overflow', 'tail recursion', 'optimization'],
    followUpProbes: [
      'Convert a recursive factorial into tail-recursive form with an accumulator.'
    ],
    modelAnswer: {
      starMethod: 'Stack Mechanics & Optimization',
      answer: 'Every recursive call pushes a new Stack Frame containing local variables, parameters, and the return address onto the runtime call stack. If the recursion lacks a proper base case or the depth exceeds available stack memory, a Stack Overflow occurs.\n\nTail Recursion occurs when the recursive call is the absolute final operation executed by the function. Compilers supporting Tail Call Optimization (TCO) reuse the existing stack frame instead of allocating a new one, converting recursive time and space overhead into an equivalent iterative O(1) space loop.'
    }
  },
  {
    id: 'wip-tech-5',
    company: 'Wipro',
    roundType: 'Technical',
    topic: 'Database & SQL Queries',
    question: 'Write a SQL query to find the Nth highest salary in an Employee table, and explain how the DENSE_RANK() window function achieves this.',
    expectedKeywords: ['sql', 'dense_rank', 'window function', 'subquery', 'offset', 'limit', 'partition by', 'order by'],
    followUpProbes: [
      'What is the difference between RANK(), DENSE_RANK(), and ROW_NUMBER() when salaries are tied?'
    ],
    modelAnswer: {
      starMethod: 'Advanced SQL Query Design',
      answer: 'Using the modern ANSI SQL `DENSE_RANK()` window function:\n\n```sql\nWITH RankedSalaries AS (\n  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rank_pos\n  FROM Employee\n)\nSELECT DISTINCT salary FROM RankedSalaries WHERE rank_pos = N;\n```\n\nDifference on ties:\n- `ROW_NUMBER()` assigns sequential unique integers (1, 2, 3) ignoring ties.\n- `RANK()` leaves gaps after ties (e.g. 1, 2, 2, 4).\n- `DENSE_RANK()` assigns identical ranks without gaps (e.g. 1, 2, 2, 3), making it ideal for retrieving the true Nth highest salary.'
    }
  },
  {
    id: 'wip-tech-6',
    company: 'Wipro',
    roundType: 'Technical',
    topic: 'Computer Architecture & Number Systems',
    question: 'How are negative integers represented in binary using Two\'s Complement, and why is Two\'s Complement universally preferred over Sign-Magnitude?',
    expectedKeywords: ['two\'s complement', 'one\'s complement', 'sign bit', 'arithmetic', 'single zero', 'adder circuit', 'overflow'],
    followUpProbes: [
      'How does hardware addition handle subtracting 5 from 3 using two\'s complement?'
    ],
    modelAnswer: {
      starMethod: 'Computer Architecture',
      answer: 'To find the Two\'s Complement of a binary integer: invert all bits (One\'s Complement) and add 1. It is universally preferred in modern processors for two key reasons:\n1. Single Zero: Sign-Magnitude and One\'s Complement have redundant positive zero (+0) and negative zero (-0), complicating hardware comparator logic. Two\'s Complement has exactly one unique zero.\n2. Unified Hardware ALU: Subtraction (A - B) can be computed using identical adder circuitry as (A + Two\'s Complement of B), eliminating the need for separate subtraction hardware.'
    }
  },
  {
    id: 'wip-hr-1',
    company: 'Wipro',
    roundType: 'HR',
    topic: 'Company Values (Spirit of Wipro)',
    question: 'The "Spirit of Wipro" highlights Be Passionate About Clients\' Success, Treat Each Person with Respect, Be Global and Responsible, and Unyielding Integrity. Which value resonates most with you?',
    expectedKeywords: ['spirit of wipro', 'respect', 'client success', 'integrity', 'responsibility', 'ethics', 'collaboration'],
    followUpProbes: [
      'Can you give an example where maintaining integrity required personal courage?'
    ],
    modelAnswer: {
      starMethod: 'Values & Personal Philosophy',
      answer: '"Unyielding Integrity" resonates deepest with me. Technical skills can always be trained and upgraded, but character and truthfulness form the foundation of sustainable engineering. In all my academic work, hackathons, and team collaborations, I maintain radical transparency regarding commitments, acknowledging mistakes early, and never taking credit for another person\'s work.'
    }
  },
  {
    id: 'wip-hr-2',
    company: 'Wipro',
    roundType: 'HR',
    topic: 'Shift Flexibility & Service Mindset',
    question: 'In enterprise IT services, client release windows or maintenance cycles may require weekend support or night shifts. Are you prepared to support rotational project shifts?',
    expectedKeywords: ['flexibility', 'dedication', 'team player', 'client first', 'rotational shifts', 'commitment'],
    followUpProbes: [
      'How do you manage your sleep and physical health when working night shifts?'
    ],
    modelAnswer: {
      starMethod: 'Commitment & Professionalism',
      answer: 'Yes, I am fully prepared and enthusiastic to work in rotational shifts. I recognize that global clients rely on Wipro 24/7 for business continuity. During college hackathons and exam preparations, I developed disciplined physical habits, time management, and sleep scheduling. As a fresher, being available for critical deployment windows accelerates my learning curve.'
    }
  },
  {
    id: 'wip-hr-3',
    company: 'Wipro',
    roundType: 'HR',
    topic: 'Handling Constructive Criticism',
    question: 'How do you handle working under a demanding supervisor who sets aggressive benchmarks?',
    expectedKeywords: ['proactive communication', 'milestones', 'resilience', 'high standards', 'alignment', 'clarity'],
    followUpProbes: [
      'How do you ensure you don\'t make the same mistake twice?'
    ],
    modelAnswer: {
      starMethod: 'Professional Composure',
      answer: 'I welcome high expectations because challenging standards propel faster professional maturation. I manage demanding environments by establishing proactive communication: clarifying acceptance criteria upfront, sharing work-in-progress snapshots to get early feedback, and taking detailed notes so that feedback is immediately incorporated.'
    }
  },
  {
    id: 'wip-hr-4',
    company: 'Wipro',
    roundType: 'HR',
    topic: 'Handling Monotonous Tasks',
    question: 'In initial project phases, engineers sometimes receive repetitive testing or documentation tasks. How will you keep yourself motivated?',
    expectedKeywords: ['automation', 'foundation', 'curiosity', 'efficiency', 'scripting', 'domain knowledge'],
    followUpProbes: [
      'Have you ever written a script to automate a routine task in your daily life?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: Routine tasks provide a comprehensive baseline understanding of system architecture and customer touchpoints.\nTask: Maximize efficiency while preventing burnout.\nAction: I treat repetitive tasks as opportunities for automation. In college, when we had to manually format 50 lab data files, I wrote a Python script with regex that parsed and formatted all files in 10 seconds.\nResult: This eliminated human error, saved 8 hours of labor, and allowed our team to focus on core algorithms.'
    }
  },

  // =========================================================================
  // 5. ACCENTURE (Cognitive & Technical: 6 Qs Technical, 4 Qs HR)
  // =========================================================================
  {
    id: 'acc-tech-1',
    company: 'Accenture',
    roundType: 'Technical',
    topic: 'Cloud Computing & Services',
    question: 'Can you differentiate between IaaS, PaaS, and SaaS cloud service models with examples, and explain why enterprises migrate to the cloud?',
    expectedKeywords: ['iaas', 'paas', 'saas', 'scalability', 'aws', 'azure', 'elasticity', 'pay-as-you-go', 'capex', 'opex'],
    followUpProbes: [
      'What is Shared Responsibility Model in cloud security?',
      'Can you explain the difference between Public, Private, and Hybrid Cloud?'
    ],
    modelAnswer: {
      starMethod: 'Cloud Architecture',
      answer: 'Cloud computing delivers on-demand computing resources over the internet with pay-as-you-go pricing:\n1. IaaS (Infrastructure as a Service): Provides raw virtualized hardware, VMs, storage, and networking (e.g. AWS EC2, Azure VMs). The user manages the OS, runtime, and applications.\n2. PaaS (Platform as a Service): Provides a managed runtime environment where developers deploy code without worrying about server provisioning or OS patching (e.g. AWS Elastic Beanstalk, Heroku).\n3. SaaS (Software as a Service): Complete end-user software delivered over the web (e.g. Microsoft 365, Google Workspace, Salesforce).\n\nEnterprises migrate to cloud for dynamic elasticity (auto-scaling to peak load), global multi-region availability, high durability, and converting massive upfront CapEx into flexible OpEx.'
    }
  },
  {
    id: 'acc-tech-2',
    company: 'Accenture',
    roundType: 'Technical',
    topic: 'Web Architecture & REST APIs',
    question: 'What makes an API "RESTful", and what are the key differences between HTTP GET, POST, PUT, PATCH, and DELETE?',
    expectedKeywords: ['rest', 'stateless', 'idempotent', 'get', 'post', 'put', 'patch', 'delete', 'http status codes', 'json'],
    followUpProbes: [
      'Which HTTP methods are idempotent, and why is idempotence critical in financial transactions?',
      'What is the difference between PUT and PATCH?'
    ],
    modelAnswer: {
      starMethod: 'API Standards',
      answer: 'REST (Representational State Transfer) is an architectural style based on statelessness, client-server separation, uniform resource URIs, and standard HTTP methods:\n- GET: Safely retrieves resources; must not alter server state (Safe & Idempotent).\n- POST: Submits data to create a new subordinate resource (Neither safe nor idempotent).\n- PUT: Replaces the entire resource representation idempotently.\n- PATCH: Applies partial modifications to a resource.\n- DELETE: Removes a resource idempotently.\n\nIdempotence means making multiple identical requests has the exact same side-effect on the server as making a single request—crucial in payment gateways to prevent double-charging.'
    }
  },
  {
    id: 'acc-tech-3',
    company: 'Accenture',
    roundType: 'Technical',
    topic: 'Cybersecurity & Authentication',
    question: 'How does JSON Web Token (JWT) authentication work, what are the three parts of a JWT token, and where should tokens be safely stored in the browser?',
    expectedKeywords: ['jwt', 'header', 'payload', 'signature', 'base64', 'http-only cookie', 'xss', 'csrf', 'stateless auth'],
    followUpProbes: [
      'Can the client read the contents of a JWT payload? Does signing encrypt the payload?'
    ],
    modelAnswer: {
      starMethod: 'Web Security Architecture',
      answer: 'A JSON Web Token consists of three Base64URL-encoded parts separated by dots:\n1. Header: Specifies the token type (JWT) and signing algorithm (e.g. HMAC SHA256 or RSA).\n2. Payload: Contains claims (e.g. user ID, expiration timestamp, roles). Note: It is signed, NOT encrypted; anyone can decode it.\n3. Signature: Created by taking the encoded header, payload, and a secret server key through the hashing algorithm to ensure tamper-proofing.\n\nFor security, tokens should be stored in `HttpOnly, Secure, SameSite=Strict` cookies rather than `localStorage`, preventing malicious JavaScript from stealing tokens via Cross-Site Scripting (XSS).'
    }
  },
  {
    id: 'acc-tech-4',
    company: 'Accenture',
    roundType: 'Technical',
    topic: 'DevOps & Containerization',
    question: 'What is Docker containerization, how does a Container differ from a Virtual Machine (VM), and what is the role of Kubernetes?',
    expectedKeywords: ['docker', 'container', 'virtual machine', 'hypervisor', 'docker engine', 'image', 'kubernetes', 'orchestration'],
    followUpProbes: [
      'What is the difference between a Docker Image and a Docker Container?'
    ],
    modelAnswer: {
      starMethod: 'DevOps & Cloud Native',
      answer: 'A Virtual Machine bundles a full guest operating system on top of a hypervisor, consuming gigabytes of storage and taking minutes to boot. A Docker container shares the host OS kernel and isolates processes using Linux namespaces and cgroups, making containers lightweight (megabytes) and instant to boot in milliseconds.\n\nA Docker Image is a read-only immutable template, while a Container is a running instance of an image. Kubernetes is an enterprise container orchestration platform that automates container deployment, horizontal scaling, self-healing, and load balancing across multi-node clusters.'
    }
  },
  {
    id: 'acc-tech-5',
    company: 'Accenture',
    roundType: 'Technical',
    topic: 'Database & SQL Injection',
    question: 'What is SQL Injection (SQLi), how does an attacker exploit poorly sanitized input, and how do Prepared Statements prevent it?',
    expectedKeywords: ['sql injection', 'prepared statements', 'parameterized queries', 'sanitization', 'orm', 'syntax vs data', 'security'],
    followUpProbes: [
      'Can an attacker still perform SQL Injection if an ORM like Hibernate or Prisma is used?'
    ],
    modelAnswer: {
      starMethod: 'Application Security Defense',
      answer: 'SQL Injection occurs when untrusted user input is directly concatenated into a dynamic SQL string, altering the query syntax structure (e.g. `\' OR \'1\'=\'1`). An attacker can bypass login authentication or dump entire tables.\n\nPrepared Statements (Parameterized Queries) neutralize SQL injection by separating the SQL query template compilation from the input data. The database engine compiles the query structure first; user values are subsequently treated strictly as literal data parameters, never as executable SQL commands, completely neutralizing malicious syntax.'
    }
  },
  {
    id: 'acc-tech-6',
    company: 'Accenture',
    roundType: 'Technical',
    topic: 'Data Structures & Heaps',
    question: 'What is a Binary Heap, how does it satisfy the Heap Order and Complete Binary Tree properties, and how is it stored in a 1D array?',
    expectedKeywords: ['binary heap', 'min-heap', 'max-heap', 'complete binary tree', 'heapify', 'array representation', 'priority queue'],
    followUpProbes: [
      'Given an element at index i (0-indexed), what are the formulas for its parent, left child, and right child in an array?'
    ],
    modelAnswer: {
      starMethod: 'Binary Heap Structure',
      answer: 'A Binary Heap is a Complete Binary Tree (all levels filled except possibly the last, which is filled from left to right) satisfying the Heap Property:\n- In a Max-Heap, every parent node is greater than or equal to its children.\n- In a Min-Heap, every parent node is less than or equal to its children.\n\nBecause it is complete, it can be represented compactly as a 1D array without pointers. For node at 0-indexed position i:\n- Parent: `Math.floor((i - 1) / 2)`\n- Left Child: `2 * i + 1`\n- Right Child: `2 * i + 2`\nInsertion and extraction take O(log N) using sift-up and sift-down (heapify).'
    }
  },
  {
    id: 'acc-hr-1',
    company: 'Accenture',
    roundType: 'HR',
    topic: 'Innovation & Value Creation',
    question: 'At Accenture, innovation and continuous reinvention are core values. Tell me about a time you introduced a creative solution or improved an existing process.',
    expectedKeywords: ['innovation', 'initiative', 'creative', 'automation', 'efficiency', 'problem-solving', 'impact'],
    followUpProbes: [
      'What feedback did you receive from your peers after introducing this improvement?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: In our college coding club, evaluating 120 student lab submissions was done manually by mentors, taking 4 to 5 days and leading to inconsistent feedback.\nTask: To streamline and automate code submission evaluation to provide students immediate feedback.\nAction: I built a lightweight Python script paired with GitHub Webhooks that automatically ran test cases against student pull requests and posted pass/fail statuses and execution times directly as commit comments.\nResult: Mentor evaluation time dropped from 5 days to under 2 minutes, and submission quality improved by 40% because students could iterate immediately before deadlines.'
    }
  },
  {
    id: 'acc-hr-2',
    company: 'Accenture',
    roundType: 'HR',
    topic: 'Client-Centric Mindset',
    question: 'How do you balance delivering high-quality code with meeting urgent client delivery deadlines?',
    expectedKeywords: ['mvp', 'trade-offs', 'modular code', 'refactoring', 'stakeholder communication', 'quality'],
    followUpProbes: [
      'If you have to incur technical debt to hit a client milestone, how do you manage it afterward?'
    ],
    modelAnswer: {
      starMethod: 'Engineering Trade-offs',
      answer: 'I balance quality and speed through disciplined iterative delivery. I first identify the Minimum Viable Product (MVP) core features that fulfill the client\'s immediate business need, write clean modular code with essential unit tests, and defer non-critical aesthetic flourishes. If temporary technical debt is incurred to meet an urgent milestone, I immediately document it in the sprint backlog and schedule a dedicated refactoring window in the subsequent sprint.'
    }
  },
  {
    id: 'acc-hr-3',
    company: 'Accenture',
    roundType: 'HR',
    topic: 'Resilience & Overcoming Setbacks',
    question: 'Tell me about an instance when you faced significant resistance to an idea you proposed. How did you handle the situation?',
    expectedKeywords: ['empathy', 'active listening', 'persuasion', 'data-driven', 'collaboration', 'respect'],
    followUpProbes: [
      'Did you compromise on any part of your original proposal?'
    ],
    modelAnswer: {
      starMethod: 'STAR (Situation, Task, Action, Result)',
      answer: 'Situation: During a tech fest hackathon, I proposed using a Serverless cloud backend, but my teammates were hesitant due to unfamiliarity with AWS Lambda pricing and cold starts.\nTask: Address team concerns objectively without creating friction.\nAction: Rather than insisting, I built a quick 10-minute proof-of-concept demonstrating free-tier limits, simulated request latency, and created a 1-page deployment guide so everyone could easily run local tests.\nResult: The team felt reassured, adopted the serverless architecture, and we deployed our app seamlessly with zero infrastructure costs.'
    }
  },
  {
    id: 'acc-hr-4',
    company: 'Accenture',
    roundType: 'HR',
    topic: 'Lifelong Learning & Generative AI',
    question: 'With Generative AI transforming software engineering, how are you leveraging modern AI tools in your personal development and coding workflow?',
    expectedKeywords: ['gen ai', 'copilot', 'productivity', 'code review', 'critical thinking', 'ethics', 'prompt engineering'],
    followUpProbes: [
      'How do you verify AI-generated code for security vulnerabilities or hallucinated APIs?'
    ],
    modelAnswer: {
      starMethod: 'AI-Augmented Engineering',
      answer: 'I treat Generative AI as a force-multiplier for productivity rather than a substitute for thinking. I use AI to generate boilerplate scaffolding, brainstorm test edge cases, and explain unfamiliar compiler error messages. However, I always rigorously review generated code against documentation, verify algorithmic time complexity, and write automated tests to protect against hallucinations or security vulnerabilities.'
    }
  }
];

module.exports = { INTERVIEW_PYQ_DATASET };
