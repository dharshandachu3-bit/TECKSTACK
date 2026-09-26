import { AIProvider, AIAnalysisOutput } from '../providers/AIProvider.js';
import { LLMProvider } from '../providers/LLMProvider.js';
import { MockAIProvider } from '../providers/MockAIProvider.js';
import { ApplicationName } from '../../shared/types.js';

export class AIUnderstandingService {
  private static providerInstance: AIProvider | null = null;

  public static getProvider(forceMock = false): AIProvider {
    if (forceMock) {
      return new MockAIProvider();
    }

    if (this.providerInstance) {
      return this.providerInstance;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('MY_GEMINI_API_KEY')) {
      try {
        this.providerInstance = new LLMProvider(apiKey);
        console.log('[WorkFlowOS AI] Initialized real LLMProvider with Gemini 2.5 Flash');
        return this.providerInstance;
      } catch (err) {
        console.warn('[WorkFlowOS AI] Failed to initialize LLMProvider, falling back to MockAIProvider:', err);
      }
    }

    console.log('[WorkFlowOS AI] Using MockAIProvider fallback');
    this.providerInstance = new MockAIProvider();
    return this.providerInstance;
  }

  public static async analyzeSequence(
    sequence: Array<{ app: ApplicationName; action: string; eventType: string; target: string }>,
    candidateContext?: { name?: string; intent?: string },
    forceMock = false
  ): Promise<AIAnalysisOutput> {
    const provider = this.getProvider(forceMock);
    const output = await provider.analyzeWorkflowSequence(sequence, candidateContext);

    // Schema and boundary validation
    if (!output.workflowName || output.workflowName.trim().length === 0) {
      output.workflowName = candidateContext?.name || 'Automated Workflow';
    }
    if (!output.intent || output.intent.trim().length === 0) {
      output.intent = 'Automated business process sequence';
    }
    if (!output.suggestedSteps || output.suggestedSteps.length === 0) {
      throw new Error('AI analysis produced invalid empty step list');
    }

    return output;
  }
}
