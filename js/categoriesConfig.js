const TRACK_HIERARCHY = {
  "Quantitative Aptitude": {
    categoryKey: "Aptitude",
    subCategories: [
      "Arithmetic (Time & Work, Percentages, Profit & Loss, Ratios, Speed & Distance)",
      "Data Interpretation (Bar Graphs, Pie Charts, Tables, Line Charts)"
    ]
  },
  "Verbal (English)": {
    categoryKey: "Verbal",
    subCategories: [
      "Verbal Ability (Vocabulary, Synonyms & Antonyms, Idioms)",
      "Verbal Test (Sentence Correction, Reading Comprehension, Spotting Errors)"
    ]
  },
  "Reasoning": {
    categoryKey: "Reasoning",
    subCategories: [
      "Logical Reasoning (Number Series, Blood Relations, Syllogisms, Coding-Decoding)",
      "Verbal Reasoning (Analogy, Statement & Assumptions, Cause & Effect)",
      "Non-Verbal Reasoning (Pattern Completion, Mirror Images, Figure Matrix)"
    ]
  },
  "Programming & Tech": {
    categoryKey: "Programming",
    subCategories: [
      "Python Programming",
      "C Programming",
      "C++ Programming",
      "C# (.NET)",
      "Java Programming"
    ]
  },
  "Interview Preparation": {
    categoryKey: "Interview",
    subCategories: [
      "HR Interview (Behavioral Questions, Situation Responses)",
      "Technical Interview (Core CS, DBMS, OOPs, OS)",
      "Group Discussion (GD Topics, Points & Argument Strategies)"
    ]
  },
  "Placement Papers": {
    categoryKey: "PlacementPaper",
    subCategories: [
      "TCS NQT",
      "Infosys Springboard",
      "Cognizant GenC",
      "Wipro Elite",
      "Accenture Cognitive & Technical"
    ]
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRACK_HIERARCHY };
}
if (typeof window !== 'undefined') {
  window.TRACK_HIERARCHY = TRACK_HIERARCHY;
}
