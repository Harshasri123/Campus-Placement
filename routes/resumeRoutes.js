const express = require('express');

const router = express.Router();

const PRESET_ROLES = {
  'sde-graduate': {
    title: 'Software Development Engineer (Graduate / Entry-Level)',
    targetCompanies: ['TCS Digital', 'Infosys DSE', 'Cognizant GenC Next', 'Wipro Turbo'],
    requiredSkills: [
      'Data Structures', 'Algorithms', 'Java', 'Python', 'C++',
      'SQL', 'DBMS', 'OOPs', 'Operating Systems', 'Computer Networks',
      'Git', 'Problem Solving', 'Unit Testing'
    ],
    bonusSkills: ['Docker', 'REST APIs', 'Linux', 'CI/CD', 'Cloud Basics']
  },
  'fullstack-web': {
    title: 'Full-Stack Web Developer (MERN / Java Spring)',
    targetCompanies: ['Accenture', 'Cognizant', 'Capgemini', 'Product Startups'],
    requiredSkills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
      'HTML5', 'CSS3', 'REST APIs', 'SQL', 'MongoDB',
      'Git', 'Authentication', 'State Management'
    ],
    bonusSkills: ['Next.js', 'Docker', 'AWS', 'GraphQL', 'TailwindCSS', 'Jest']
  },
  'data-analyst': {
    title: 'Data Analyst / Associate BI Engineer',
    targetCompanies: ['Mu Sigma', 'Cognizant', 'TCS Analytics', 'Deloitte'],
    requiredSkills: [
      'SQL', 'Python', 'Pandas', 'NumPy', 'Data Visualization',
      'Excel', 'Statistics', 'Power BI', 'Tableau', 'Data Cleaning'
    ],
    bonusSkills: ['R', 'Machine Learning', 'BigQuery', 'Snowflake', 'ETL Pipelines']
  },
  'cloud-devops': {
    title: 'Cloud & Infrastructure Associate',
    targetCompanies: ['Wipro Cloud', 'Accenture Cloud', 'Infosys Cobalt'],
    requiredSkills: [
      'Linux', 'Bash', 'Docker', 'Kubernetes', 'Git',
      'AWS', 'Azure', 'Networking', 'CI/CD', 'Python'
    ],
    bonusSkills: ['Terraform', 'Ansible', 'Prometheus', 'Grafana', 'Jenkins']
  }
};

const ACTION_VERBS = [
  'developed', 'engineered', 'built', 'implemented', 'designed', 'optimized',
  'spearheaded', 'automated', 'deployed', 'orchestrated', 'reduced', 'increased',
  'achieved', 'integrated', 'refactored', 'accelerated', 'collaborated'
];

router.get('/roles', (req, res) => {
  res.json({ roles: PRESET_ROLES });
});

router.post('/analyze', (req, res) => {
  try {
    const { resumeText = '', roleId = 'sde-graduate', customJobDescription = '' } = req.body;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Please provide at least 50 characters of resume content to analyze.' });
    }

    const lowerResume = resumeText.toLowerCase();

    // Determine target skill pool
    let targetSkills = [];
    let roleTitle = 'Software Engineer';
    let targetCompanies = ['Top Campus Recruiters'];

    if (customJobDescription && customJobDescription.trim().length > 30) {
      roleTitle = 'Custom Job Description Match';
      const commonTechWords = [
        'python', 'java', 'c++', 'javascript', 'typescript', 'react', 'node', 'express',
        'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'docker', 'kubernetes', 'aws',
        'azure', 'gcp', 'git', 'github', 'rest', 'api', 'graphql', 'html', 'css', 'linux',
        'oop', 'oops', 'dbms', 'operating systems', 'algorithms', 'data structures',
        'pandas', 'numpy', 'machine learning', 'ci/cd', 'agile', 'scrum', 'testing'
      ];
      const lowerJD = customJobDescription.toLowerCase();
      targetSkills = commonTechWords.filter(word => lowerJD.includes(word)).map(w => w.toUpperCase());
      if (targetSkills.length < 5) {
        targetSkills = PRESET_ROLES['sde-graduate'].requiredSkills;
      }
    } else {
      const role = PRESET_ROLES[roleId] || PRESET_ROLES['sde-graduate'];
      roleTitle = role.title;
      targetCompanies = role.targetCompanies;
      targetSkills = [...role.requiredSkills, ...(role.bonusSkills || [])];
    }

    // Match keywords
    const matchedKeywords = [];
    const missingKeywords = [];

    targetSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      // Handle variations
      let found = lowerResume.includes(skillLower);
      if (skillLower === 'oops' && (lowerResume.includes('object-oriented') || lowerResume.includes('object oriented'))) found = true;
      if (skillLower === 'sql' && (lowerResume.includes('mysql') || lowerResume.includes('postgres') || lowerResume.includes('database'))) found = true;
      if (skillLower === 'rest apis' && (lowerResume.includes('rest') || lowerResume.includes('api'))) found = true;
      if (skillLower === 'react' && lowerResume.includes('reactjs')) found = true;

      if (found) {
        matchedKeywords.push(skill);
      } else {
        missingKeywords.push(skill);
      }
    });

    // Detect action verbs
    const matchedVerbs = ACTION_VERBS.filter(verb => lowerResume.includes(verb));

    // Section detection
    const sectionsFound = {
      education: /education|degree|bachelor|b\.tech|b\.e|cgpa|gpa/i.test(resumeText),
      skills: /skills|technologies|proficiencies|languages/i.test(resumeText),
      projects: /projects|academic projects|personal projects/i.test(resumeText),
      experienceOrInternship: /experience|internship|training|work/i.test(resumeText),
      certifications: /certifications|certificates|courses|achievements/i.test(resumeText)
    };

    // Metrics & quantifications detection (e.g. "improved by 25%", "1000+ users")
    const hasQuantifiedImpact = /\d+%|\d+\+|\d+ ms|\d+x/i.test(resumeText);

    // Compute ATS Compatibility Score
    let skillScore = (matchedKeywords.length / (targetSkills.length || 1)) * 60;
    let sectionScore = (Object.values(sectionsFound).filter(Boolean).length / 5) * 20;
    let verbScore = Math.min(10, (matchedVerbs.length / 5) * 10);
    let quantScore = hasQuantifiedImpact ? 10 : 0;

    let overallScore = Math.min(100, Math.round(skillScore + sectionScore + verbScore + quantScore));

    // Suggestions
    const suggestions = [];
    if (missingKeywords.length > 0) {
      suggestions.push({
        type: 'critical',
        title: 'Include High-Impact Missing Technical Skills',
        detail: `The job profile looks for ${missingKeywords.slice(0, 5).join(', ')}. Incorporate them in your Skills section or within relevant project descriptions.`
      });
    }

    if (!hasQuantifiedImpact) {
      suggestions.push({
        type: 'impact',
        title: 'Quantify Your Project Accomplishments',
        detail: 'Recruiters favor measurable impact. Add metrics like "Optimized API response time by 35%" or "Managed database with 10,000+ student records".'
      });
    }

    if (matchedVerbs.length < 3) {
      suggestions.push({
        type: 'wording',
        title: 'Strengthen Bullet Points with STAR Action Verbs',
        detail: 'Begin your bullet points with power action verbs such as Engineered, Spearheaded, Automated, or Refactored.'
      });
    }

    if (!sectionsFound.projects) {
      suggestions.push({
        type: 'structure',
        title: 'Add a Dedicated Projects Section',
        detail: 'For campus recruitment, 2 to 3 well-documented GitHub projects with live demo links are strongly recommended.'
      });
    }

    let atsRating = 'Needs Optimization';
    let ratingColor = 'text-rose-600 bg-rose-50 border-rose-200';
    if (overallScore >= 80) {
      atsRating = 'Exceptional Match (Interview Ready)';
      ratingColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (overallScore >= 65) {
      atsRating = 'Good Compatibility (Shortlist Likely)';
      ratingColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
    } else if (overallScore >= 50) {
      atsRating = 'Moderate Match (Refinement Recommended)';
      ratingColor = 'text-amber-700 bg-amber-50 border-amber-200';
    }

    res.json({
      roleTitle,
      targetCompanies,
      overallScore,
      atsRating,
      ratingColor,
      matchedKeywords,
      missingKeywords,
      matchedVerbsCount: matchedVerbs.length,
      hasQuantifiedImpact,
      sectionsFound,
      suggestions
    });
  } catch (err) {
    console.error('[RESUME ANALYZE ERROR]', err);
    res.status(500).json({ error: 'Failed to analyze resume: ' + err.message });
  }
});

module.exports = router;
