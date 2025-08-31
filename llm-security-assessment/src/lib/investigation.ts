import { SecurityItem, Evidence, AssessmentItem } from './types';

interface TavilySearchResult {
  url: string;
  title: string;
  content: string;
  score: number;
}

interface GPTAssessment {
  judgement: '○' | '×' | '要改善' | null;
  comment: string;
  evidences: Evidence[];
}

export class InvestigationService {
  private static TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  private static OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  static async searchTavily(query: string): Promise<TavilySearchResult[]> {
    if (!this.TAVILY_API_KEY) {
      console.warn('Tavily API key not configured - using mock data');
      // モックデータを返す
      return [
        {
          url: 'https://example.com/mock1',
          title: `Mock result for ${query}`,
          content: 'This is mock content for testing purposes. The model shows strong security features.',
          score: 0.95
        },
        {
          url: 'https://example.com/mock2',
          title: `Security analysis for ${query}`,
          content: 'The model implements various security measures including data encryption and access controls.',
          score: 0.90
        }
      ];
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.TAVILY_API_KEY,
          query: query,
          max_results: 100,
          search_depth: 'advanced',
          include_domains: [],
          exclude_domains: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Tavily search error:', error);
      return [];
    }
  }

  static async analyzeWithGPT(
    item: SecurityItem,
    searchResults: TavilySearchResult[],
    modelName: string
  ): Promise<GPTAssessment> {
    if (!this.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured - using mock assessment');
      // モックアセスメントを返す
      const mockJudgements: Array<'○' | '×' | '要改善'> = ['○', '×', '要改善'];
      const randomJudgement = mockJudgements[Math.floor(Math.random() * mockJudgements.length)];
      
      return {
        judgement: randomJudgement,
        comment: `Mock assessment for ${item.name}`,
        evidences: searchResults.slice(0, 2).map(r => ({
          url: r.url,
          title: r.title,
          snippet: r.content.substring(0, 200),
          confidence: 0.8 + Math.random() * 0.2
        })),
      };
    }

    const prompt = `
      You are evaluating the LLM model "${modelName}" against the following security criteria:
      
      Category: ${item.category}
      Name: ${item.name}
      Criteria: ${item.criteria}
      Standards: ${item.standards}
      
      Based on the following search results, assess whether the model meets this criteria.
      
      Search Results:
      ${searchResults.map(r => `- ${r.title}: ${r.content.substring(0, 500)}`).join('\n')}
      
      Provide your assessment in JSON format:
      {
        "judgement": "○" | "×" | "要改善" | null,
        "comment": "Brief assessment comment (max 100 characters)",
        "evidences": [
          {
            "url": "source url",
            "title": "source title",
            "snippet": "relevant excerpt",
            "confidence": 0.0-1.0
          }
        ]
      }
      
      Use "○" for meets criteria, "×" for does not meet, "要改善" for needs improvement, null for insufficient information.
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a security assessment expert. Provide assessments in JSON format only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('GPT analysis error:', error);
      return {
        judgement: null,
        comment: 'Analysis failed',
        evidences: [],
      };
    }
  }

  static async investigateModel(
    modelName: string,
    vendor: string,
    securityItems: SecurityItem[]
  ): Promise<Partial<AssessmentItem>[]> {
    console.log(`Investigating ${modelName} (${vendor}) - ${securityItems.length} items`);
    const assessmentItems: Partial<AssessmentItem>[] = [];

    for (let i = 0; i < securityItems.length; i++) {
      const item = securityItems[i];
      console.log(`Processing item ${i+1}/${securityItems.length}: ${item.name}`);
      
      const query = `${modelName} ${vendor} ${item.name} ${item.criteria}`;
      console.log(`Searching with query: ${query.substring(0, 100)}...`);
      
      const searchResults = await this.searchTavily(query);
      console.log(`Tavily returned ${searchResults.length} results`);
      
      const uniqueResults = this.deduplicateResults(searchResults);
      const topResults = uniqueResults.slice(0, 10);
      console.log(`Using ${topResults.length} unique results for GPT analysis`);
      
      const assessment = await this.analyzeWithGPT(item, topResults, modelName);
      console.log(`GPT analysis completed for ${item.name}: ${assessment.judgement}`);
      
      assessmentItems.push({
        itemId: item.id,
        judgement: assessment.judgement,
        comment: assessment.comment,
        evidences: assessment.evidences,
        filledBy: 'AI',
        updatedAt: new Date().toISOString(),
      });
    }

    return assessmentItems;
  }

  private static deduplicateResults(results: TavilySearchResult[]): TavilySearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      const key = `${result.url}${result.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}