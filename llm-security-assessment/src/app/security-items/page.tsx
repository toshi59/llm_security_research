'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/page-layout';
import { ChevronUp, ChevronDown, Home, List } from 'lucide-react';

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

export default function SecurityItemsPage() {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="アセスメント項目一覧"
      description="40項目の包括的なセキュリティアセスメント基準"
      breadcrumbs={[
        { label: 'ホーム', href: '/', icon: <Home className="h-3 w-3" /> },
        { label: 'アセスメント項目一覧' }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">セキュリティアセスメント基準</h2>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              40項目の包括的アセスメント基準
            </CardTitle>
            <CardDescription className="text-base">
              法規制・プライバシーから技術的健全性まで、10カテゴリの詳細基準
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  {sortedItems.map((item) => (
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
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}