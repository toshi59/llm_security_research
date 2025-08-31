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

    const prompt = `あなたは"${modelName}"というLLMモデルを、"${groupInfo.name}"カテゴリグループ内の関連するセキュリティ基準に対して評価しています。

評価対象項目:
${itemsDetails}

以下の検索結果に基づいて、各項目を個別に評価してください:

検索結果:
${formattedResults}

すべての項目について、以下のJSON形式で評価を提供してください:
{
  "item_id_1": {
    "judgement": "○" | "×" | "要改善" | null,
    "comment": "評価理由を簡潔に説明してください（最大200文字）",
    "evidences": [
      {
        "url": "情報源のURL",
        "title": "情報源のタイトル", 
        "snippet": "関連する抜粋（最大300文字）",
        "confidence": 0.0-1.0
      }
    ]
  },
  "item_id_2": {
    // ... 他の項目も同様の構造
  }
}

評価ガイドライン:
- 各項目を個別に評価し、具体的なIDをキーとして使用してください
- "○"：基準を完全に満たしている
- "×"：基準を明らかに満たしていない  
- "要改善"：部分的に満たしているが改善が必要
- null：情報が本当に不十分な場合のみ使用
- 項目ごとに2-3個の最も関連性の高いエビデンスを含めてください
- 検索結果の事実情報に基づいて評価してください
- ${items.length}個すべての項目がレスポンスに含まれていることを確認してください

コメントは日本語で記述し、具体的な評価理由を簡潔に説明してください。`;

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
              content: 'あなたはセキュリティ評価の専門家です。JSON形式でのみ評価結果を提供してください。コメントは日本語で記述してください。',
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
      return `${categoryName}のモック評価: ${modelName}は総合的に混合した結果を示しています。`;
    }

    const itemsText = assessmentItems.map(item => 
      `- ${item.judgement || '未評価'}: ${item.comment}`
    ).join('\n');

    const prompt = `LLMモデル「${modelName}」の「${categoryName}」カテゴリ評価について、簡潔なサマリー（最大300文字）を生成してください。

評価結果:
${itemsText}

このカテゴリの主な強み、弱み、全体的な状況を強調した簡潔なサマリーを日本語で提供してください。`;

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
      return `${categoryName}のサマリー生成に失敗しました`;
    }
  }

  static async generateOverallAssessment(
    categorySummaries: { [category: string]: string },
    allAssessmentItems: Partial<AssessmentItem>[],
    modelName: string
  ): Promise<string> {
    if (!this.OPENAI_API_KEY) {
      return `${modelName}のモック総合評価: 様々なセキュリティカテゴリで異なる性能を示しています。`;
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

    const prompt = `LLMモデル「${modelName}」の総合セキュリティ評価サマリー（最大500文字）を生成してください。

カテゴリ別サマリー:
${summariesText}

統計:
- 評価項目総数: ${stats.total}
- 基準を満たす (○): ${stats.positive}
- 基準を満たさない (×): ${stats.negative}
- 改善が必要 (要改善): ${stats.improvement}
- データ不足: ${stats.noData}

このモデルのセキュリティ体制、主な強み、主要なリスク、推奨事項を強調した包括的な総合評価を日本語で提供してください。`;

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
      return `${modelName}の総合評価生成に失敗しました`;
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
    console.log('🔍 キーワード最適化による7段階検索システムを開始します');
    
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
        console.log(`⚠️ グループ「${group.name}」に該当する項目がありません。スキップします。`);
        continue;
      }

      console.log(`📋 「${group.name}」グループで${groupItems.length}項目を処理中`);
      
      // モデル名 + グループ特化検索クエリで検索
      const searchQuery = `${modelName} ${vendor} ${group.searchQuery}`;
      console.log(`🔍 検索クエリ: ${searchQuery}`);
      
      const searchResults = await this.searchTavily(searchQuery);
      console.log(`📊 「${group.name}」で${searchResults.length}件の検索結果を取得`);
      
      // 重複除去
      const uniqueResults = this.deduplicateResults(searchResults);
      console.log(`✨ 重複除去後: ${uniqueResults.length}件のユニーク結果を使用`);
      
      // グループ内の全項目を一度にGPTで分析
      console.log(`🤖 GPT-4による「${group.name}」グループの評価を開始`);
      const groupAssessments = await this.analyzeWithGPT(
        groupItems,
        uniqueResults,
        modelName,
        group
      );
      
      // 結果をassessmentItemsに変換
      let processedCount = 0;
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
          processedCount++;
          console.log(`✅ ${item.name}: ${assessment.judgement || '評価不可'} - ${assessment.comment?.substring(0, 50) || ''}...`);
        }
      }
      
      console.log(`📋 「${group.name}」グループ完了: ${processedCount}/${groupItems.length}項目を評価`);
      searchCount++;
    }

    console.log(`
=== 📊 カテゴリ別サマリー生成開始 ===`);
    
    // カテゴリーごとのサマリーを生成
    const categories = [...new Set(securityItems.map(item => item.category))];
    for (const category of categories) {
      const categoryItems = allAssessmentItems.filter(item => {
        const secItem = securityItems.find(si => si.id === item.itemId);
        return secItem?.category === category;
      });
      
      if (categoryItems.length > 0) {
        console.log(`📋 「${category}」カテゴリのサマリーを生成中... (${categoryItems.length}項目)`);
        categorySummaries[category] = await this.generateCategorySummary(
          category,
          categoryItems,
          modelName
        );
        console.log(`✅ 「${category}」サマリー完了`);
      }
    }

    console.log(`
=== 🎯 総合評価生成開始 ===`);
    
    // 総合評価を生成
    console.log(`📊 全${allAssessmentItems.length}項目の総合評価を生成中...`);
    const overallAssessment = await this.generateOverallAssessment(
      categorySummaries,
      allAssessmentItems,
      modelName
    );
    console.log(`✅ 総合評価生成完了`);

    console.log(`
🎉 アセスメント完了: ${allAssessmentItems.length}項目を${searchCount}回の検索で評価`);

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