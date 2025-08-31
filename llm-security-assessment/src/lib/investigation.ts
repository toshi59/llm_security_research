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
          max_results: 500,
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
    // 検索結果が空の場合の処理
    if (!searchResults || searchResults.length === 0) {
      console.warn(`No search results for ${item.name} - returning insufficient information assessment`);
      return {
        judgement: null,
        comment: `No search results available to assess ${item.name}`,
        evidences: [],
      };
    }

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

    // 検索結果を整形してプロンプトに含める
    const formattedResults = searchResults.map((r, index) => 
      `[Source ${index + 1}]\nTitle: ${r.title}\nURL: ${r.url}\nContent: ${r.content.substring(0, 800)}\nScore: ${r.score}\n`
    ).join('\n');

    console.log(`Formatted ${searchResults.length} results for GPT analysis of ${item.name}`);

    const prompt = `You are evaluating the LLM model "${modelName}" against the following security criteria:
      
Category: ${item.category}
Name: ${item.name}
Criteria: ${item.criteria}
Standards: ${item.standards}
Risk: ${item.risk || 'Not specified'}

Based on the following search results, assess whether the model meets this security criteria.

SEARCH RESULTS:
${formattedResults}

Provide your assessment in JSON format:
{
  "judgement": "○" | "×" | "要改善" | null,
  "comment": "Brief assessment comment explaining your reasoning (max 200 characters)",
  "evidences": [
    {
      "url": "source url",
      "title": "source title", 
      "snippet": "relevant excerpt (max 300 characters)",
      "confidence": 0.0-1.0
    }
  ]
}

Guidelines:
- Use "○" for meets criteria completely
- Use "×" for clearly does not meet criteria  
- Use "要改善" for partially meets but needs improvement
- Use null only if truly insufficient information
- Include 2-3 most relevant evidences
- Base assessment on factual information from search results`;

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
    
    // モデル全体に対して一度だけTavily検索を実行
    const modelQuery = `${modelName} ${vendor} security vulnerability assessment compliance`;
    console.log(`Searching with model query: ${modelQuery}`);
    
    const allSearchResults = await this.searchTavily(modelQuery);
    console.log(`Tavily returned ${allSearchResults.length} results for ${modelName}`);
    
    const uniqueResults = this.deduplicateResults(allSearchResults);
    console.log(`Using ${uniqueResults.length} unique results for analysis`);
    
    // 各セキュリティ項目に対してGPT分析を実行
    const assessmentItems: Partial<AssessmentItem>[] = [];
    for (let i = 0; i < securityItems.length; i++) {
      const item = securityItems[i];
      console.log(`Processing item ${i+1}/${securityItems.length}: ${item.name}`);
      
      // 関連する検索結果をフィルタリング（キーワードマッチング）
      const relevantResults = this.filterRelevantResults(uniqueResults, item);
      console.log(`Found ${relevantResults.length} relevant results out of ${uniqueResults.length} for ${item.name}`);
      
      // 関連結果が少ない場合は、全体結果も含める
      const topResults = relevantResults.length >= 5 ? relevantResults.slice(0, 10) : uniqueResults.slice(0, 8);
      console.log(`Using ${topResults.length} search results for GPT analysis of ${item.name}`);
      
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

  private static filterRelevantResults(
    results: TavilySearchResult[],
    item: SecurityItem
  ): TavilySearchResult[] {
    // より幅広いキーワードセットを生成
    const keywords = [
      ...item.name.toLowerCase().split(' ').filter(w => w.length > 2),
      ...item.criteria.toLowerCase().split(' ').filter(w => w.length > 3),
      ...item.category.toLowerCase().split(' ').filter(w => w.length > 2),
      'security', 'privacy', 'safety', 'compliance', 'vulnerability', 'risk'
    ].filter((keyword, index, self) => self.indexOf(keyword) === index); // 重複除去

    console.log(`Using keywords for filtering ${item.name}:`, keywords.slice(0, 10));

    return results.filter(result => {
      const content = `${result.title} ${result.content}`.toLowerCase();
      // より柔軟なマッチング: 複数キーワードのうち1つでもマッチすればOK
      const hasMatch = keywords.some(keyword => content.includes(keyword));
      if (hasMatch) {
        console.log(`Matched result for ${item.name}: ${result.title}`);
      }
      return hasMatch;
    }).sort((a, b) => {
      // より多くのキーワードにマッチする結果を上位に
      const aMatches = keywords.filter(keyword => 
        `${a.title} ${a.content}`.toLowerCase().includes(keyword)
      ).length;
      const bMatches = keywords.filter(keyword => 
        `${b.title} ${b.content}`.toLowerCase().includes(keyword)
      ).length;
      return bMatches - aMatches || b.score - a.score;
    });
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