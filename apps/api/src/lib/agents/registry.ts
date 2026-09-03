import type { AgentDefinition } from "./agent-definition";

const countWords = (value: string): number => value.trim().split(/\s+/).filter(Boolean).length;

export const agentRegistry: Record<string, AgentDefinition> = {
  "resume-analyzer": {
    slug: "resume-analyzer",
    name: "Resume Analyzer",
    systemPrompt:
      "You are a senior career coach and ATS (Applicant Tracking System) expert. " +
      "Analyze the resume text for clarity, measurable impact, and ATS keyword coverage. " +
      "Be specific and actionable.",
    tools: [
      {
        name: "count_words",
        description: "Count words in the resume text.",
        run: args => `word_count=${countWords(String(args.text ?? ""))}`,
      },
    ],
    demoRun: (input: Record<string, unknown>) => ({
      summary: "Resume scored for clarity, impact, and ATS readiness.",
      score: 84,
      strengths: ["Clear role history", "Solid metrics", "Relevant keywords"],
      improvements: ["Add quantified outcomes", "Shorten summary", "Tailor for target role"],
      fileName: String((input.resumeFile as { name?: string } | undefined)?.name ?? ""),
    }),
  },
};

export function getAgentDefinition(slug: string): AgentDefinition | undefined {
  return agentRegistry[slug];
}
