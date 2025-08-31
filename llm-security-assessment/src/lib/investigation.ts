import { SecurityItem, Evidence, AssessmentItem } from './types';

interface SearchGroupInfo {
  id: string;
  name: string;
  categories: string[];
  keywords: string[];
  searchQuery: string;
}

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

  // キーワード最適化による7つの戦略的検索グループ
  private static SEARCH_GROUPS = [
    {
      id: 'legal_privacy',
      name: 'Legal & Privacy Compliance',
      categories: ['法規制・プライバシー'],
      keywords: ['legal compliance', 'privacy protection', 'data protection', 'GDPR', 'regulation', 'personal data', 'consent management'],
      searchQuery: 'legal compliance privacy protection data protection GDPR regulation personal data'
    },
    {
      id: 'security_risk',
      name: 'Security & Risk Management', 
      categories: ['セキュリティ'],
      keywords: ['security', 'vulnerability', 'encryption', 'access control', 'authentication', 'cyber security', 'data breach'],
      searchQuery: 'security vulnerability encryption access control authentication cyber security data breach'
    },
    {
      id: 'ai_ethics',
      name: 'AI Ethics & Responsibility',
      categories: ['AI倫理'],
      keywords: ['AI ethics', 'bias', 'fairness', 'responsible AI', 'algorithmic fairness', 'ethical AI', 'discrimination'],
      searchQuery: 'AI ethics bias fairness responsible AI algorithmic fairness ethical discrimination'
    },
    {
      id: 'technical_quality',
      name: 'Technical Performance & Quality',
      categories: ['技術的健全性'],
      keywords: ['performance', 'accuracy', 'reliability', 'scalability', 'quality assurance', 'technical validation', 'robustness'],
      searchQuery: 'performance accuracy reliability scalability quality assurance technical validation robustness'
    },
    {
      id: 'transparency_governance',
      name: 'Transparency & Governance',
      categories: ['透明性・説明責任', 'データガバナンス'],
      keywords: ['transparency', 'explainability', 'accountability', 'data governance', 'audit trail', 'model interpretability'],
      searchQuery: 'transparency explainability accountability data governance audit trail model interpretability'
    },
    {
      id: 'business_operations',
      name: 'Business & Operations',
      categories: ['コスト・ROI', 'ベンダー管理', '統合・相互運用性'],
      keywords: ['cost', 'ROI', 'vendor management', 'integration', 'interoperability', 'business value', 'operational efficiency'],
      searchQuery: 'cost ROI vendor management integration interoperability business value operational'
    },
    {
      id: 'sustainability',
      name: 'Sustainability & Environmental Impact',
      categories: ['持続可能性'],
      keywords: ['sustainability', 'environmental impact', 'carbon footprint', 'green AI', 'energy efficiency'],
      searchQuery: 'sustainability environmental impact carbon footprint green AI energy efficiency'
    }
  ];

  static async searchTavily(query: string): Promise<TavilySearchResult[]> {
    if (!this.TAVILY_API_KEY) {
      console.warn('Tavily API key not configured - using mock data');
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
          max_results: 100, // 1検索につき最大100サイト
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
    items: SecurityItem[],
    searchResults: TavilySearchResult[],
    modelName: string,
    groupInfo: SearchGroupInfo
  ): Promise<{ [itemId: string]: GPTAssessment }> {
    if (!searchResults || searchResults.length === 0) {
      console.warn(`No search results for ${groupInfo.name} - returning insufficient information assessments`);
      const result: { [itemId: string]: GPTAssessment } = {};
      items.forEach(item => {
        result[item.id] = {
          judgement: null,
          comment: `No search results available to assess ${item.name}`,
          evidences: [],
        };
      });
      return result;
    }

    if (!this.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured - using mock assessments');
      const result: { [itemId: string]: GPTAssessment } = {};
      const mockJudgements: Array<'○' | '×' | '要改善'> = ['○', '×', '要改善'];
      
      items.forEach(item => {
        const randomJudgement = mockJudgements[Math.floor(Math.random() * mockJudgements.length)];
        result[item.id] = {
          judgement: randomJudgement,
          comment: `Mock assessment for ${item.name}`,
          evidences: searchResults.slice(0, 2).map(r => ({
            url: r.url,
            title: r.title,
            snippet: r.content.substring(0, 200),
            confidence: 0.8 + Math.random() * 0.2
          })),
        };
      });
      return result;
    }

    // 検索結果を整形してプロンプトに含める
    const formattedResults = searchResults.map((r, index) => 
      `[Source ${index + 1}]\nTitle: ${r.title}\nURL: ${r.url}\nContent: ${r.content.substring(0, 800)}\nScore: ${r.score}\n`
    ).join('\n');

    // 評価対象項目の詳細を整形
    const itemsDetails = items.map(item => 
      `ID: ${item.id}\nCategory: ${item.category}\nName: ${item.name}\nCriteria: ${item.criteria}\nStandards: ${item.standards}\nRisk: ${item.risk || 'Not specified'}\n`
    ).join('\n---\n');

    console.log(`Analyzing ${items.length} items in ${groupInfo.name} group with ${searchResults.length} search results for ${modelName}`);

    const prompt = `You are evaluating the LLM model "${modelName}" against multiple related security criteria in the "${groupInfo.name}" category group.

ASSESSMENT ITEMS TO EVALUATE:
${itemsDetails}

Based on the following search results, assess each item individually:

SEARCH RESULTS:
${formattedResults}

Provide assessments for ALL items in JSON format:
{
  "item_id_1": {
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
  },
  "item_id_2": {
    // ... similar structure for each item
  }
}

Guidelines:
- Evaluate EACH item individually with its specific ID as the key
- Use "○" for meets criteria completely
- Use "×" for clearly does not meet criteria  
- Use "要改善" for partially meets but needs improvement
- Use null only if truly insufficient information
- Include 2-3 most relevant evidences per item
- Base assessment on factual information from search results
- Ensure all ${items.length} items are included in the response`;

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
      const result: { [itemId: string]: GPTAssessment } = {};
      items.forEach(item => {
        result[item.id] = {
          judgement: null,
          comment: 'Analysis failed',
          evidences: [],
        };
      });
      return result;
    }
  }

  static async generateCategorySummary(
    categoryName: string,
    assessmentItems: Partial<AssessmentItem>[],
    modelName: string
  ): Promise<string> {
    if (!this.OPENAI_API_KEY) {
      return `Mock summary for ${categoryName}: Overall assessment shows mixed results for ${modelName}.`;
    }

    const itemsText = assessmentItems.map(item => 
      `- ${item.judgement || 'Not evaluated'}: ${item.comment}`
    ).join('\n');

    const prompt = `Generate a concise summary (max 300 characters) for the "${categoryName}" category assessment of the LLM model "${modelName}".

Assessment results:
${itemsText}

Provide a brief summary highlighting key strengths, weaknesses, and overall status for this category.`;

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
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Category summary error:', error);
      return `Summary generation failed for ${categoryName}`;
    }
  }

  static async generateOverallAssessment(
    categorySummaries: { [category: string]: string },
    allAssessmentItems: Partial<AssessmentItem>[],
    modelName: string
  ): Promise<string> {
    if (!this.OPENAI_API_KEY) {
      return `Mock overall assessment: ${modelName} shows varied performance across different security categories.`;
    }

    const summariesText = Object.entries(categorySummaries)
      .map(([category, summary]) => `${category}: ${summary}`)
      .join('\n');

    const stats = {
      total: allAssessmentItems.length,
      positive: allAssessmentItems.filter(item => item.judgement === '○').length,
      negative: allAssessmentItems.filter(item => item.judgement === '×').length,
      improvement: allAssessmentItems.filter(item => item.judgement === '要改善').length,
      noData: allAssessmentItems.filter(item => item.judgement === null).length,
    };

    const prompt = `Generate an overall security assessment summary (max 500 characters) for the LLM model "${modelName}".

Category summaries:
${summariesText}

Statistics:
- Total items assessed: ${stats.total}
- Meets criteria (○): ${stats.positive}
- Does not meet criteria (×): ${stats.negative}
- Needs improvement (要改善): ${stats.improvement}
- Insufficient data: ${stats.noData}

Provide a comprehensive overall assessment highlighting the model's security posture, main strengths, key risks, and recommendations.`;

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
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 250,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Overall assessment error:', error);
      return `Overall assessment generation failed for ${modelName}`;
    }
  }

  static async investigateModel(
    modelName: string,
    vendor: string,
    securityItems: SecurityItem[]
  ): Promise<{
    assessmentItems: Partial<AssessmentItem>[],
    categorySummaries: { [category: string]: string },
    overallAssessment: string
  }> {
    console.log(`Starting optimized investigation for ${modelName} (${vendor}) - ${securityItems.length} items`);
    
    const allAssessmentItems: Partial<AssessmentItem>[] = [];
    const categorySummaries: { [category: string]: string } = {};
    let searchCount = 0;

    // 戦略的な7回の検索を実行
    for (const group of this.SEARCH_GROUPS) {
      if (searchCount >= 7) break; // 最大7回の検索制限

      console.log(`\n=== Search ${searchCount + 1}/7: ${group.name} ===`);
      
      // このグループに該当するセキュリティ項目を取得
      const groupItems = securityItems.filter(item => 
        group.categories.includes(item.category)
      );
      
      if (groupItems.length === 0) {
        console.log(`No items found for group ${group.name}, skipping`);
        continue;
      }

      console.log(`Processing ${groupItems.length} items in ${group.name}`);
      
      // モデル名 + グループ特化検索クエリで検索
      const searchQuery = `${modelName} ${vendor} ${group.searchQuery}`;
      console.log(`Search query: ${searchQuery}`);
      
      const searchResults = await this.searchTavily(searchQuery);
      console.log(`Found ${searchResults.length} search results for ${group.name}`);
      
      // 重複除去
      const uniqueResults = this.deduplicateResults(searchResults);
      console.log(`Using ${uniqueResults.length} unique results`);
      
      // グループ内の全項目を一度にGPTで分析
      const groupAssessments = await this.analyzeWithGPT(
        groupItems,
        uniqueResults,
        modelName,
        group
      );
      
      // 結果をassessmentItemsに変換
      for (const item of groupItems) {
        const assessment = groupAssessments[item.id];
        if (assessment) {
          allAssessmentItems.push({
            itemId: item.id,
            judgement: assessment.judgement,
            comment: assessment.comment,
            evidences: assessment.evidences,
            filledBy: 'AI',
            updatedAt: new Date().toISOString(),
          });
          console.log(`Assessment completed for ${item.name}: ${assessment.judgement}`);
        }
      }

      searchCount++;
    }

    console.log(`\n=== Generating Category Summaries ===`);
    
    // カテゴリーごとのサマリーを生成
    const categories = [...new Set(securityItems.map(item => item.category))];
    for (const category of categories) {
      const categoryItems = allAssessmentItems.filter(item => {
        const secItem = securityItems.find(si => si.id === item.itemId);
        return secItem?.category === category;
      });
      
      if (categoryItems.length > 0) {
        categorySummaries[category] = await this.generateCategorySummary(
          category,
          categoryItems,
          modelName
        );
        console.log(`Generated summary for ${category}`);
      }
    }

    console.log(`\n=== Generating Overall Assessment ===`);
    
    // 総合評価を生成
    const overallAssessment = await this.generateOverallAssessment(
      categorySummaries,
      allAssessmentItems,
      modelName
    );

    console.log(`Investigation completed: ${allAssessmentItems.length} items assessed with ${searchCount} searches`);

    return {
      assessmentItems: allAssessmentItems,
      categorySummaries,
      overallAssessment
    };
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