import { useState, useEffect } from 'react';
import { UserProfile, Course, Registration } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { INITIAL_COURSES } from '../constants';
import { toast } from 'sonner';
import { BookOpen, CheckCircle, Clock, Plus, Trash2, Save } from 'lucide-react';
import { motion } from 'motion/react';

interface CourseRegistrationProps {
  user: UserProfile;
}

export default function CourseRegistration({ user }: CourseRegistrationProps) {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      // In a real app, we'd fetch from Firestore. For demo, we'll use INITIAL_COURSES
      const filtered = INITIAL_COURSES.filter(c => c.faculty === user.faculty && c.level === user.level);
      setAvailableCourses(filtered as Course[]);
    };

    const q = query(collection(db, 'registrations'), where('studentId', '==', user.uid), where('level', '==', user.level));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setRegistration({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Registration);
      }
      setLoading(false);
    });

    fetchCourses();
    return () => unsubscribe();
  }, [user.uid, user.faculty, user.level]);

  const toggleCourse = (course: Course) => {
    if (selectedCourses.find(c => c.courseCode === course.courseCode)) {
      setSelectedCourses(selectedCourses.filter(c => c.courseCode !== course.courseCode));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'registrations'), {
        studentId: user.uid,
        semester: 'First Semester',
        level: user.level,
        courses: selectedCourses.map(c => c.courseCode),
        isApproved: false,
        createdAt: new Date().toISOString(),
      });
      toast.success('Course registration submitted for approval!');
    } catch (error) {
      toast.error('Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div></div>;

  if (registration) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Registered Courses
            </h2>
            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${registration.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {registration.isApproved ? 'Approved' : 'Pending Approval'}
            </span>
          </div>
          <div className="space-y-4">
            {registration.courses.map(code => (
              <div key={code} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex justify-between items-center">
                <span className="font-bold">{code}</span>
                <span className="text-neutral-500 text-sm">Registered</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Course Registration</h2>
          <p className="text-neutral-500">{user.faculty} - {user.level}</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || selectedCourses.length === 0}
          className="bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {submitting ? 'Submitting...' : 'Submit Registration'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Available Courses</h3>
          <div className="space-y-3">
            {availableCourses.map(course => (
              <button
                key={course.courseCode}
                onClick={() => toggleCourse(course)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${selectedCourses.find(c => c.courseCode === course.courseCode) ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100 hover:border-neutral-300'}`}
              >
                <div>
                  <p className="font-bold">{course.courseCode}</p>
                  <p className="text-sm text-neutral-500">{course.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400">{course.units} Units</span>
                  {selectedCourses.find(c => c.courseCode === course.courseCode) ? <CheckCircle className="w-5 h-5 text-neutral-900" /> : <Plus className="w-5 h-5 text-neutral-300" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200 h-fit sticky top-24">
          <h3 className="text-xl font-bold mb-6">Selected Summary</h3>
          <div className="space-y-4">
            {selectedCourses.map(course => (
              <div key={course.courseCode} className="flex justify-between items-center py-2 border-b border-neutral-200">
                <span className="text-sm font-medium">{course.courseCode}</span>
                <span className="text-xs text-neutral-500">{course.units} Units</span>
              </div>
            ))}
            {selectedCourses.length === 0 && <p className="text-neutral-400 text-sm italic">No courses selected yet.</p>}
            <div className="pt-4 flex justify-between items-center font-bold text-lg">
              <span>Total Units</span>
              <span>{selectedCourses.reduce((acc, c) => acc + c.units, 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
