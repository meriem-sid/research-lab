export const STATS = {
  totalMembers: 47,
  totalTeams: 6,
  totalPublications: 124,
  totalDepartments: 4,
};

export const DEPARTMENTS = [
  { id: 1, name: "Artificial Intelligence", code: "AI" },
  { id: 2, name: "Computer Vision", code: "CV" },
  { id: 3, name: "Bioinformatics", code: "BIO" },
  { id: 4, name: "Cybersecurity", code: "SEC" },
];

export const ANNOUNCEMENTS = [];

export const NEWS = [
  {
    id: 1,
    headline: "Lab wins Best Paper Award at ICML 2024",
    date: "2024-06-10",
    category: "Award",
    summary: "Our team received recognition for outstanding research in machine learning.",
    image: "https://picsum.photos/seed/news1/600/300",
    author: "Dr. Karim Mansouri",
    fullStory:
      "The Research Lab team presented their groundbreaking work on Arabic language models at ICML 2024. The paper was selected as the best paper in the NLP track. The team plans to release the model weights publicly in Q3 2024.",
  },
  {
    id: 2,
    headline: "New Partnership with MIT AI Lab",
    date: "2024-05-20",
    category: "Announcement",
    summary: "A new collaboration agreement signed to advance AI research.",
    image: "https://picsum.photos/seed/news2/600/300",
    author: "Prof. Amina Boudali",
    fullStory:
      "Research Lab has signed a memorandum of understanding with the MIT Artificial Intelligence Laboratory. This partnership will enable student and faculty exchanges, joint publications, and shared access to computing resources.",
  },
  {
    id: 3,
    headline: "Annual Research Seminar — June 2024",
    date: "2024-04-15",
    category: "Seminar",
    summary: "Join us for our yearly showcase of ongoing research projects.",
    image: "https://picsum.photos/seed/news3/600/300",
    author: "Dr. Youcef Hadj",
    fullStory:
      "The Annual Research Seminar will be held on June 25, 2024 in the main auditorium. All lab members are invited to present their current work. External guests from industry and academia are welcome.",
  },
  {
    id: 4,
    headline: "PhD Student Sara Ferhat Publishes in ACL",
    date: "2024-03-08",
    category: "Publication",
    summary: "Cross-lingual transfer research accepted at top NLP venue.",
    image: "https://picsum.photos/seed/news4/600/300",
    author: "Prof. Amina Boudali",
    fullStory:
      "PhD student Sara Ferhat has had her paper on cross-lingual transfer for low-resource languages accepted at ACL 2024, one of the most prestigious venues in Natural Language Processing.",
  },
  {
    id: 5,
    headline: "Lab Receives National Research Grant",
    date: "2024-02-01",
    category: "Announcement",
    summary: "Funding secured for next phase of medical imaging research.",
    image: "https://picsum.photos/seed/news5/600/300",
    author: "Dr. Lina Zerrouki",
    fullStory:
      "The Computer Vision Lab team has been awarded a national research grant to continue their work on retinal disease detection. The funding will support two new PhD positions.",
  },
  {
    id: 6,
    headline: "Guest Lecture by Prof. LeCun",
    date: "2024-01-20",
    category: "Event",
    summary: "World-renowned AI pioneer visits our lab for a special lecture.",
    image: "https://picsum.photos/seed/news6/600/300",
    author: "Prof. Youcef Hadj",
    fullStory:
      "The lab was honored to host Prof. Yann LeCun for a special guest lecture on the future of self-supervised learning. Over 200 students and faculty attended the event.",
  },
];

export const PUBLICATIONS = [
  {
    id: 1,
    title: "Deep Learning for Medical Image Segmentation",
    authors: ["A. Boudali", "K. Mansouri", "L. Zerrouki"],
    year: 2024,
    publisher: "IEEE Transactions on Medical Imaging",
    type: "Journal Article",
    tags: ["Deep Learning", "Medical"],
    team: "Computer Vision Lab",
    pdfLink: "https://arxiv.org/abs/2401.00001",
    citations: 18,
  },
  {
    id: 2,
    title: "Reinforcement Learning in Autonomous Robotics",
    authors: ["Y. Hadj", "S. Ferhat"],
    year: 2023,
    publisher: "NeurIPS 2023",
    type: "Conference Paper",
    tags: ["Reinforcement Learning", "Robotics"],
    team: "Deep Learning Group",
    pdfLink: "https://arxiv.org/abs/2301.00002",
    citations: 34,
  },
  {
    id: 3,
    title: "Natural Language Processing for Arabic Text Understanding",
    authors: ["L. Zerrouki", "A. Boudali"],
    year: 2023,
    publisher: "ACL 2023",
    type: "Conference Paper",
    tags: ["NLP", "Arabic"],
    team: "Deep Learning Group",
    pdfLink: "https://arxiv.org/abs/2302.00003",
    citations: 27,
  },
  {
    id: 4,
    title: "Graph Neural Networks: A Comprehensive Survey",
    authors: ["K. Mansouri"],
    year: 2024,
    publisher: "ACM Computing Surveys",
    type: "Journal Article",
    tags: ["Graph Networks", "Survey"],
    team: "Deep Learning Group",
    pdfLink: "https://arxiv.org/abs/2401.00004",
    citations: 52,
  },
  {
    id: 5,
    title: "Intrusion Detection Using Machine Learning",
    authors: ["S. Belkadi", "R. Ould"],
    year: 2023,
    publisher: "IEEE Security & Privacy",
    type: "Journal Article",
    tags: ["Security", "ML"],
    team: "Cybersecurity Research Unit",
    pdfLink: "https://arxiv.org/abs/2303.00005",
    citations: 11,
  },
  {
    id: 6,
    title: "Retinal Disease Detection via Deep CNN",
    authors: ["L. Zerrouki", "A. Kaci"],
    year: 2024,
    publisher: "MICCAI 2024",
    type: "Conference Paper",
    tags: ["Medical Imaging", "CNN"],
    team: "Computer Vision Lab",
    pdfLink: "https://arxiv.org/abs/2401.00006",
    citations: 9,
  },
];

export const PROJECTS = [
  {
    id: 1,
    title: "ArabiGPT",
    description: "Arabic large language model development",
    team: "Deep Learning Group",
    assignedTo: "Prof. Amina Boudali",
    createdAt: "2024-01-15",
    tasks: [
      { id: 1, description: "Collect Arabic corpus dataset", submitted: false, file: null },
      { id: 2, description: "Design tokenizer architecture", submitted: false, file: null },
      { id: 3, description: "Run baseline experiments", submitted: false, file: null },
      { id: 4, description: "Write evaluation report", submitted: false, file: null },
    ],
  },
  {
    id: 2,
    title: "MedBERT-DZ",
    description: "Medical NLP for Algerian dialect",
    team: "Deep Learning Group",
    assignedTo: "Prof. Amina Boudali",
    createdAt: "2024-03-10",
    tasks: [
      { id: 1, description: "Literature review on medical NLP", submitted: false, file: null },
      { id: 2, description: "Build DZ dialect medical corpus", submitted: false, file: null },
      { id: 3, description: "Fine-tune BERT variants", submitted: false, file: null },
    ],
  },
  {
    id: 3,
    title: "RetinalScan AI",
    description: "Early detection of retinal diseases using deep learning",
    team: "Computer Vision Lab",
    assignedTo: "Prof. Youcef Hadj",
    createdAt: "2024-02-20",
    tasks: [
      { id: 1, description: "Annotate retinal image dataset", submitted: false, file: null },
      { id: 2, description: "Train CNN segmentation model", submitted: false, file: null },
      { id: 3, description: "Clinical validation testing", submitted: false, file: null },
    ],
  },
  {
    id: 4,
    title: "AlgerShield",
    description: "National-scale intrusion detection framework",
    team: "Cybersecurity Research Unit",
    assignedTo: "Dr. Sofiane Belkadi",
    createdAt: "2024-04-05",
    tasks: [
      { id: 1, description: "Map existing network infrastructure", submitted: false, file: null },
      { id: 2, description: "Design ML detection pipeline", submitted: false, file: null },
    ],
  },
];

export const TEAMS = [
  {
    id: 1,
    teamName: "Deep Learning Group",
    leaderName: "Prof. Amina Boudali",
    department: "Artificial Intelligence",
    departmentCode: "AI",
    researchFocus: "Neural networks, transformers, and large language models",
    memberCount: 8,
    tags: ["Deep Learning", "NLP", "LLM"],
    description:
      "We explore cutting-edge deep learning architectures with applications in language and vision.",
    members: [
      { name: "Dr. Karim Mansouri", role: "Doctor", specialization: "Transformers" },
      { name: "Youcef Hadj", role: "PhD Student", specialization: "LLMs" },
      { name: "Sara Ferhat", role: "PhD Student", specialization: "Text Classification" },
    ],
    activeProjects: [
      { title: "ArabiGPT", status: "Active", description: "Arabic large language model" },
      { title: "MedBERT-DZ", status: "Planning", description: "Medical NLP for Algerian dialect" },
    ],
  },
  {
    id: 2,
    teamName: "Computer Vision Lab",
    leaderName: "Prof. Youcef Hadj",
    department: "Computer Vision",
    departmentCode: "CV",
    researchFocus: "Image segmentation, object detection, and medical imaging",
    memberCount: 6,
    tags: ["Vision", "Medical Imaging", "Detection"],
    description: "Focused on visual perception systems for real-world applications.",
    members: [
      { name: "Lina Zerrouki", role: "Doctor", specialization: "Medical Imaging" },
      { name: "Amine Kaci", role: "PhD Student", specialization: "Object Detection" },
    ],
    activeProjects: [
      { title: "RetinalScan AI", status: "Active", description: "Early detection of retinal diseases" },
      { title: "DroneSight", status: "On Hold", description: "Aerial object detection system" },
    ],
  },
  {
    id: 3,
    teamName: "Cybersecurity Research Unit",
    leaderName: "Dr. Sofiane Belkadi",
    department: "Cybersecurity",
    departmentCode: "SEC",
    researchFocus: "Network intrusion detection and cryptographic protocols",
    memberCount: 5,
    tags: ["Security", "Cryptography", "Networks"],
    description: "Investigating modern threats and defenses in digital infrastructure.",
    members: [
      { name: "Rania Ould", role: "PhD Student", specialization: "Intrusion Detection" },
    ],
    activeProjects: [
      { title: "AlgerShield", status: "Planning", description: "National-scale intrusion detection framework" },
    ],
  },
];

export const MEMBERS = [
  { id: 1, fullName: "Prof. Amina Boudali", role: "Professor", specialization: "Deep Learning", team: "Deep Learning Group", linkedin: "#", googleScholar: "#" },
  { id: 2, fullName: "Prof. Youcef Hadj", role: "Professor", specialization: "Computer Vision", team: "Computer Vision Lab", linkedin: "#", googleScholar: "#" },
  { id: 3, fullName: "Dr. Karim Mansouri", role: "Doctor", specialization: "Transformers & LLMs", team: "Deep Learning Group", linkedin: "#", googleScholar: "#" },
  { id: 4, fullName: "Dr. Sofiane Belkadi", role: "Doctor", specialization: "Network Security", team: "Cybersecurity Research Unit", linkedin: "#", googleScholar: "#" },
  { id: 5, fullName: "Lina Zerrouki", role: "Doctor", specialization: "Medical Image Analysis", team: "Computer Vision Lab", linkedin: "#", googleScholar: "#" },
  {
    id: 6, fullName: "Youcef Hadj Jr.", role: "PhD Student", specialization: "Large Language Models",
    team: "Deep Learning Group", linkedin: "#", googleScholar: "#",
    thesisTitle: "Arabic LLM Fine-tuning Techniques", thesisPhase: "Experimentation",
    thesisProgress: 65, thesisStartDate: "2022-09-01", thesisExpectedEnd: "2025-06-30",
  },
  {
    id: 7, fullName: "Sara Ferhat", role: "PhD Student", specialization: "Text Classification",
    team: "Deep Learning Group", linkedin: "#", googleScholar: "#",
    thesisTitle: "Cross-lingual Transfer for Low-resource Languages", thesisPhase: "Writing",
    thesisProgress: 80, thesisStartDate: "2021-10-01", thesisExpectedEnd: "2024-12-31",
  },
  {
    id: 8, fullName: "Amine Kaci", role: "PhD Student", specialization: "Object Detection",
    team: "Computer Vision Lab", linkedin: "#", googleScholar: "#",
    thesisTitle: "Real-time Aerial Object Detection", thesisPhase: "Literature Review",
    thesisProgress: 25, thesisStartDate: "2023-09-01", thesisExpectedEnd: "2026-06-30",
  },
  {
    id: 9, fullName: "Rania Ould", role: "PhD Student", specialization: "Intrusion Detection Systems",
    team: "Cybersecurity Research Unit", linkedin: "#", googleScholar: "#",
    thesisTitle: "ML-based Network Intrusion Detection", thesisPhase: "Data Collection",
    thesisProgress: 40, thesisStartDate: "2023-01-01", thesisExpectedEnd: "2026-01-01",
  },
];

export const FAKE_USERS = [
  { id: 1, name: "Admin User", email: "admin@lab.dz", password: "admin123", role: "admin" },
  { id: 2, name: "Head of Lab", email: "head@lab.dz", password: "head123", role: "head_of_lab" },
  { id: 3, name: "Prof. Karim Benali", email: "member@lab.dz", password: "member123", role: "member" },
  { id: 4, name: "Prof. Sonia Bouzid", email: "leader@lab.dz", password: "leader123", role: "team_leader" },
];
