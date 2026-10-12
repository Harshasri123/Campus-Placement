/**
 * Online Quiz Application - Question Bank
 * Standard: Intermediate / Grade 11-12 Level
 * Subjects: Mathematics, Physics, English
 */

const quizData = {
  mathematics: {
    title: "Mathematics",
    icon: "📐",
    accent: "var(--accent-math)",
    badge: "10 Questions • Intermediate",
    description: "Test your skills in Calculus, Coordinate Geometry, Trigonometry, Vectors, and Algebra.",
    recommendedTimeMinutes: 10,
    questions: [
      {
        id: 1,
        question: "What is the derivative of f(x) = x³ · ln(x) with respect to x?",
        options: [
          "3x² · ln(x)",
          "x² · (3ln(x) + 1)",
          "3x² / x",
          "x³ / x + 3x²"
        ],
        correctIndex: 1,
        explanation: "Using the product rule d/dx [u · v] = u'v + uv': Let u = x³ and v = ln(x). Then u' = 3x² and v' = 1/x. So, f'(x) = (3x²)(ln(x)) + (x³)(1/x) = 3x²ln(x) + x² = x²(3ln(x) + 1).",
        concept: "Calculus: Product Rule of Differentiation"
      },
      {
        id: 2,
        question: "Evaluate the limit: lim (x → 0) [sin(5x) / (2x)].",
        options: [
          "0",
          "1",
          "5/2",
          "Does not exist"
        ],
        correctIndex: 2,
        explanation: "Using the standard trigonometric limit lim(θ → 0) [sin(θ)/θ] = 1: Rewrite the expression as (5/2) · [sin(5x) / (5x)]. As x → 0, 5x → 0, so lim [sin(5x)/(5x)] = 1. Therefore, the limit is (5/2) · 1 = 5/2.",
        concept: "Calculus: Standard Trigonometric Limits"
      },
      {
        id: 3,
        question: "If vector A = 2i + 3j - k and vector B = i - 2j + 2k, what is the dot product (A · B)?",
        options: [
          "-6",
          "-4",
          "2",
          "8"
        ],
        correctIndex: 0,
        explanation: "The dot product of two vectors A = a₁i + a₂j + a₃k and B = b₁i + b₂j + b₃k is A · B = a₁b₁ + a₂b₂ + a₃b₃. Here, (2)(1) + (3)(-2) + (-1)(2) = 2 - 6 - 2 = -6.",
        concept: "Vector Algebra: Scalar (Dot) Product"
      },
      {
        id: 4,
        question: "What is the value of definite integral ∫ from 0 to π/2 of cos(x) dx?",
        options: [
          "0",
          "1",
          "π / 2",
          "-1"
        ],
        correctIndex: 1,
        explanation: "The antiderivative of cos(x) is sin(x). Evaluating from 0 to π/2: [sin(π/2) - sin(0)] = 1 - 0 = 1.",
        concept: "Calculus: Definite Integrals"
      },
      {
        id: 5,
        question: "Find the roots of the quadratic equation: 2x² - 7x + 3 = 0.",
        options: [
          "x = 3, x = 1/2",
          "x = -3, x = -1/2",
          "x = 7, x = 3",
          "x = 2, x = 3/2"
        ],
        correctIndex: 0,
        explanation: "Factoring the quadratic equation: 2x² - 6x - x + 3 = 0 => 2x(x - 3) - 1(x - 3) = 0 => (2x - 1)(x - 3) = 0. Hence, x = 1/2 or x = 3.",
        concept: "Algebra: Quadratic Equations by Factoring"
      },
      {
        id: 6,
        question: "What is the slope of the line perpendicular to the line 3x - 4y + 8 = 0?",
        options: [
          "3/4",
          "-3/4",
          "4/3",
          "-4/3"
        ],
        correctIndex: 3,
        explanation: "Rewrite the given line in slope-intercept form (y = mx + c): 4y = 3x + 8 => y = (3/4)x + 2. The slope m₁ = 3/4. Two perpendicular lines satisfy m₁ · m₂ = -1, which gives m₂ = -1 / (3/4) = -4/3.",
        concept: "Coordinate Geometry: Perpendicular Slopes"
      },
      {
        id: 7,
        question: "How many distinct 4-letter arrangements can be formed using the letters of the word 'MATH' without repetition?",
        options: [
          "12",
          "16",
          "24",
          "256"
        ],
        correctIndex: 2,
        explanation: "The word 'MATH' has 4 distinct letters. The number of permutations of 4 distinct items taken 4 at a time is 4! = 4 × 3 × 2 × 1 = 24.",
        concept: "Combinatorics: Permutations"
      },
      {
        id: 8,
        question: "Simplify the trigonometric expression: [1 - cos(2θ)] / sin(2θ).",
        options: [
          "tan(θ)",
          "cot(θ)",
          "sin(θ)",
          "sec(θ)"
        ],
        correctIndex: 0,
        explanation: "Using the double angle identities: 1 - cos(2θ) = 2sin²(θ), and sin(2θ) = 2sin(θ)cos(θ). Therefore, [2sin²(θ)] / [2sin(θ)cos(θ)] = sin(θ) / cos(θ) = tan(θ).",
        concept: "Trigonometry: Double Angle Identities"
      },
      {
        id: 9,
        question: "If the determinant of a 2x2 matrix [[k, 4], [2, 3]] is equal to 10, what is the value of k?",
        options: [
          "4",
          "6",
          "8",
          "-2"
        ],
        correctIndex: 1,
        explanation: "The determinant of [[a, b], [c, d]] is ad - bc. Here, (k)(3) - (4)(2) = 10 => 3k - 8 = 10 => 3k = 18 => k = 6.",
        concept: "Linear Algebra: Determinants"
      },
      {
        id: 10,
        question: "A bag contains 5 red, 4 blue, and 3 green marbles. What is the probability of randomly drawing a marble that is NOT red?",
        options: [
          "5/12",
          "7/12",
          "1/3",
          "1/4"
        ],
        correctIndex: 1,
        explanation: "Total marbles = 5 + 4 + 3 = 12. Non-red marbles (blue + green) = 4 + 3 = 7. Thus, the probability P(not red) = 7/12.",
        concept: "Probability: Complementary Events"
      }
    ]
  },

  physics: {
    title: "Physics",
    icon: "⚡",
    accent: "var(--accent-physics)",
    badge: "10 Questions • Intermediate",
    description: "Explore Classical Mechanics, Thermodynamics, Electromagnetism, Optics, and Modern Physics.",
    recommendedTimeMinutes: 10,
    questions: [
      {
        id: 1,
        question: "A projectile is launched from flat ground with initial speed v at angle θ to the horizontal. At what angle is maximum horizontal range achieved (ignoring air resistance)?",
        options: [
          "30°",
          "45°",
          "60°",
          "90°"
        ],
        correctIndex: 1,
        explanation: "Horizontal range formula is R = (v² sin 2θ) / g. The range is maximized when sin(2θ) reaches its maximum value of 1, which occurs when 2θ = 90°, so θ = 45°.",
        concept: "Mechanics: Projectile Motion"
      },
      {
        id: 2,
        question: "According to the First Law of Thermodynamics, if 300 J of heat is added to a system and the system performs 120 J of work on its surroundings, what is the change in internal energy (ΔU)?",
        options: [
          "420 J",
          "180 J",
          "-180 J",
          "2.5 J"
        ],
        correctIndex: 1,
        explanation: "The First Law of Thermodynamics states ΔU = Q - W, where Q is heat added to the system (+300 J) and W is work done by the system (+120 J). Therefore, ΔU = 300 J - 120 J = 180 J.",
        concept: "Thermodynamics: First Law & Internal Energy"
      },
      {
        id: 3,
        question: "A ray of light enters water (index of refraction n = 1.33) from air (n ≈ 1.00) at an angle of incidence of 30°. What is the sine of the angle of refraction?",
        options: [
          "0.376",
          "0.500",
          "0.665",
          "0.250"
        ],
        correctIndex: 0,
        explanation: "By Snell's Law: n₁ · sin(θ₁) = n₂ · sin(θ₂). Here, 1.00 · sin(30°) = 1.33 · sin(θ₂). Since sin(30°) = 0.50, sin(θ₂) = 0.50 / 1.33 ≈ 0.376.",
        concept: "Optics: Snell's Law of Refraction"
      },
      {
        id: 4,
        question: "What happens to the capacitance of a parallel plate capacitor if the distance between its plates is doubled while keeping the plate area constant?",
        options: [
          "It is quadrupled",
          "It is doubled",
          "It is halved",
          "It remains unchanged"
        ],
        correctIndex: 2,
        explanation: "Capacitance of a parallel plate capacitor is given by C = (ε₀ · A) / d. Since capacitance is inversely proportional to plate separation d, doubling d reduces capacitance to half its initial value.",
        concept: "Electromagnetism: Capacitors and Dielectrics"
      },
      {
        id: 5,
        question: "In Einstein's photoelectric equation (hf = Φ + KE_max), what does 'Φ' (phi) represent?",
        options: [
          "Threshold frequency",
          "Work function of the metal",
          "De Broglie wavelength",
          "Stopping potential"
        ],
        correctIndex: 1,
        explanation: "Φ represents the work function of the metal surface—the minimum amount of photon energy required to liberate an electron from the surface with zero kinetic energy.",
        concept: "Modern Physics: Photoelectric Effect"
      },
      {
        id: 6,
        question: "A 2 kg block accelerates along a frictionless horizontal surface at 4 m/s². What is the net force acting on the block?",
        options: [
          "2 N",
          "4 N",
          "8 N",
          "16 N"
        ],
        correctIndex: 2,
        explanation: "According to Newton's Second Law: F_net = m · a. Substituting the given values: F_net = (2 kg)(4 m/s²) = 8 N.",
        concept: "Mechanics: Newton's Second Law"
      },
      {
        id: 7,
        question: "In Young's Double Slit Experiment, what happens to fringe width (β) if the wavelength of monochromatic light (λ) is increased?",
        options: [
          "Fringe width decreases",
          "Fringe width increases",
          "Fringe width remains unchanged",
          "Fringes disappear completely"
        ],
        correctIndex: 1,
        explanation: "The fringe width in Young's experiment is β = (λ · D) / d, where D is distance to screen and d is slit separation. Since β is directly proportional to wavelength λ, increasing λ increases the fringe width.",
        concept: "Wave Optics: Interference and Fringe Width"
      },
      {
        id: 8,
        question: "Which of the following describes the nature of sound waves in air?",
        options: [
          "Transverse electromagnetic waves",
          "Longitudinal mechanical waves",
          "Transverse mechanical waves",
          "Stationary non-mechanical waves"
        ],
        correctIndex: 1,
        explanation: "Sound waves in air are longitudinal mechanical waves because the particles of the medium oscillate parallel to the direction of wave propagation through compressions and rarefactions.",
        concept: "Waves: Nature of Sound"
      },
      {
        id: 9,
        question: "A Carnot heat engine operates between a heat source at 500 K and a heat sink at 300 K. What is the maximum theoretical efficiency of this engine?",
        options: [
          "20%",
          "40%",
          "60%",
          "66.7%"
        ],
        correctIndex: 1,
        explanation: "The efficiency of an ideal Carnot engine is η = 1 - (T_cold / T_hot). Substituting absolute temperatures: η = 1 - (300 / 500) = 1 - 0.60 = 0.40, which corresponds to 40%.",
        concept: "Thermodynamics: Carnot Engine Efficiency"
      },
      {
        id: 10,
        question: "Lenz's law of electromagnetic induction is a direct consequence of which fundamental conservation law?",
        options: [
          "Conservation of Electric Charge",
          "Conservation of Energy",
          "Conservation of Linear Momentum",
          "Conservation of Mass"
        ],
        correctIndex: 1,
        explanation: "Lenz's law states that induced emf opposes the change in magnetic flux that causes it. Mechanical work must be done against this opposing force, which converts into electrical energy, satisfying the Conservation of Energy.",
        concept: "Electromagnetism: Faraday's and Lenz's Laws"
      }
    ]
  },

  english: {
    title: "English",
    icon: "📚",
    accent: "var(--accent-english)",
    badge: "10 Questions • Intermediate",
    description: "Master grammar, sentence corrections, vocabulary in context, and verbal reasoning.",
    recommendedTimeMinutes: 10,
    questions: [
      {
        id: 1,
        question: "Select the sentence with correct subject-verb agreement:",
        options: [
          "Neither the teacher nor the students was aware of the schedule change.",
          "Neither the teacher nor the students were aware of the schedule change.",
          "Neither the teacher nor the students is aware of the schedule change.",
          "Neither the teacher or the students was aware of the schedule change."
        ],
        correctIndex: 1,
        explanation: "When subjects are joined by 'neither... nor', the verb must agree with the subject closest to it. Here, 'students' is plural and closest to the verb, so 'were aware' is grammatically correct.",
        concept: "Grammar: Proximity Rule in Correlative Conjunctions"
      },
      {
        id: 2,
        question: "Identify the sentence that uses the subjunctive mood correctly:",
        options: [
          "The committee insisted that he is present at the hearing.",
          "The committee insisted that he be present at the hearing.",
          "The committee insisted that he was present at the hearing.",
          "The committee insisted that he will be present at the hearing."
        ],
        correctIndex: 1,
        explanation: "Verbs of demand, recommendation, or necessity (like 'insist', 'demand', 'recommend') take the subjunctive mood in the 'that' clause, using the base form of the verb ('be') regardless of the subject.",
        concept: "Grammar: Subjunctive Mood with Verbs of Demand"
      },
      {
        id: 3,
        question: "What is the meaning of the idiom 'to burn the midnight oil'?",
        options: [
          "To waste fuel carelessly",
          "To work or study late into the night",
          "To destroy evidence before an investigation",
          "To quarrel heatedly over trivial matters"
        ],
        correctIndex: 1,
        explanation: "'To burn the midnight oil' is a traditional idiom that means to work, write, or study late into the night, originating from reading by oil lamp.",
        concept: "Idioms & Figurative Language"
      },
      {
        id: 4,
        question: "Choose the word that is most nearly OPPOSITE in meaning (antonym) to 'EPHEMERAL':",
        options: [
          "Transient",
          "Fleeting",
          "Perpetual",
          "Delicate"
        ],
        correctIndex: 2,
        explanation: "'Ephemeral' means lasting for a very short time; transient. Its direct antonym is 'perpetual', meaning everlasting or occurring continually.",
        concept: "Vocabulary: Antonyms and Etymology"
      },
      {
        id: 5,
        question: "Identify the sentence that avoids a misplaced or dangling modifier:",
        options: [
          "Walking down the street, the trees looked vibrant in the autumn sunlight.",
          "Walking down the street, Sarah admired how vibrant the trees looked in the autumn sunlight.",
          "Having finished the exam, the classroom quickly emptied.",
          "Barking loudly, the mailman was frightened by the dog."
        ],
        correctIndex: 1,
        explanation: "In option B, the modifying participial phrase 'Walking down the street' clearly and logically modifies the subject immediately following it ('Sarah'). In option A, it implies the trees were walking.",
        concept: "Syntax: Dangling and Misplaced Modifiers"
      },
      {
        id: 6,
        question: "Complete the analogy: EPILOGUE : NOVEL :: ____________ : ____________",
        options: [
          "Prologue : Preface",
          "Coda : Symphony",
          "Introduction : Thesis",
          "Index : Glossary"
        ],
        correctIndex: 1,
        explanation: "An epilogue is the concluding section of a novel that rounds out the work. Similarly, a coda is the concluding musical passage of a movement or symphony.",
        concept: "Verbal Reasoning: Analogies"
      },
      {
        id: 7,
        question: "Convert the following active sentence to passive voice: 'The researchers will publish their findings next month.'",
        options: [
          "Their findings would be published by the researchers next month.",
          "Their findings are being published next month by the researchers.",
          "Their findings will be published by the researchers next month.",
          "Next month, the researchers have published their findings."
        ],
        correctIndex: 2,
        explanation: "The active sentence uses simple future tense ('will publish'). In the passive voice, this becomes 'will be + past participle' ('will be published').",
        concept: "Grammar: Active and Passive Voice Conversion"
      },
      {
        id: 8,
        question: "Choose the correctly punctuated sentence with a non-restrictive (parenthetical) relative clause:",
        options: [
          "My brother who lives in Chicago is a cardiovascular surgeon.",
          "My brother, who lives in Chicago, is a cardiovascular surgeon.",
          "My brother, that lives in Chicago is a cardiovascular surgeon.",
          "My brother who lives in Chicago, is a cardiovascular surgeon."
        ],
        correctIndex: 1,
        explanation: "A non-restrictive relative clause provides additional, non-essential information and must be set off by a pair of commas. Also, 'who' is used for persons rather than 'that'.",
        concept: "Punctuation: Non-Restrictive Relative Clauses"
      },
      {
        id: 9,
        question: "Which word best completes the blank in context? 'Despite intense scrutiny, the accountant's records were found to be completely ________, devoid of any discrepancy.'",
        options: [
          "ambiguous",
          "impeccable",
          "tentative",
          "superfluous"
        ],
        correctIndex: 1,
        explanation: "'Impeccable' means faultless, beyond reproach, or in accordance with the highest standards. In the sentence context, having zero discrepancy confirms impeccable record-keeping.",
        concept: "Vocabulary: Contextual Sentence Completion"
      },
      {
        id: 10,
        question: "Identify the figure of speech used in: 'The wind whispered secrets through the shivering autumn leaves.'",
        options: [
          "Hyperbole",
          "Personification",
          "Oxymoron",
          "Synecdoche"
        ],
        correctIndex: 1,
        explanation: "Personification is giving human traits, qualities, or actions (whispering secrets, shivering) to non-human or inanimate entities (the wind, leaves).",
        concept: "Literary Devices: Figures of Speech"
      }
    ]
  }
};

// Provide support for module export if used in Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quizData };
}
