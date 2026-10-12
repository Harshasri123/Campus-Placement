import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function QuizScreen({ questions, durationMinutes = 10, onSubmitQuiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIndex]: optionIndex }
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // { [questionIndex]: boolean }
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const maxWarnings = 3;

  // Prevent multiple submissions
  const submittedRef = useRef(false);

  const handleFinalSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    onSubmitQuiz({
      answers: selectedAnswers,
      timeTakenSeconds: durationMinutes * 60 - timeLeft,
      tabSwitchViolations: warnings
    });
  }, [selectedAnswers, durationMinutes, timeLeft, warnings, onSubmitQuiz]);

  // 1. Anti-Cheat: Tab Switch & Window Blur Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submittedRef.current) {
        setWarnings((prev) => {
          const next = prev + 1;
          if (next >= maxWarnings) {
            alert('Cheating violation limit reached. Your quiz is being submitted automatically.');
            handleFinalSubmit();
          } else {
            setShowWarningModal(true);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleFinalSubmit]);

  // 2. Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleFinalSubmit]);

  // Request Fullscreen
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
  };

  const currentQ = questions[currentIndex] || { topic_tag: 'Topic', question_text: '', options: [] };

  const handleSelectOption = (optIdx) => {
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: optIdx });
  };

  const toggleFlag = () => {
    setFlaggedQuestions({ ...flaggedQuestions, [currentIndex]: !flaggedQuestions[currentIndex] });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6 font-sans">
      {/* Tab Switch Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold text-red-600 mb-2">Warning: Tab Switch Detected</h3>
            <p className="text-gray-600 text-sm mb-4">
              Switching tabs, windows, or opening other applications is forbidden.
            </p>
            <div className="p-2 bg-red-50 text-red-700 font-semibold rounded mb-4">
              Strike {warnings} of {maxWarnings}
            </div>
            <button
              onClick={() => {
                setShowWarningModal(false);
                enterFullscreen();
              }}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
            >
              I Understand, Return to Test
            </button>
          </div>
        </div>
      )}

      {/* Main Question Panel */}
      <div className="flex-1 bg-white p-6 rounded-lg shadow border border-gray-100">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {currentQ.topic_tag}
            </span>
            <h2 className="text-lg font-semibold mt-2">
              Question {currentIndex + 1} of {questions.length}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={enterFullscreen}
              className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-xl font-bold transition text-slate-700 border border-slate-200"
            >
              ⛶ Fullscreen
            </button>
            <div className={`text-base font-mono font-black px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
              timeLeft < 120
                ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                : timeLeft < 300
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}>
              <span>⏱️</span>
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Question Text */}
        <p className="text-gray-800 text-lg mb-6 leading-relaxed">{currentQ.question_text}</p>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {(currentQ.options || []).map((option, idx) => {
            const isSelected = selectedAnswers[currentIndex] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-lg border text-sm transition flex items-center gap-3 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 font-medium text-blue-900 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                  isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-500'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            onClick={toggleFlag}
            className={`px-4 py-2 rounded text-sm font-medium border ${
              flaggedQuestions[currentIndex]
                ? 'bg-amber-100 border-amber-400 text-amber-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {flaggedQuestions[currentIndex] ? '★ Flagged for Review' : '☆ Mark for Review'}
          </button>

          <div className="flex gap-2">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 rounded text-sm border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2 rounded text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature 2: Question Palette & Navigation Grid */}
      <div className="w-full md:w-72 bg-white p-5 rounded-lg shadow border border-gray-100 h-fit">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Question Palette</h3>
        
        {/* Status Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4 pb-3 border-b">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block"></span> Answered
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block"></span> Flagged
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-300 inline-block"></span> Not Answered
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded ring-2 ring-blue-600 inline-block"></span> Current
          </div>
        </div>

        {/* Number Matrix */}
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isFlagged = flaggedQuestions[idx];
            const isCurrent = currentIndex === idx;

            let btnStyle = 'bg-gray-100 text-gray-700 border-gray-200';
            if (isAnswered) btnStyle = 'bg-emerald-500 text-white font-semibold';
            if (isFlagged) btnStyle = 'bg-amber-400 text-gray-900 font-semibold';

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-10 rounded text-xs transition border flex items-center justify-center relative ${btnStyle} ${
                  isCurrent ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleFinalSubmit}
          className="w-full mt-6 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 py-2 rounded text-sm font-semibold transition"
        >
          Finish & Submit
        </button>
      </div>
    </div>
  );
}
