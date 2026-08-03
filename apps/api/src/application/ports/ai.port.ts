// منافذ الذكاء الاصطناعي — واجهات جاهزة فقط، لا تنفيذ في الـMVP
export interface GradeSuggestion { value: number; rationale: string; }
export abstract class AiGradingPort {
  abstract suggestGrade(submissionText: string, rubric?: string): Promise<GradeSuggestion>;
}
export abstract class AiFeedbackPort {
  abstract generateFeedback(submissionText: string): Promise<string>;
}
export abstract class AiAssistantPort {
  abstract ask(prompt: string, context?: string): Promise<string>;
}
export abstract class AiSummaryPort {
  abstract summarize(text: string): Promise<string>;
}
