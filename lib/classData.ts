export type Student = {
  id: number;
  no: string;
  chiName: string;
  otherName: string;
  engName: string;
  regNo: string;
  house: string;
  gender: "Boy" | "Girl";
  role: string;
  academic: number;
  motivation: number;
  service: number;
  roleModel: number;
  overall: number;
  remark: string;
};

export type ScoreField = "academic" | "motivation" | "service" | "roleModel";

export type Announcement = {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  date: string;
};

export const students: Student[] = [
  {
    id: 1,
    no: "1",
    chiName: "陳小明",
    otherName: "小明",
    engName: "Ming Chan",
    regNo: "S-101",
    house: "Red",
    gender: "Boy",
    role: "Class Monitor",
    academic: 68,
    motivation: 42,
    service: 17,
    roleModel: 12,
    overall: 139,
    remark: "Excellent in presentations and active during group work.",
  },
  {
    id: 2,
    no: "2",
    chiName: "李雯雯",
    otherName: "雯雯",
    engName: "Winnie Lee",
    regNo: "S-102",
    house: "Blue",
    gender: "Girl",
    role: "Assistant Monitor",
    academic: 73,
    motivation: 51,
    service: 20,
    roleModel: 14,
    overall: 158,
    remark: "Consistent homework completion and helpful to classmates.",
  },
  {
    id: 3,
    no: "3",
    chiName: "張家豪",
    otherName: "家豪",
    engName: "Jiahao Cheung",
    regNo: "S-103",
    house: "Green",
    gender: "Boy",
    role: "Sports Captain",
    academic: 56,
    motivation: 38,
    service: 19,
    roleModel: 13,
    overall: 126,
    remark: "Shows leadership in team activities and encourages peers.",
  },
  {
    id: 4,
    no: "4",
    chiName: "黃欣怡",
    otherName: "欣怡",
    engName: "Annie Wong",
    regNo: "S-104",
    house: "Yellow",
    gender: "Girl",
    role: "Library Helper",
    academic: 81,
    motivation: 59,
    service: 18,
    roleModel: 16,
    overall: 174,
    remark: "Very focused and helpful, especially during service rounds.",
  },
  {
    id: 5,
    no: "5",
    chiName: "劉俊傑",
    otherName: "俊傑",
    engName: "Junjie Lau",
    regNo: "S-105",
    house: "Red",
    gender: "Boy",
    role: "IT Helper",
    academic: 62,
    motivation: 47,
    service: 16,
    roleModel: 11,
    overall: 136,
    remark: "Improving confidence in academic speaking and tasks.",
  },
  {
    id: 6,
    no: "6",
    chiName: "周芷晴",
    otherName: "芷晴",
    engName: "Zhiqing Zhou",
    regNo: "S-106",
    house: "Blue",
    gender: "Girl",
    role: "Wellbeing Leader",
    academic: 77,
    motivation: 54,
    service: 21,
    roleModel: 17,
    overall: 169,
    remark: "Sets a good example with warm and collaborative behavior.",
  },
  {
    id: 7,
    no: "7",
    chiName: "蔡嘉倫",
    otherName: "嘉倫",
    engName: "Ka Lun Choi",
    regNo: "S-107",
    house: "Green",
    gender: "Boy",
    role: "Peer Mentor",
    academic: 70,
    motivation: 50,
    service: 15,
    roleModel: 13,
    overall: 148,
    remark: "Helpful in buddy reading and classroom routines.",
  },
  {
    id: 8,
    no: "8",
    chiName: "林家欣",
    otherName: "家欣",
    engName: "Ka Yan Lam",
    regNo: "S-108",
    house: "Yellow",
    gender: "Girl",
    role: "Flag Team",
    academic: 66,
    motivation: 44,
    service: 18,
    roleModel: 15,
    overall: 143,
    remark: "Strong teamwork spirit and friendly attitude.",
  },
  {
    id: 9,
    no: "9",
    chiName: "謝偉然",
    otherName: "偉然",
    engName: "Wai Yin Tse",
    regNo: "S-109",
    house: "Red",
    gender: "Boy",
    role: "Class Helper",
    academic: 58,
    motivation: 39,
    service: 17,
    roleModel: 12,
    overall: 126,
    remark: "Moves from passive to active participation in class tasks.",
  },
  {
    id: 10,
    no: "10",
    chiName: "余雅婷",
    otherName: "雅婷",
    engName: "Yating Yu",
    regNo: "S-110",
    house: "Blue",
    gender: "Girl",
    role: "Public Speaking Lead",
    academic: 85,
    motivation: 61,
    service: 19,
    roleModel: 18,
    overall: 183,
    remark: "Outstanding confidence, leadership, and academic effort.",
  },
  {
    id: 11,
    no: "11",
    chiName: "王梓樂",
    otherName: "梓樂",
    engName: "Tsz Lok Wong",
    regNo: "S-111",
    house: "Green",
    gender: "Boy",
    role: "Science Assistant",
    academic: 72,
    motivation: 48,
    service: 16,
    roleModel: 14,
    overall: 150,
    remark: "Engaged in experiments and supports team tasks well.",
  },
  {
    id: 12,
    no: "12",
    chiName: "梁嘉琪",
    otherName: "嘉琪",
    engName: "Kiki Leung",
    regNo: "S-112",
    house: "Yellow",
    gender: "Girl",
    role: "Reading Ambassador",
    academic: 79,
    motivation: 57,
    service: 22,
    roleModel: 16,
    overall: 174,
    remark: "Very positive influence on reading culture and classroom tone.",
  },
];

export const announcements: Announcement[] = [
  {
    id: 1,
    title: "Weekly assembly reminder",
    body: "Please bring your reflection journal to Wednesday assembly. We will share class goals and celebrate student contributions.",
    pinned: true,
    date: "2026-09-02",
  },
  {
    id: 2,
    title: "Academic challenge",
    body: "This week, every student who completes one quiz or assignment will earn 2 class-building points. Keep going!",
    pinned: false,
    date: "2026-09-01",
  },
  {
    id: 3,
    title: "Service leader sign-up",
    body: "Students who help with setup or classroom tasks can log service points with the teacher after lunch.",
    pinned: false,
    date: "2026-08-31",
  },
];

export const scoreRules = {
  academic: [
    "Pass quiz or complete a full-mark assignment: +2 points",
    "Exam paper 70+ marks: +10 points",
    "Exam paper 60-69 marks: +5 points",
  ],
  motivation: [
    "Academic presentation: +5 points",
    "Academic post sharing: +2 points",
  ],
  service: [
    "One teacher help task: +1 point",
    "Helping peers with teacher observation: +1 point",
  ],
  roleModel: [
    "CWCC values behavior: cheerful, warm, collaborative, confident: +1 each",
  ],
};

export const defaultDrawState = {
  mode: "repeat" as "repeat" | "nonrepeat",
  queue: students.map((student) => student.id),
  history: [] as Array<{ id: number; studentName: string; mode: "repeat" | "nonrepeat"; drawAt: string }>,
};
