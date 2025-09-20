import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIEvaluation {
  costScore: number;
  deliveryScore: number;
  complianceScore: number;
  overallScore: number;
  insights: {
    costAnalysis: string;
    deliveryPrediction: string;
    complianceNotes: string;
    riskFactors: string[];
    recommendation: string;
  };
  confidence: number;
  evaluatedAt: Date;
  modelVersion: string;
}

export interface ProposalComparisonResult {
  rankedProposals: Array<{
    proposalId: string;
    vendorName: string;
    overallScore: number;
    rank: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  recommendation: {
    topChoice: string;
    reasoning: string;
    alternatives: string[];
  };
  summary: string;
}

export interface VendorInsights {
  performanceScore: number;
  deliveryReliability: number;
  costCompetitiveness: number;
  riskLevel: 'low' | 'medium' | 'high';
  predictions: {
    expectedDeliveryAccuracy: number;
    priceCompetitiveness: string;
  };
  recommendations: string[];
}

export interface MarketAnalysis {
  complexityScore: number;
  suggestedCriteria: Array<{
    criterion: string;
    suggestedWeight: number;
    reasoning: string;
  }>;
  marketInsights: {
    expectedPriceRange: { min: number; max: number };
    expectedDeliveryTime: string;
    riskFactors: string[];
  };
}

export interface ExecutiveSummary {
  totalProposals: number;
  topRecommendation: {
    vendorName: string;
    score: number;
    reasoning: string;
  };
  keyInsights: string[];
  riskAnalysis: string[];
  executiveSummary: string;
  nextSteps: string[];
}

class GeminiAIService {
  public genAI: GoogleGenerativeAI;
  public model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not foud');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async evaluateProposal(proposal: any, marketRequest: any, vendorHistory?: any): Promise<AIEvaluation> {
    try {
      const prompt = this.buildEvaluationPrompt(proposal, marketRequest, vendorHistory);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseEvaluationResponse(text);
    } catch (error) {
      console.error('Error evaluating proposal with Gemini:', error);
      throw new Error('AI evaluation failed');
    }
  }

  async compareProposals(proposals: any[], marketRequest: any): Promise<ProposalComparisonResult> {
    try {
      const prompt = this.buildComparisonPrompt(proposals, marketRequest);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseComparisonResponse(text, proposals);
    } catch (error) {
      console.error('Error comparing proposals with Gemini:', error);
      throw new Error('AI comparison failed');
    }
  }

  async analyzeVendor(vendor: any, proposalHistory: any[]): Promise<VendorInsights> {
    try {
      const prompt = this.buildVendorAnalysisPrompt(vendor, proposalHistory);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseVendorInsights(text);
    } catch (error) {
      console.error('Error analyzing vendor with Gemini:', error);
      throw new Error('Vendor analysis failed');
    }
  }

  async analyzeMarketRequest(marketRequest: any): Promise<MarketAnalysis> {
    try {
      const prompt = this.buildMarketAnalysisPrompt(marketRequest);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseMarketAnalysis(text);
    } catch (error) {
      console.error('Error analyzing market request with Gemini:', error);
      throw new Error('Market analysis failed');
    }
  }

  async generateExecutiveSummary(proposals: any[], marketRequest: any): Promise<ExecutiveSummary> {
    try {
      const prompt = this.buildExecutiveSummaryPrompt(proposals, marketRequest);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseExecutiveSummary(text, proposals);
    } catch (error) {
      console.error('Error generating executive summary with Gemini:', error);
      throw new Error('Executive summary generation failed');
    }
  }

  private buildEvaluationPrompt(proposal: any, marketRequest: any, vendorHistory?: any): string {
    return `
You are a procurement AI analyst. Evaluate this vendor proposal and provide scores from 0-100 for cost, delivery, and compliance.

MARKET REQUEST:
Title: ${marketRequest.title}
Description: ${marketRequest.description}
Category: ${marketRequest.category}
Max Budget: ${marketRequest.maxBudget} ${marketRequest.currency}
Quantity: ${marketRequest.quantity}
Deadline: ${marketRequest.deadline}
Requirements: ${JSON.stringify(marketRequest.requirements || [])}
Evaluation Criteria: ${JSON.stringify(marketRequest.evaluationCriteria || [])}

PROPOSAL:
Vendor: ${proposal.vendor?.firstName} ${proposal.vendor?.lastName}
Proposed Item: ${proposal.proposedItem}
Description: ${proposal.description}
Quantity: ${proposal.quantity}
Unit Price: ${proposal.unitPrice} ${proposal.currency}
Total Price: ${proposal.totalPrice} ${proposal.currency}
Delivery Time: ${proposal.deliveryTime}
Delivery Date: ${proposal.deliveryDate}
Warranty: ${proposal.warranty}
Additional Services: ${proposal.additionalServices?.join(', ') || 'None'}
Vendor Notes: ${proposal.vendorNotes || 'None'}

VENDOR HISTORY (if available):
${vendorHistory ? JSON.stringify(vendorHistory) : 'No historical data available'}

Analyze and provide a JSON response with this exact structure:
{
  "costScore": number (0-100),
  "deliveryScore": number (0-100),
  "complianceScore": number (0-100),
  "overallScore": number (weighted average),
  "insights": {
    "costAnalysis": "detailed cost analysis",
    "deliveryPrediction": "delivery timeline assessment",
    "complianceNotes": "compliance evaluation",
    "riskFactors": ["risk1", "risk2"],
    "recommendation": "overall recommendation"
  },
  "confidence": number (0-100)
}

Focus on:
1. Cost competitiveness vs budget and market rates
2. Delivery feasibility and vendor reliability
3. Compliance with requirements and standards
4. Overall value proposition
`;
  }

  private buildComparisonPrompt(proposals: any[], marketRequest: any): string {
    const proposalSummaries = proposals.map((p, index) => `
PROPOSAL ${index + 1}:
Vendor: ${p.vendor?.firstName} ${p.vendor?.lastName}
Item: ${p.proposedItem}
Price: ${p.totalPrice} ${p.currency}
Delivery: ${p.deliveryTime}
Warranty: ${p.warranty}
Score: ${p.aiEvaluation?.overallScore || 'Not evaluated'}
`).join('\n');

    return `
You are a procurement AI analyst. Compare these proposals for the market request and rank them.

MARKET REQUEST:
Title: ${marketRequest.title}
Description: ${marketRequest.description}
Max Budget: ${marketRequest.maxBudget} ${marketRequest.currency}
Evaluation Criteria: ${JSON.stringify(marketRequest.evaluationCriteria || [])}

PROPOSALS TO COMPARE:
${proposalSummaries}

Provide a JSON response with this structure:
{
  "rankedProposals": [
    {
      "proposalId": "string",
      "vendorName": "string",
      "overallScore": number,
      "rank": number,
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"]
    }
  ],
  "recommendation": {
    "topChoice": "vendor name",
    "reasoning": "detailed reasoning",
    "alternatives": ["alternative1", "alternative2"]
  },
  "summary": "executive summary of the comparison"
}

Rank from best to worst based on value, compliance, and delivery reliability.
`;
  }

  private buildVendorAnalysisPrompt(vendor: any, proposalHistory: any[]): string {
    return `
Analyze this vendor's performance and predict future reliability.

VENDOR PROFILE:
Name: ${vendor.firstName} ${vendor.lastName}
Email: ${vendor.email}
Specialization: ${vendor.specialization?.join(', ') || 'Not specified'}
Location: ${vendor.location}
Description: ${vendor.description || 'No description'}

PROPOSAL HISTORY:
${proposalHistory.map(p => `
- ${p.proposedItem}: ${p.totalPrice} ${p.currency}, Delivery: ${p.deliveryTime}, Status: ${p.status}
`).join('')}

Provide JSON response:
{
  "performanceScore": number (0-100),
  "deliveryReliability": number (0-100),
  "costCompetitiveness": number (0-100),
  "riskLevel": "low|medium|high",
  "predictions": {
    "expectedDeliveryAccuracy": number (0-100),
    "priceCompetitiveness": "competitive|average|expensive"
  },
  "recommendations": ["rec1", "rec2"]
}
`;
  }

  private buildMarketAnalysisPrompt(marketRequest: any): string {
    return `
Analyze this market request and provide strategic insights.

MARKET REQUEST:
Title: ${marketRequest.title}
Description: ${marketRequest.description}
Category: ${marketRequest.category}
Quantity: ${marketRequest.quantity}
Max Budget: ${marketRequest.maxBudget} ${marketRequest.currency}
Specifications: ${JSON.stringify(marketRequest.specifications || {})}

Provide JSON response:
{
  "complexityScore": number (0-100),
  "suggestedCriteria": [
    {
      "criterion": "string",
      "suggestedWeight": number,
      "reasoning": "string"
    }
  ],
  "marketInsights": {
    "expectedPriceRange": {"min": number, "max": number},
    "expectedDeliveryTime": "string",
    "riskFactors": ["risk1", "risk2"]
  }
}
`;
  }

  private buildExecutiveSummaryPrompt(proposals: any[], marketRequest: any): string {
    const proposalSummaries = proposals.map(p => `
- ${p.vendor?.firstName} ${p.vendor?.lastName}: ${p.proposedItem} for ${p.totalPrice} ${p.currency}
  AI Score: ${p.aiEvaluation?.overallScore || 'Not evaluated'}
`).join('');

    return `
Create an executive summary for this procurement decision.

MARKET REQUEST: ${marketRequest.title}
Budget: ${marketRequest.maxBudget} ${marketRequest.currency}

PROPOSALS RECEIVED:
${proposalSummaries}

Provide JSON response:
{
  "totalProposals": number,
  "topRecommendation": {
    "vendorName": "string",
    "score": number,
    "reasoning": "string"
  },
  "keyInsights": ["insight1", "insight2"],
  "riskAnalysis": ["risk1", "risk2"],
  "executiveSummary": "concise summary for executives",
  "nextSteps": ["step1", "step2"]
}
`;
  }

  private parseEvaluationResponse(text: string): AIEvaluation {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        costScore: parsed.costScore || 0,
        deliveryScore: parsed.deliveryScore || 0,
        complianceScore: parsed.complianceScore || 0,
        overallScore: parsed.overallScore || 0,
        insights: {
          costAnalysis: parsed.insights?.costAnalysis || 'No analysis available',
          deliveryPrediction: parsed.insights?.deliveryPrediction || 'No prediction available',
          complianceNotes: parsed.insights?.complianceNotes || 'No compliance notes',
          riskFactors: parsed.insights?.riskFactors || [],
          recommendation: parsed.insights?.recommendation || 'No recommendation available'
        },
        confidence: parsed.confidence || 0,
        evaluatedAt: new Date(),
        modelVersion: 'gemini-pro-v1'
      };
    } catch (error) {
      console.error('Error parsing AI evaluation response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private parseComparisonResponse(text: string, proposals: any[]): ProposalComparisonResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        rankedProposals: parsed.rankedProposals?.map((p: any, index: number) => ({
          proposalId: proposals[index]?._id || p.proposalId,
          vendorName: p.vendorName || 'Unknown',
          overallScore: p.overallScore || 0,
          rank: p.rank || index + 1,
          strengths: p.strengths || [],
          weaknesses: p.weaknesses || []
        })) || [],
        recommendation: {
          topChoice: parsed.recommendation?.topChoice || 'No recommendation',
          reasoning: parsed.recommendation?.reasoning || 'No reasoning provided',
          alternatives: parsed.recommendation?.alternatives || []
        },
        summary: parsed.summary || 'No summary available'
      };
    } catch (error) {
      console.error('Error parsing comparison response:', error);
      throw new Error('Failed to parse comparison response');
    }
  }

  private parseVendorInsights(text: string): VendorInsights {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        performanceScore: parsed.performanceScore || 0,
        deliveryReliability: parsed.deliveryReliability || 0,
        costCompetitiveness: parsed.costCompetitiveness || 0,
        riskLevel: parsed.riskLevel || 'medium',
        predictions: {
          expectedDeliveryAccuracy: parsed.predictions?.expectedDeliveryAccuracy || 0,
          priceCompetitiveness: parsed.predictions?.priceCompetitiveness || 'average'
        },
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error('Error parsing vendor insights:', error);
      throw new Error('Failed to parse vendor insights');
    }
  }

  private parseMarketAnalysis(text: string): MarketAnalysis {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        complexityScore: parsed.complexityScore || 0,
        suggestedCriteria: parsed.suggestedCriteria || [],
        marketInsights: {
          expectedPriceRange: parsed.marketInsights?.expectedPriceRange || { min: 0, max: 0 },
          expectedDeliveryTime: parsed.marketInsights?.expectedDeliveryTime || 'Unknown',
          riskFactors: parsed.marketInsights?.riskFactors || []
        }
      };
    } catch (error) {
      console.error('Error parsing market analysis:', error);
      throw new Error('Failed to parse market analysis');
    }
  }

  private parseExecutiveSummary(text: string, proposals: any[]): ExecutiveSummary {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        totalProposals: parsed.totalProposals || proposals.length,
        topRecommendation: {
          vendorName: parsed.topRecommendation?.vendorName || 'Unknown',
          score: parsed.topRecommendation?.score || 0,
          reasoning: parsed.topRecommendation?.reasoning || 'No reasoning provided'
        },
        keyInsights: parsed.keyInsights || [],
        riskAnalysis: parsed.riskAnalysis || [],
        executiveSummary: parsed.executiveSummary || 'No summary available',
        nextSteps: parsed.nextSteps || []
      };
    } catch (error) {
      console.error('Error parsing executive summary:', error);
      throw new Error('Failed to parse executive summary');
    }
  }
}

export const geminiAI = new GeminiAIService();