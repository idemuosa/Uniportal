import { useState, useEffect } from 'react';
import { UserProfile, Result } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { FileText, CheckCircle, Clock, TrendingUp, Award, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface ResultsProps {
  user: UserProfile;
}

export default function Results({ user }: ResultsProps) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'results'), where('studentId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const calculateGPA = (res: Result[]) => {
    if (res.length === 0) return 0;
    // Assuming each course has units (we'd need to fetch course data or store it in result)
    // For demo, we'll use a simple average of GP
    const totalGP = res.reduce((acc, r) => acc + (r.gp || 0), 0);
    return (totalGP / res.length).toFixed(2);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Academic Results</h2>
          <p className="text-neutral-500">View your performance across all semesters.</p>
        </div>
        <div className="p-6 bg-neutral-900 text-white rounded-3xl flex items-center gap-6 shadow-xl">
          <div className="p-3 bg-neutral-800 rounded-2xl"><TrendingUp className="w-8 h-8 text-emerald-400" /></div>
          <div>
            <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Current CGPA</p>
            <p className="text-3xl font-bold">{calculateGPA(results)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Semester Breakdown
            </h3>
            <div className="space-y-4">
              {results.length === 0 && <p className="text-neutral-400 text-sm italic">No results published yet.</p>}
              {results.map(result => (
                <div key={result.id} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl border border-neutral-200 font-bold text-neutral-900">{result.grade}</div>
                    <div>
                      <p className="font-bold">{result.courseId}</p>
                      <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">{result.semester} - {result.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{result.score}</p>
                    <p className="text-xs text-neutral-400">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Performance Summary
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-neutral-500">Courses Passed</span>
                <span className="font-bold">{results.filter(r => r.score >= 40).length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-neutral-500">Courses Failed</span>
                <span className="font-bold text-rose-500">{results.filter(r => r.score < 40).length}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-neutral-500">Total Credits</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
