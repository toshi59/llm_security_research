'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/page-layout';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { CheckCircle, ArrowRight, Layers, BarChart3 } from 'lucide-react';

interface SecurityItem {
  id: string;
  category: string;
  name: string;
  criteria: string;
  standards: string;
  evidence_examples: string;
  risk: string;
  order: number;
}

export default function Home() {
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchSecurityItems();
  }, []);

  const fetchSecurityItems = async () => {
    try {
      const response = await fetch('/api/security-items');
      if (response.ok) {
        const items = await response.json();
        setSecurityItems(items);
      }
    } catch (error) {
      console.error('Error fetching security items:', error);
    } finally {
      setLoading(false);
    }
  };

  // カテゴリ別にグループ化
  const groupedItems = securityItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SecurityItem[]>);

  // カテゴリ順序の定義
  const categoryOrder = [
    '法規制・プライバシー',
    'セキュリティ',
    'AI倫理',
    '技術的健全性',
    '透明性・説明責任',
    '持続可能性',
    'データガバナンス',
    '統合・相互運用性',
    'コスト・ROI',
    'ベンダー管理'
  ];

  // カテゴリ別の表示順序
  const sortedCategories = categoryOrder.filter(cat => groupedItems[cat]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <PageLayout showBreadcrumbs={false}>
      <div className="py-8">
        {/* ヒーローセクション */}
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              LLMセキュリティ
            </span>
            <br />
            アセスメントシステム
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto mb-8">
            AI言語モデルのセキュリティ、プライバシー、倫理的側面を<br />
            <strong className="text-blue-600">40項目の包括的な基準</strong>で自動アセスメントします
          </p>
          
          <div className="flex justify-center mb-8">
            <Link href="/assessments">
              <Button size="lg" className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-3">
                <BarChart3 className="w-5 h-5 mr-2" />
                アセスメント結果を見る
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              完全自動化
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              リアルタイムアセスメント
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              エビデンスベース
            </div>
          </div>
        </div>

        {/* セキュリティ評価項目一覧 */}
        <Card className="bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900 mb-2">
              アセスメント項目一覧
            </CardTitle>
            <CardDescription className="text-base">
              40項目の包括的なセキュリティアセスメント基準（カテゴリ別）
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">アセスメント項目を読み込み中...</div>
              </div>
            ) : (
              <Accordion className="space-y-4">
                {sortedCategories.map((category) => {
                  const categoryItems = groupedItems[category];
                  const isExpanded = expandedCategories.includes(category);
                  
                  return (
                    <AccordionItem key={category} className="border border-gray-200 bg-white">
                      <AccordionTrigger 
                        isOpen={isExpanded}
                        onClick={() => toggleCategory(category)}
                        className="hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Layers className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-lg text-gray-900">{category}</div>
                            <div className="text-sm text-gray-600">
                              {categoryItems.length}項目
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent isOpen={isExpanded}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                          {categoryItems.sort((a, b) => a.order - b.order).map((item, _index) => (
                            <Card key={item.id} className="h-full hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
                              <CardContent className="p-4 h-full flex flex-col">
                                {/* ヘッダー部分 */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                    #{item.order}
                                  </div>
                                </div>
                                
                                {/* タイトル */}
                                <h3 className="font-semibold text-base text-gray-900 mb-3 line-clamp-2">
                                  {item.name}
                                </h3>
                                
                                {/* 基準 */}
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">基準</p>
                                    <p className="text-sm text-gray-600 line-clamp-3">
                                      {item.criteria}
                                    </p>
                                  </div>
                                  
                                  {/* 準拠標準 */}
                                  {item.standards && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-1">準拠標準</p>
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {item.standards}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* リスク */}
                                  {item.risk && (
                                    <div className="mt-auto">
                                      <p className="text-sm font-medium text-gray-700 mb-1">リスク</p>
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {item.risk}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* エビデンス例（折りたたみ可能） */}
                                {item.evidence_examples && (
                                  <div className="mt-4 pt-3 border-t border-gray-100">
                                    <details className="group">
                                      <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                                        エビデンス例を見る
                                      </summary>
                                      <p className="text-xs text-gray-500 mt-2 line-clamp-3">
                                        {item.evidence_examples}
                                      </p>
                                    </details>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
