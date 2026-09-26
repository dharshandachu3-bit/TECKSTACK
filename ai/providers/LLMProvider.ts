import { GoogleGenAI, Type } from '@google/genai';
import { AIProvider, AIAnalysisOutput } from './AIProvider.js';
import { ApplicationName } from '../../shared/types.js';

export class LLMProvider implements AIProvider {
  private client: GoogleGenAI;
  private modelName = 'gemini-2.5-flash';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.client = new GoogleGenAI({ apiKey: key });
  }

  async analyzeWorkflowSequence(
    sequence: Array<{ app: ApplicationName; action: string; eventType: string; target: string }>,
    candidateContext?: { name?: string; intent?: string }
  ): Promise<AIAnalysisOutput> {
    const prompt = `You are WorkFlowOS AI Core, an expert in business process automation and digital workflow discovery.
Analyze this sequence of observed human digital actions across business applications and synthesize a production-ready, executable workflow specification.

Observed Action Sequence:
${JSON.stringify(sequence, null, 2)}

Context Hints:
${candidateContext ? JSON.stringify(candidateContext) : 'None'}

Your goal:
1. Provide a professional, concise workflow name and executive intent description.
2. Extract all core domain entities (e.g., Customer, Attachment, CRM Record, Channel).
3. Identify the best potential trigger (e.g. Email received, Webhook event, File downloaded).
4. Specify appropriate safety conditions (e.g., Customer must exist in CRM).
5. Generate an ordered sequence of executable steps with proper application names, action types, parameters, and execution methods (API, APPLICATION, BROWSER_AUTOMATION).
6. Calculate confidence score (0.0 to 1.0) and estimated minutes saved per execution.`;

    const response = await this.client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workflowName: { type: Type.STRING },
            intent: { type: Type.STRING },
            entities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            potentialTrigger: {
              type: Type.OBJECT,
              properties: {
                application: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                config: { type: Type.OBJECT },
              },
              required: ['application', 'type', 'description'],
            },
            suggestedConditions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  field: { type: Type.STRING },
                  operator: { type: Type.STRING },
                  value: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['field', 'operator', 'value'],
              },
            },
            suggestedSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  application: { type: Type.STRING },
                  actionType: { type: Type.STRING },
                  parameters: { type: Type.OBJECT },
                  executionMethod: { type: Type.STRING },
                  requiresApprovalPrompt: { type: Type.STRING },
                },
                required: ['name', 'type', 'application', 'actionType', 'executionMethod'],
              },
            },
            confidence: { type: Type.NUMBER },
            estimatedTimeSavedMinutes: { type: Type.NUMBER },
          },
          required: [
            'workflowName',
            'intent',
            'entities',
            'potentialTrigger',
            'suggestedSteps',
            'confidence',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      workflowName: parsed.workflowName || 'Automated Process',
      intent: parsed.intent || 'Automated workflow execution',
      entities: parsed.entities || ['Customer', 'Record'],
      potentialTrigger: {
        application: (parsed.potentialTrigger?.application as ApplicationName) || 'Gmail',
        type: parsed.potentialTrigger?.type || 'EVENT_TRIGGER',
        description: parsed.potentialTrigger?.description || 'Automated process trigger',
        config: parsed.potentialTrigger?.config || {},
      },
      suggestedConditions: (parsed.suggestedConditions || []).map((c: any) => ({
        field: c.field,
        operator: c.operator || 'EQUALS',
        value: c.value,
        explanation: c.explanation || '',
      })),
      suggestedSteps: (parsed.suggestedSteps || []).map((s: any) => ({
        name: s.name,
        type: s.type || 'ACTION',
        application: (s.application as ApplicationName) || 'System',
        actionType: s.actionType || 'EXECUTE',
        parameters: s.parameters || {},
        executionMethod: s.executionMethod || 'API',
        requiresApprovalPrompt: s.requiresApprovalPrompt,
      })),
      confidence: parsed.confidence || 0.92,
      modelUsed: this.modelName,
      estimatedTimeSavedMinutes: parsed.estimatedTimeSavedMinutes || 6,
    };
  }
}
