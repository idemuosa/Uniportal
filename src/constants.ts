export const FACULTIES = [
  "College of Medicine",
  "Faculty of Agric",
  "Pharmacy",
  "Physical Science",
  "Life Science",
  "Education",
  "Engineering",
  "Veterinary Medicine",
 
];

export const DEPARTMENTS: Record<string, string[]> = {
  "College of Medicine": ["Medicine & Surgery", "Nursing", "Anatomy", "Physiology", "Physiotherapy", "Medical Laboratory Science", "Radiology", "Medical Biochemistry"],
  "Faculty of Agric": ["Animal Science", "Crop Science", "Agric Economics"],
  "Pharmacy": ["Pharmacology", "Pharmaceutical Chemistry"],
  "Physical Science": ["Computer Science", "Physics", "Chemistry", "Mathematics"],
  "Life Science": ["Biology", "Microbiology", "Biochemistry"],
  "Education": ["Science Education", "Arts Education"],
  "Engineering": ["Mechanical Engineering", "Civil Engineering", "Electrical Engineering"],
  "Veterinary Medicine": ["Vet Anatomy", "Vet Medicine"]
};

export const LEVELS = ["100L", "200L", "300L", "400L", "500L", "600L", "700L"];

export const INITIAL_COURSES = [
  { courseCode: "MED101", title: "Intro to Medicine", units: 3, faculty: "College of Medicine", department: "Medicine & Surgery", level: "100L" },
  { courseCode: "MED201", title: "Human Anatomy I", units: 4, faculty: "College of Medicine", department: "Anatomy", level: "200L" },
  { courseCode: "AGR101", title: "Intro to Agriculture", units: 2, faculty: "Faculty of Agric", department: "Animal Science", level: "100L" },
  { courseCode: "AGR301", title: "Crop Production", units: 3, faculty: "Faculty of Agric", department: "Crop Science", level: "300L" },
  { courseCode: "PHA101", title: "Intro to Pharmacy", units: 2, faculty: "Pharmacy", department: "Pharmacology", level: "100L" },
  { courseCode: "PHA401", title: "Clinical Pharmacy", units: 4, faculty: "Pharmacy", department: "Pharmacology", level: "400L" },
  { courseCode: "CSC101", title: "Intro to Computer Science", units: 3, faculty: "Physical Science", department: "Computer Science", level: "100L" },
  { courseCode: "CSC201", title: "Data Structures", units: 3, faculty: "Physical Science", department: "Computer Science", level: "200L" },
  { courseCode: "PHY101", title: "General Physics I", units: 3, faculty: "Physical Science", department: "Physics", level: "100L" },
  { courseCode: "BIO101", title: "General Biology I", units: 3, faculty: "Life Science", department: "Biology", level: "100L" },
  { courseCode: "MCB201", title: "General Microbiology", units: 3, faculty: "Life Science", department: "Microbiology", level: "200L" },
  { courseCode: "EDU101", title: "History of Education", units: 2, faculty: "Education", department: "Arts Education", level: "100L" },
  { courseCode: "EDU301", title: "Curriculum Studies", units: 3, faculty: "Education", department: "Science Education", level: "300L" },
  { courseCode: "ENG101", title: "Intro to Engineering", units: 2, faculty: "Engineering", department: "Mechanical Engineering", level: "100L" },
  { courseCode: "ENG201", title: "Engineering Math I", units: 3, faculty: "Engineering", department: "Electrical Engineering", level: "200L" },
  { courseCode: "ENG401", title: "Control Systems", units: 3, faculty: "Engineering", department: "Electrical Engineering", level: "400L" },
  { courseCode: "VET101", title: "Intro to Vet Medicine", units: 2, faculty: "Veterinary Medicine", department: "Vet Medicine", level: "100L" },
  { courseCode: "VET501", title: "Vet Surgery", units: 4, faculty: "Veterinary Medicine", department: "Vet Medicine", level: "500L" },
  { courseCode: "CHM101", title: "General Chemistry I", units: 3, faculty: "Physical Science", department: "Chemistry", level: "100L" },
  { courseCode: "MTH101", title: "General Mathematics I", units: 3, faculty: "Physical Science", department: "Mathematics", level: "100L" }
];

export const SCHOOL_FEES = {
  "100L": 150000,
  "200L": 120000,
  "300L": 120000,
  "400L": 120000,
  "500L": 140000,
  "600L": 160000,
  "700L": 180000
};

export const HOSTEL_FEE = 50000;
