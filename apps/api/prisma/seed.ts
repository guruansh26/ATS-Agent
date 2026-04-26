import { PrismaClient } from "@prisma/client";
import { computeMatch } from "@ats/shared";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Seeding ATS AI Agent database...");

  await prisma.screening.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.auditLog.deleteMany({});

  const seniorBackend = await prisma.job.create({
    data: {
      title: "Senior Backend Engineer",
      company: "Joveo",
      location: "Bangalore",
      experienceMin: 5,
      experienceMax: 9,
      skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "AWS", "Fastify"],
      requirements: [
        "5+ years building production backend services",
        "Strong TypeScript and Node.js fundamentals",
        "Experience with PostgreSQL and Redis"
      ],
      responsibilities: [
        "Own backend services from design to production",
        "Build async pipelines and APIs at scale",
        "Mentor mid-level engineers"
      ],
      rawText:
        "Senior Backend Engineer at Joveo. 5-9 years of experience. We use TypeScript, Node.js, PostgreSQL, Redis, AWS. Bangalore."
    }
  });

  const mlEngineer = await prisma.job.create({
    data: {
      title: "Machine Learning Engineer",
      company: "Joveo",
      location: "Remote",
      experienceMin: 3,
      experienceMax: 7,
      skills: ["Python", "PyTorch", "LLM", "AWS", "Docker"],
      requirements: [
        "3+ years building ML systems",
        "Experience with PyTorch or TensorFlow",
        "Comfortable shipping LLM-powered features"
      ],
      responsibilities: [
        "Build candidate-job matching models",
        "Operate LLM-powered screening pipelines",
        "Run online and offline experiments"
      ],
      rawText:
        "ML Engineer. 3-7 years. Python, PyTorch, LLM, AWS, Docker. Remote."
    }
  });

  const candidates = await Promise.all([
    prisma.candidate.create({
      data: {
        name: "Asha Verma",
        email: "asha@example.com",
        phone: "+91 90000 11111",
        location: "Bangalore",
        experienceYears: 6,
        skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "AWS", "Fastify", "Docker"],
        education: ["BTech Computer Science"],
        workHistory: [
          "Senior Backend Engineer at Globex (2021-Present)",
          "Backend Engineer at Initech (2018-2021)"
        ],
        rawText: "Asha Verma. 6 years. TypeScript, Node.js, PostgreSQL, Redis, AWS, Fastify."
      }
    }),
    prisma.candidate.create({
      data: {
        name: "Rohit Kumar",
        email: "rohit@example.com",
        location: "Pune",
        experienceYears: 4,
        skills: ["JavaScript", "Node.js", "MongoDB", "Express"],
        education: ["BTech Information Technology"],
        workHistory: ["Backend Engineer at Acme (2020-Present)"],
        rawText: "Rohit Kumar. 4 years. JavaScript, Node, Mongo, Express."
      }
    }),
    prisma.candidate.create({
      data: {
        name: "Maya Iyer",
        email: "maya@example.com",
        location: "Tokyo",
        experienceYears: 1,
        skills: ["HTML", "CSS", "JavaScript"],
        education: ["Diploma in Web Design"],
        workHistory: ["Junior Web Developer at Pixel Studio (2024-Present)"],
        rawText: "Maya Iyer. 1 year. HTML/CSS/JS only."
      }
    }),
    prisma.candidate.create({
      data: {
        name: "Daniel Cho",
        email: "daniel@example.com",
        location: "Remote",
        experienceYears: 5,
        skills: ["Python", "PyTorch", "LLM", "AWS", "Docker", "LangChain"],
        education: ["MSc Machine Learning"],
        workHistory: [
          "ML Engineer at NeuralCo (2022-Present)",
          "Data Scientist at DataWorks (2020-2022)"
        ],
        rawText: "Daniel Cho. 5 years. Python, PyTorch, LLM, AWS, Docker."
      }
    }),
    prisma.candidate.create({
      data: {
        name: "Priya Nair",
        email: "priya@example.com",
        location: "Bangalore",
        experienceYears: 8,
        skills: ["Java", "Spring", "AWS", "Kubernetes", "Kafka"],
        education: ["BTech Computer Science", "MBA"],
        workHistory: [
          "Staff Engineer at FinHub (2020-Present)",
          "Senior Engineer at PayFast (2017-2020)"
        ],
        rawText: "Priya Nair. 8 years. Java/Spring/AWS/K8s/Kafka."
      }
    })
  ]);

  const seedScreenings: Array<{ jobId: string; candidateId: string }> = [
    { jobId: seniorBackend.id, candidateId: candidates[0]!.id },
    { jobId: seniorBackend.id, candidateId: candidates[1]!.id },
    { jobId: seniorBackend.id, candidateId: candidates[2]!.id },
    { jobId: mlEngineer.id, candidateId: candidates[3]!.id },
    { jobId: mlEngineer.id, candidateId: candidates[4]!.id }
  ];

  for (const { jobId, candidateId } of seedScreenings) {
    const job = jobId === seniorBackend.id ? seniorBackend : mlEngineer;
    const candidate = candidates.find((c) => c.id === candidateId)!;
    const breakdown = computeMatch(
      {
        title: job.title,
        location: job.location,
        experienceMin: job.experienceMin,
        experienceMax: job.experienceMax,
        skills: job.skills,
        requirements: job.requirements
      },
      {
        name: candidate.name,
        location: candidate.location,
        experienceYears: candidate.experienceYears,
        skills: candidate.skills,
        education: candidate.education,
        workHistory: candidate.workHistory
      }
    );

    await prisma.screening.create({
      data: {
        jobId,
        candidateId,
        status: "completed",
        startedAt: new Date(),
        completedAt: new Date(),
        overallScore: breakdown.overallScore,
        skillMatchScore: breakdown.skillMatchScore,
        experienceMatchScore: breakdown.experienceMatchScore,
        locationMatchScore: breakdown.locationMatchScore,
        educationMatchScore: breakdown.educationMatchScore,
        matchedSkills: breakdown.matchedSkills,
        missingSkills: breakdown.missingSkills,
        strengths: breakdown.strengths,
        risks: breakdown.risks,
        recruiterSummary: breakdown.recruiterSummary,
        recommendation: breakdown.recommendation
      }
    });
  }

  console.log(
    `Seeded: 2 jobs, ${candidates.length} candidates, ${seedScreenings.length} screenings.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
