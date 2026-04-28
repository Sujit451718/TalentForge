export const categoryImages = {
  "System Design": [
    "photo-1451187580459-43490279c0fa",
    "photo-1558494949-ef010cbdcc48",
    "photo-1518770660439-4636190af475",
    "photo-1460925895917-afdab827c52f",
    "photo-1504384308090-c894fdcc538d"
  ],
  "Soft Skills": [
    "photo-1573497161161-c3e73707e25c",
    "photo-1521791136064-7986c2923216",
    "photo-1531482615713-2afd69097998",
    "photo-1552664730-d307ca884978",
    "photo-1517245386807-bb43f82c33c4"
  ],
  "Frontend": [
    "photo-1633356122544-f134324a6cee",
    "photo-1507238691740-187a5b1d37b8",
    "photo-1517694712202-14dd9538aa97",
    "photo-1587620962725-abab7fe55159",
    "photo-1550439062-609e1531270e"
  ],
  "AI & Future": [
    "photo-1677442136019-21780ecad995",
    "photo-1620712943543-bcc4688e7485",
    "photo-1485827404703-89b55fcc595e",
    "photo-1531297484001-80022131f5a1",
    "photo-1507146426996-ef05306b995a"
  ],
  "Backend": [
    "photo-1555066931-4365d14bab8c",
    "photo-1550751827-4bd374c3f58b",
    "photo-1562813733-b31f71025d54",
    "photo-1558494949-ef010cbdcc48",
    "photo-1451187580459-43490279c0fa"
  ]
};

export const templates = [
  {
    title: "Mastering System Design: The Architect's Handbook",
    excerpt: "Deep dive into scalability, load balancing, and distributed databases from a Lead Architect's perspective.",
    author: "Alex Rivers",
    role: "Staff Engineer @ Google",
    category: "System Design",
    content: "System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements. Systems design could be seen as the application of systems theory to product development. There is some overlap with the disciplines of systems analysis, systems architecture and systems engineering.\n\nIn technical interviews, system design questions are used to evaluate a candidate's ability to solve complex problems and design large-scale systems. These questions are typically open-ended and require the candidate to consider various factors such as scalability, reliability, and performance."
  },
  {
    title: "Behavioral Interviews: Why Your Story Matters",
    excerpt: "Learn how to use the STAR method to turn simple experiences into compelling narratives that impress hiring managers.",
    author: "Sarah Jenkins",
    role: "Technical Recruiter @ Meta",
    category: "Soft Skills",
    content: "The STAR method is a structured manner of responding to a behavioral-based interview question by discussing the specific situation, task, action, and result of the situation you are describing.\n\nSituation: Describe the situation that you were in or the task that you needed to accomplish. You must describe a specific event or situation, not a generalized description of what you have done in the past. Be sure to give enough detail for the interviewer to understand. This situation can be from a previous job, from a volunteer experience, or any relevant event."
  },
  {
    title: "React 19: What's New for Technical Interviews",
    excerpt: "The latest features you need to know about to stand out in your next frontend interview.",
    author: "Michael Chen",
    role: "Frontend Lead @ Vercel",
    category: "Frontend",
    content: "React 19 brings significant changes to the ecosystem, focusing on performance and developer experience. The introduction of the React Compiler (React Forget) is a game-changer, automatically memoizing components and hooks to reduce unnecessary re-renders.\n\nAnother key feature is Server Components, which are now fully integrated and provide a seamless way to build hybrid applications with both server-side and client-side rendering. Understanding these concepts is crucial for any modern frontend interview."
  },
  {
    title: "The Future of AI in Technical Hiring",
    excerpt: "How AI is changing the landscape of technical assessments and what it means for candidates.",
    author: "Dr. Elena Vance",
    role: "AI Researcher @ OpenAI",
    category: "AI & Future",
    content: "Artificial Intelligence is rapidly transforming how companies identify and evaluate technical talent. From automated code reviews to AI-driven behavioral analysis, the recruitment process is becoming more data-driven and efficient.\n\nCandidates need to adapt by focusing on skills that AI cannot easily replicate, such as high-level architectural thinking, complex problem-solving, and emotional intelligence. This article explores the current trends and provides actionable advice for staying relevant."
  },
  {
    title: "Go Concurrency Patterns in Practice",
    excerpt: "Mastering goroutines and channels to build high-performance backend systems.",
    author: "Rob Pike-ish",
    role: "Senior Backend Developer",
    category: "Backend",
    content: "Go's concurrency model is based on CSP (Communicating Sequential Processes) and is one of its most powerful features. Goroutines are lightweight threads managed by the Go runtime, while channels provide a safe way for them to communicate.\n\nIn this deep dive, we explore common patterns such as worker pools, fan-in/fan-out, and the select statement. Mastering these patterns allows you to build systems that can handle thousands of concurrent operations with minimal overhead."
  }
];

export const getBlogPosts = () => {
  return Array.from({ length: 250 }, (_, i) => {
    const template = templates[i % templates.length];
    const images = categoryImages[template.category];
    const imageId = images ? images[Math.floor(i / templates.length) % images.length] : null;
    
    if (!imageId) return null;

    return {
      ...template,
      id: i + 1,
      title: template.title,
      date: `April ${Math.max(1, 26 - Math.floor(i / 10))}, 2026`,
      image: `https://images.unsplash.com/${imageId}?auto=format&fit=crop&q=80&w=1200`
    };
  }).filter(post => post !== null && post.image);
};
