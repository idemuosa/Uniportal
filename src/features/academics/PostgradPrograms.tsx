import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, BookOpen, Target, Zap, ChevronRight, Filter, Search } from 'lucide-react';
import axios from '../../api/axios';

interface Program {
  id: number;
  name: string;
  code: string;
  duration_years: number;
  description: string;
  department_name: string;
  faculty_name: string;
}

interface PostgradProgram {
  id: number;
  postgrad_details: Program;
  related_undergrad_programs: Program[];
  entry_requirement: string;
  thesis_required: boolean;
  research_component_percent: number;
  internship_required: boolean;
}

export default function PostgradPrograms() {
  const [programs, setPrograms] = useState<PostgradProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<PostgradProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchPostgradPrograms();
    fetchDepartments();
  }, []);

  const fetchPostgradPrograms = async () => {
    try {
      const response = await axios.get('/api/portal/postgrad-programs/');
      setPrograms(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching postgrad programs:', error);
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/portal/postgrad-programs/');
      const depts = [...new Set((response.data.results || response.data).map((p: PostgradProgram) => p.postgrad_details?.department_name))];
      setDepartments(depts.filter(Boolean));
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filteredPrograms = programs.filter(prog => {
    const matchesSearch = prog.postgrad_details?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prog.postgrad_details?.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === '' || prog.postgrad_details?.department_name === filterDept;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <GraduationCap className="w-12 h-12 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500 text-white rounded-xl">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Postgraduate Programs</h1>
              <p className="text-slate-600 text-sm mt-1">Advance your academic career with specialized master's degrees</p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <AnimatePresence mode="wait">
            {filteredPrograms.map((program, idx) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedProgram(program)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl p-6 h-full shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-all">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      {program.postgrad_details?.duration_years} Years
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                    {program.postgrad_details?.name}
                  </h3>
                  <p className="text-purple-600 font-bold text-sm mb-4">{program.postgrad_details?.code}</p>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {program.postgrad_details?.description || 'Advanced degree program combining coursework and research'}
                  </p>

                  <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      {program.postgrad_details?.department_name}
                    </div>
                    {program.thesis_required && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                        Thesis Required
                      </div>
                    )}
                  </div>

                  <button className="w-full flex items-center justify-between px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold rounded-lg transition-colors text-sm">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Detailed View Modal */}
        <AnimatePresence>
          {selectedProgram && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProgram(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end"
            >
              <motion.div
                initial={{ y: 400 }}
                animate={{ y: 0 }}
                exit={{ y: 400 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl bg-white rounded-t-3xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-black mb-2">{selectedProgram.postgrad_details?.name}</h2>
                      <p className="text-purple-100">{selectedProgram.postgrad_details?.code} • {selectedProgram.postgrad_details?.department_name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedProgram(null)}
                      className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {/* Program Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { icon: Target, label: 'Duration', value: `${selectedProgram.postgrad_details?.duration_years} Years` },
                      { icon: Zap, label: 'Research', value: `${selectedProgram.research_component_percent}%` },
                      { icon: BookOpen, label: 'Thesis', value: selectedProgram.thesis_required ? 'Required' : 'Optional' },
                      { icon: GraduationCap, label: 'Internship', value: selectedProgram.internship_required ? 'Required' : 'Optional' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                        <item.icon className="w-6 h-6 text-purple-600 mb-2" />
                        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-lg font-black text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Entry Requirements */}
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Entry Requirements
                    </h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                      <p className="text-slate-700 leading-relaxed">{selectedProgram.entry_requirement}</p>
                    </div>
                  </div>

                  {/* Related Undergraduate Programs */}
                  {selectedProgram.related_undergrad_programs && selectedProgram.related_undergrad_programs.length > 0 && (
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        Recommended Undergraduate Background
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProgram.related_undergrad_programs.map((prog) => (
                          <div key={prog.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <p className="font-bold text-slate-900">{prog.name}</p>
                            <p className="text-sm text-slate-600 mt-1">{prog.code}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex gap-4 pt-4 border-t border-slate-200">
                    <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors">
                      Apply Now
                    </button>
                    <button
                      onClick={() => setSelectedProgram(null)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {filteredPrograms.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">No Programs Found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
