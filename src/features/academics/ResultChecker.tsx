import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Eye, EyeOff, FileText, Award, TrendingUp, Calendar, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';
import axios from '../../api/axios';

interface ResultData {
  success: boolean;
  examination_number: string;
  student_name: string;
  matriculation_number: string;
  email: string;
  total_courses: number;
  total_units: number;
  gpa: number;
  results_by_session: Record<string, any[]>;
  all_results: any[];
}

export default function ResultChecker() {
  const [examinationNumber, setExaminationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const handleCheckResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.post('/api/academics/result-checker/check_by_exam_number/', {
        examination_number: examinationNumber.trim(),
        password: password
      });

      if (response.data.success) {
        setResults(response.data);
        setSelectedSession(Object.keys(response.data.results_by_session)[0] || null);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to retrieve results. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const gradeColors: Record<string, string> = {
      'A': 'text-emerald-600 bg-emerald-50',
      'AB': 'text-emerald-600 bg-emerald-50',
      'B': 'text-blue-600 bg-blue-50',
      'BC': 'text-blue-600 bg-blue-50',
      'C': 'text-amber-600 bg-amber-50',
      'CD': 'text-amber-600 bg-amber-50',
      'D': 'text-orange-600 bg-orange-50',
      'F': 'text-red-600 bg-red-50'
    };
    return gradeColors[grade] || 'text-slate-600 bg-slate-50';
  };

  const getGradeDescription = (grade: string) => {
    const descriptions: Record<string, string> = {
      'A': 'Excellent',
      'AB': 'Very Good',
      'B': 'Good',
      'BC': 'Above Average',
      'C': 'Average',
      'CD': 'Below Average',
      'D': 'Poor',
      'F': 'Failed'
    };
    return descriptions[grade] || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Examination Results Checker
            </h1>
          </div>
          <p className="text-slate-600 text-base md:text-lg">
            Securely check your examination results using your examination number
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Search Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200"
          >
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Search className="w-6 h-6 text-indigo-600" />
              Check Your Results
            </h2>

            <form onSubmit={handleCheckResults} className="space-y-6">
              {/* Examination Number */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Examination Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., EXM2024001"
                  value={examinationNumber}
                  onChange={(e) => setExaminationNumber(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Your examination registration number (check your admission letter)
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-semibold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                      <Search className="w-5 h-5" />
                    </motion.div>
                    Checking Results...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Check Results
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-indigo-700 text-xs font-semibold leading-relaxed">
                  <strong>Privacy Notice:</strong> Your results are displayed securely. We do not store your password. All data is encrypted and protected.
                </p>
              </div>
            </form>
          </motion.div>

          {/* Right: Results Display */}
          {results ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Student Info */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-3xl p-8 shadow-lg">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">{results.student_name}</h3>
                      <p className="text-indigo-100 text-sm">{results.matriculation_number}</p>
                    </div>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-300" />
                </div>

                <div className="space-y-3 text-sm">
                  <p><strong>Email:</strong> {results.email}</p>
                  <p><strong>Exam Number:</strong> {results.examination_number}</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Courses', value: results.total_courses, icon: FileText, color: 'blue' },
                  { label: 'Total Units', value: results.total_units, icon: TrendingUp, color: 'emerald' },
                  { label: 'CGPA', value: results.gpa.toFixed(2), icon: Award, color: 'indigo' }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-4 text-center`}
                  >
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600 mx-auto mb-2`} />
                    <p className={`text-2xl font-black text-${stat.color}-600`}>{stat.value}</p>
                    <p className="text-xs font-bold text-slate-600 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center justify-center bg-white rounded-3xl p-8 shadow-lg border border-slate-200 h-auto lg:h-[400px]"
            >
              <Award className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-600 text-center font-semibold">
                Enter your examination number and password to view your results
              </p>
            </motion.div>
          )}
        </div>

        {/* Detailed Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                    Examination Results by Session
                  </h3>

                  {results.results_by_session && Object.keys(results.results_by_session).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(results.results_by_session).map(([session, sessionResults], sessionIdx) => (
                        <motion.div
                          key={session}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: sessionIdx * 0.1 }}
                          className="border border-slate-200 rounded-2xl overflow-hidden"
                        >
                          <button
                            onClick={() => setSelectedSession(selectedSession === session ? null : session)}
                            className="w-full px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 font-bold text-slate-900 flex items-center justify-between transition-all"
                          >
                            <span className="text-lg">{session}</span>
                            <motion.div
                              animate={{ rotate: selectedSession === session ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <FileText className="w-5 h-5 text-indigo-600" />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {selectedSession === session && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-slate-50"
                              >
                                <div className="p-6 space-y-3">
                                  {(sessionResults as any[]).map((result, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      onClick={() => setExpandedCourse(expandedCourse === `${session}-${idx}` ? null : `${session}-${idx}`)}
                                      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-bold text-slate-900">{result.course_code}: {result.course_title}</p>
                                          <p className="text-xs text-slate-500 mt-1">Units: {result.course?.unit || 3}</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg font-black text-lg ${getGradeColor(result.grade)}`}>
                                          {result.grade}
                                        </div>
                                      </div>

                                      <AnimatePresence>
                                        {expandedCourse === `${session}-${idx}` && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 pt-4 border-t border-slate-200 space-y-2"
                                          >
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <p className="text-xs text-slate-600 font-bold uppercase">Score</p>
                                                <p className="text-xl font-black text-slate-900">{result.score}/100</p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-slate-600 font-bold uppercase">Grade Description</p>
                                                <p className="text-sm font-bold text-slate-700">{getGradeDescription(result.grade)}</p>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 font-semibold">No results available</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
