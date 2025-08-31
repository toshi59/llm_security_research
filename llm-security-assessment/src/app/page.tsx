'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/page-layout';
import { CheckCircle, ArrowRight, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [sortConfig, setSortConfig] = useState<{ key: keyof SecurityItem | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });

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

  // ソート機能
  const handleSort = (key: keyof SecurityItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ソートされたアイテム
  const sortedItems = [...securityItems].sort((a, b) => {
    if (sortConfig.key === null) {
      // デフォルトはカテゴリ順、同じカテゴリ内ではorder順
      const categoryIndexA = categoryOrder.indexOf(a.category);
      const categoryIndexB = categoryOrder.indexOf(b.category);
      if (categoryIndexA !== categoryIndexB) {
        return categoryIndexA - categoryIndexB;
      }
      return a.order - b.order;
    }

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

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
              40項目の包括的なセキュリティアセスメント基準
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">アセスメント項目を読み込み中...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left p-4 font-semibold text-gray-900 w-16">
                        <button
                          onClick={() => handleSort('order')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          #
                          {sortConfig.key === 'order' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-900 min-w-[150px]">
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          カテゴリ
                          {sortConfig.key === 'category' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-900 min-w-[200px]">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          項目名
                          {sortConfig.key === 'name' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-900 min-w-[300px]">評価基準</th>
                      <th className="text-left p-4 font-semibold text-gray-900 min-w-[200px]">準拠標準</th>
                      <th className="text-left p-4 font-semibold text-gray-900 min-w-[200px]">リスク</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm font-medium text-gray-600">{item.order}</td>
                        <td className="p-4">
                          <span className="inline-block px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full whitespace-nowrap">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-gray-900">{item.name}</td>
                        <td className="p-4 text-sm text-gray-600">
                          <div className="line-clamp-2" title={item.criteria}>
                            {item.criteria}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          <div className="line-clamp-2" title={item.standards}>
                            {item.standards}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          <div className="line-clamp-2" title={item.risk}>
                            {item.risk}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
