export type Course = {
  slug: string;
  title: string;
  description: string;
  level: string;
  lessons: number;
  duration: string;
  access: 'Free' | 'Paid' | 'Coming Soon';
  price?: string;
  subject: string;
};

export type Resource = {
  slug: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  pages: string;
  fileType: string;
  access: 'Free' | 'Paid' | 'Coming Soon';
  price?: string;
};

export const courses: Course[] = [
  {
    slug: 'laplace-transform',
    title: 'Complete Laplace Transform',
    description: 'จากนิยาม ตารางแปลง และ Partial Fractions สู่การแก้สมการเชิงอนุพันธ์และวงจรไฟฟ้า',
    level: 'Foundation → Intermediate',
    lessons: 24,
    duration: '12 hours',
    access: 'Coming Soon',
    subject: 'Laplace Transform',
  },
  {
    slug: 'engineering-mathematics-1',
    title: 'Engineering Mathematics 1',
    description: 'Limits, derivatives, integrals และการประยุกต์สำหรับนักศึกษาวิศวกรรม',
    level: 'Foundation',
    lessons: 32,
    duration: '16 hours',
    access: 'Coming Soon',
    subject: 'Calculus',
  },
  {
    slug: 'linear-algebra-for-engineers',
    title: 'Linear Algebra for Engineers',
    description: 'Matrices, systems of equations, eigenvalues และการประยุกต์ทางวิศวกรรม',
    level: 'Foundation → Intermediate',
    lessons: 20,
    duration: '10 hours',
    access: 'Coming Soon',
    subject: 'Linear Algebra',
  },
  {
    slug: 'control-systems-fundamentals',
    title: 'Control Systems Fundamentals',
    description: 'แบบจำลอง ฟังก์ชันถ่ายโอน การตอบสนอง เสถียรภาพ และแนวคิดป้อนกลับ',
    level: 'Intermediate',
    lessons: 28,
    duration: '14 hours',
    access: 'Coming Soon',
    subject: 'Control Systems',
  },
];

export const resources: Resource[] = [
  {
    slug: 'laplace-transform-workbook',
    title: 'Laplace Transform Workbook',
    description: 'ชุดโจทย์มาตรฐานพร้อมแนวคิดและพื้นที่ฝึกทำ เหมาะสำหรับเรียนด้วยตนเองและใช้ประกอบการสอน',
    subject: 'Laplace Transform',
    level: 'University',
    pages: '80+ pages',
    fileType: 'PDF',
    access: 'Coming Soon',
  },
  {
    slug: 'calculus-formula-sheet',
    title: 'Calculus Formula Sheet',
    description: 'สรุปสูตรอนุพันธ์ ปริพันธ์ และเทคนิคสำคัญในรูปแบบอ่านง่าย',
    subject: 'Calculus',
    level: 'University',
    pages: '12 pages',
    fileType: 'PDF',
    access: 'Coming Soon',
  },
  {
    slug: 'linear-algebra-workbook',
    title: 'Linear Algebra Workbook',
    description: 'โจทย์เมทริกซ์ ระบบสมการ ดีเทอร์มิแนนต์ และ eigenvalues สำหรับนักศึกษาวิศวกรรม',
    subject: 'Linear Algebra',
    level: 'University',
    pages: '70+ pages',
    fileType: 'PDF',
    access: 'Coming Soon',
  },
];
