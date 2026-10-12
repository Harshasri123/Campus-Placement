import React, { useState } from 'react';

const CATEGORY_MAP = {
  'Aptitude': 'Quantitative Aptitude',
  'Verbal': 'Verbal (English)',
  'Reasoning': 'Reasoning & Logic',
  'Programming': 'Programming & Tech',
  'Interview': 'Interview Preparation',
  'PlacementPaper': 'Company Placement Papers'
};

export default function AdminPortal({ adminEmail, onBackToDashboard }) {
  const [formData, setFormData] = useState({
    category: 'Aptitude',
    subCategory: 'Arithmetic',
    topicTag: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: '0',
    explanation: '',
    isDailyQuestion: false
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setSubmitting(true);

    const payload = {
      category: formData.category,
      subCategory: formData.subCategory.trim(),
      topicTag: formData.topicTag.trim(),
      questionText: formData.questionText.trim(),
      options: [formData.optionA, formData.optionB, formData.optionC, formData.optionD],
      correctOption: parseInt(formData.correctOption, 10),
      explanation: formData.explanation.trim(),
      isDailyQuestion: formData.isDailyQuestion
    };

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': adminEmail || 'teacher@school.com'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to insert question');

      setStatus({
        type: 'success',
        message: `Question added to ${CATEGORY_MAP[formData.category]} > ${formData.subCategory} successfully!`
      });

      // Reset text inputs
      setFormData({
        ...formData,
        topicTag: '',
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        explanation: '',
        isDailyQuestion: false
      });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 text-xs font-black uppercase px-2.5 py-1 rounded-md">
              Faculty / Admin Access
            </span>
            <span className="text-xs text-slate-500 font-semibold">{adminEmail || 'teacher@school.com'}</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Campus Placement Question Authoring</h2>
          <p className="text-sm text-slate-500">
            Publish questions directly into the multi-tier taxonomy and daily practice challenges.
          </p>
        </div>
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      {status.message && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{status.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Track Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Practice Track (Category)
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="Aptitude">Quantitative Aptitude (Arithmetic, DI)</option>
              <option value="Verbal">Verbal (English Ability &amp; Reading)</option>
              <option value="Reasoning">Reasoning (Logical, Verbal, Non-Verbal)</option>
              <option value="Programming">Programming &amp; Tech (Python, Java, C++)</option>
              <option value="Interview">Interview Preparation (HR, Technical, GD)</option>
              <option value="PlacementPaper">Company Placement Mock Papers</option>
            </select>
          </div>

          {/* Sub-Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Sub-Category
            </label>
            <input
              type="text"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              placeholder="e.g. Arithmetic, Python Programming, Logical"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topic Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Specific Topic Tag
            </label>
            <input
              type="text"
              name="topicTag"
              value={formData.topicTag}
              onChange={handleChange}
              placeholder="e.g. Time &amp; Work, Syllogisms, OOPs"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Daily Challenge Flag */}
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isDailyQuestion"
                checked={formData.isDailyQuestion}
                onChange={handleChange}
                className="w-5 h-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span className="text-sm font-bold text-slate-800">
                ⚡ Feature in Daily Placement Challenge
              </span>
            </label>
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Question Statement
          </label>
          <textarea
            name="questionText"
            rows="3"
            value={formData.questionText}
            onChange={handleChange}
            placeholder="Enter the full question text here..."
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
          ></textarea>
        </div>

        {/* Options Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Options &amp; Correct Answer
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D'].map((letter, idx) => (
              <div key={letter} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <input
                  type="radio"
                  name="correctOption"
                  value={idx}
                  checked={formData.correctOption === String(idx)}
                  onChange={handleChange}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="font-bold text-xs text-slate-600 w-5">({letter})</span>
                <input
                  type="text"
                  name={`option${letter}`}
                  value={formData[`option${letter}`]}
                  onChange={handleChange}
                  placeholder={`Option ${letter}`}
                  required
                  className="w-full bg-transparent text-sm border-0 focus:outline-none text-slate-900 font-medium"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Select the radio button beside the option that represents the correct choice.
          </p>
        </div>

        {/* In-depth Explanation */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            In-Depth Explanation &amp; Solution Steps
          </label>
          <textarea
            name="explanation"
            rows="3"
            value={formData.explanation}
            onChange={handleChange}
            placeholder="Explain why this option is correct, including shortcuts or mathematical proofs..."
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-4 rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Publishing to Database...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Publish Question to Syllabus Track</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
