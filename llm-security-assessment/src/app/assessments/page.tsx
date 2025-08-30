'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { Filters, FilterGroup, FilterPills } from '@/components/ui/filters';
import { SecurityItemDetail } from '@/components/ui/slide-over';
import { Dashboard, DashboardStats } from '@/components/ui/dashboard';
import { PageLayout } from '@/components/layout/page-layout';
import { AssessmentsBreadcrumb } from '@/components/ui/breadcrumb';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ChevronRight, CheckCircle, XCircle, AlertCircle, BarChart3, Filter, Home, Package2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface AssessmentItem {
  id: string;
  assessmentId: string;
  itemId: string;
  judgement: '○' | '×' | '要改善' | null;
  comment: string;
  evidences: Array<{
    url: string;
    title: string;
    snippet: string;
    confidence?: number;
  }>;
  filledBy: string;
  updatedAt: string;
}

interface Model {
  id: string;
  name: string;
  vendor: string;
  notes?: string;
}

interface Assessment {
  id: string;
  modelId: string;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'submitted';
  summary: string;
  model: Model;
  items: AssessmentItem[];
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AssessmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModels, setExpandedModels] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assessmentsRes, itemsRes] = await Promise.all([
        fetch('/api/assessments'),
        fetch('/api/security-items'),
      ]);

      if (assessmentsRes.ok && itemsRes.ok) {
        const assessmentsData = await assessmentsRes.json();
        const itemsData = await itemsRes.json();
        setAssessments(assessmentsData);
        setSecurityItems(itemsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJudgementIcon = (judgement: string | null) => {
    switch (judgement) {
      case '○':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case '×':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case '要改善':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const getJudgementBadge = (judgement: string | null) => {
    switch (judgement) {
      case '○':
        return <Badge variant="success">適合</Badge>;
      case '×':
        return <Badge variant="destructive">不適合</Badge>;
      case '要改善':
        return <Badge variant="warning">要改善</Badge>;
      default:
        return <Badge variant="outline">未評価</Badge>;
    }
  };

  // フィルター設定の生成
  const categories = [...new Set(securityItems.map(item => item.category))];
  const models = [...new Set(assessments.map(a => a.model?.name).filter(Boolean))];
  const riskLevels = [...new Set(securityItems.map(item => item.risk))];

  const filterGroups: FilterGroup[] = [
    {
      key: 'model',
      label: 'モデル',
      options: models.map(model => ({ value: model, label: model })),
      multiple: true
    },
    {
      key: 'category',
      label: 'カテゴリ',
      options: categories.map(category => ({ value: category, label: category })),
      multiple: true
    },
    {
      key: 'judgement',
      label: '判定',
      options: [
        { value: '○', label: '適合' },
        { value: '×', label: '不適合' },
        { value: '要改善', label: '要改善' },
        { value: 'null', label: '未評価' }
      ],
      multiple: true
    },
    {
      key: 'riskLevel',
      label: 'リスクレベル',
      options: riskLevels.map(risk => ({ value: risk, label: risk })),
      multiple: true
    }
  ];

  // テーブル用データの準備
  const tableData = assessments.flatMap(assessment =>
    assessment.items.map(item => {
      const securityItem = securityItems.find(si => si.id === item.itemId);
      return {
        id: item.id,
        model: assessment.model?.name || '-',
        category: securityItem?.category || '-',
        subcategory: securityItem?.name || '-',
        judgement: item.judgement,
        comment: item.comment || '-',
        riskLevel: securityItem?.risk || 'unknown',
        filledBy: item.filledBy || '-',
        updatedAt: item.updatedAt,
        // 詳細表示用の追加データ
        criteria: securityItem?.criteria || '',
        standards: securityItem?.standards || '',
        evidences: item.evidences?.map(e => e.snippet || e.url || '').filter(Boolean) || [],
        assessmentItem: item,
        securityItem
      };
    })
  ).filter(item => item.securityItem);

  // フィルタリング処理
  const filteredData = tableData.filter(item => {
    // モデルフィルター
    if (filterValues.model && Array.isArray(filterValues.model) && filterValues.model.length > 0) {
      if (!filterValues.model.includes(item.model)) return false;
    }
    
    // カテゴリフィルター
    if (filterValues.category && Array.isArray(filterValues.category) && filterValues.category.length > 0) {
      if (!filterValues.category.includes(item.category)) return false;
    }
    
    // 判定フィルター
    if (filterValues.judgement && Array.isArray(filterValues.judgement) && filterValues.judgement.length > 0) {
      const judgementValue = item.judgement || 'null';
      if (!filterValues.judgement.includes(judgementValue)) return false;
    }
    
    // リスクレベルフィルター
    if (filterValues.riskLevel && Array.isArray(filterValues.riskLevel) && filterValues.riskLevel.length > 0) {
      if (!filterValues.riskLevel.includes(item.riskLevel)) return false;
    }
    
    return true;
  });

  // ダッシュボード統計の計算
  const stats: DashboardStats = {
    totalItems: tableData.length,
    evaluatedItems: tableData.filter(item => item.judgement !== null).length,
    compliantItems: tableData.filter(item => item.judgement === '○').length,
    nonCompliantItems: tableData.filter(item => item.judgement === '×').length,
    needsImprovementItems: tableData.filter(item => item.judgement === '要改善').length,
    categoryStats: categories.map(category => {
      const categoryItems = tableData.filter(item => item.category === category);
      return {
        category,
        total: categoryItems.length,
        compliant: categoryItems.filter(item => item.judgement === '○').length,
        nonCompliant: categoryItems.filter(item => item.judgement === '×').length,
        needsImprovement: categoryItems.filter(item => item.judgement === '要改善').length,
        pending: categoryItems.filter(item => item.judgement === null).length
      };
    }),
    riskLevelStats: {
      low: tableData.filter(item => item.riskLevel === 'low').length,
      medium: tableData.filter(item => item.riskLevel === 'medium').length,
      high: tableData.filter(item => item.riskLevel === 'high').length,
      critical: tableData.filter(item => item.riskLevel === 'critical').length
    },
    recentActivity: assessments.slice(0, 5).map(assessment => ({
      id: assessment.id,
      type: 'evaluation' as const,
      description: `${assessment.model?.name}の評価を実行`,
      timestamp: assessment.createdAt,
      user: assessment.createdBy
    }))
  };

  // テーブルカラム定義
  const columns: Column<typeof filteredData[0]>[] = [
    {
      key: 'model',
      header: 'モデル',
      sortable: true,
      filterable: true,
      className: 'w-[150px]',
      render: (value) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
      )
    },
    {
      key: 'category',
      header: 'カテゴリ',
      sortable: true,
      filterable: true,
      className: 'w-[180px]',
      render: (value) => (
        <Badge variant="outline" className="text-xs">{value}</Badge>
      )
    },
    {
      key: 'subcategory',
      header: 'チェック項目',
      sortable: true,
      filterable: true,
      className: 'min-w-[300px]',
      render: (value) => (
        <div className="text-base text-gray-900 dark:text-gray-100">{value}</div>
      )
    },
    {
      key: 'judgement',
      header: '判定',
      sortable: true,
      className: 'text-center w-[80px]',
      render: (value, row) => {
        const judgement = value as '○' | '×' | '要改善' | null;
        return (
          <div className="flex items-center justify-center">
            {getJudgementIcon(judgement)}
          </div>
        );
      }
    },
    {
      key: 'riskLevel',
      header: 'リスク',
      sortable: true,
      className: 'w-[400px]',
      render: (value, row) => {
        const securityItem = securityItems.find(si => si.id === row.assessmentItem?.itemId);
        const riskColors = {
          low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
          critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        };
        const riskLabels = {
          low: '低', medium: '中', high: '高', critical: '極高'
        };
        return (
          <div className="space-y-1">
            <span className={cn(
              'inline-block px-2 py-1 text-xs font-medium rounded-full',
              riskColors[value as keyof typeof riskColors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            )}>
              {riskLabels[value as keyof typeof riskLabels] || value}
            </span>
            {securityItem?.risk && (
              <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {securityItem.risk}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'filledBy',
      header: '評価者',
      sortable: true,
      className: 'w-[100px]',
      render: (value) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">{value}</span>
      )
    }
  ];

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterClear = () => {
    setFilterValues({});
    setSearchTerm('');
  };

  const handleRowClick = (row: typeof filteredData[0]) => {
    if (row.securityItem && row.assessmentItem) {
      setSelectedItem({
        id: row.assessmentItem.id,
        category: row.category,
        subcategory: row.subcategory,
        criteria: row.criteria,
        standards: row.standards,
        riskLevel: row.riskLevel as 'low' | 'medium' | 'high' | 'critical',
        judgement: row.judgement,
        comment: row.comment,
        evidences: row.evidences,
        filledBy: row.filledBy,
        updatedAt: row.updatedAt
      });
    }
  };

  // アクティブフィルターのピル表示用データ
  const activeFilters = Object.entries(filterValues)
    .filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value;
    })
    .flatMap(([key, value]) => {
      const group = filterGroups.find(g => g.key === key);
      if (!group) return [];
      
      if (Array.isArray(value)) {
        return value.map(v => ({
          key,
          label: group.label,
          value: group.options.find(opt => opt.value === v)?.label || v
        }));
      }
      
      return [{
        key,
        label: group.label,
        value: group.options.find(opt => opt.value === value)?.label || value
      }];
    });

  const handleFilterRemove = (key: string) => {
    setFilterValues(prev => ({ ...prev, [key]: [] }));
  };

  // モデルごとのデータをグループ化
  const groupedByModel = models.reduce((acc, modelName) => {
    const modelData = filteredData.filter(item => item.model === modelName);
    if (modelData.length > 0) {
      acc[modelName] = modelData;
    }
    return acc;
  }, {} as Record<string, typeof filteredData>);

  // アコーディオンの開閉制御
  const toggleModelExpansion = (model: string) => {
    setExpandedModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  const toggleCategoryExpansion = (model: string, category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [model]: prev[model]?.includes(category)
        ? prev[model].filter(c => c !== category)
        : [...(prev[model] || []), category]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="LLMセキュリティ評価"
      description="セキュリティ評価結果の一覧・分析画面"
      breadcrumbs={[
        { label: 'ホーム', href: '/', icon: <Home className="h-3 w-3" /> },
        { label: '評価結果一覧' }
      ]}
    >
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant={showDashboard ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDashboard(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              ダッシュボード
            </Button>
            <Button
              variant={!showDashboard ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDashboard(false)}
            >
              <Filter className="h-4 w-4 mr-2" />
              詳細一覧
            </Button>
          </div>
        </div>

        {/* ダッシュボード表示 */}
        {showDashboard && (
          <Dashboard stats={stats} />
        )}

        {/* 詳細一覧表示 */}
        {!showDashboard && (
          <div className="space-y-6">
            {/* フィルターエリア */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Filters
                  groups={filterGroups}
                  values={filterValues}
                  onChange={handleFilterChange}
                  onClear={handleFilterClear}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">表示中の件数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {filteredData.length}
                    </div>
                    <div className="text-xs text-gray-500">
                      / {tableData.length} 件
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* アクティブフィルターピル */}
            {activeFilters.length > 0 && (
              <FilterPills
                filters={activeFilters}
                onRemove={handleFilterRemove}
                className="mb-4"
              />
            )}

            {/* モデル別アコーディオン表示 */}
            <Accordion className="space-y-4">
              {Object.entries(groupedByModel).map(([modelName, modelData]) => {
                const isModelExpanded = expandedModels.includes(modelName);
                
                // カテゴリ別にグループ化
                const categoriesByModel = categories.reduce((acc, category) => {
                  const categoryData = modelData.filter(item => item.category === category);
                  if (categoryData.length > 0) {
                    acc[category] = categoryData;
                  }
                  return acc;
                }, {} as Record<string, typeof modelData>);
                
                return (
                  <AccordionItem key={modelName} className="border border-gray-200 dark:border-gray-800">
                    <AccordionTrigger 
                      isOpen={isModelExpanded}
                      onClick={() => toggleModelExpansion(modelName)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="flex items-center gap-3">
                        <Package2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-lg">{modelName}</div>
                          <div className="text-sm text-gray-500">
                            {modelData.length}項目 • 
                            適合: {modelData.filter(item => item.judgement === '○').length} • 
                            不適合: {modelData.filter(item => item.judgement === '×').length} • 
                            要改善: {modelData.filter(item => item.judgement === '要改善').length}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent isOpen={isModelExpanded}>
                      <div className="space-y-3">
                        {Object.entries(categoriesByModel).map(([category, categoryData]) => {
                          const isCategoryExpanded = expandedCategories[modelName]?.includes(category) || false;
                          
                          return (
                            <div key={category} className="border border-gray-100 dark:border-gray-800 rounded-lg">
                              <button
                                type="button"
                                onClick={() => toggleCategoryExpansion(modelName, category)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 rounded-t-lg"
                              >
                                <div className="flex items-center gap-2">
                                  {isCategoryExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                  <Layers className="h-4 w-4 text-gray-600" />
                                  <Badge variant="outline" className="text-sm">{category}</Badge>
                                  <span className="text-sm text-gray-500">({categoryData.length}項目)</span>
                                </div>
                              </button>
                              
                              {isCategoryExpanded && (
                                <div className="border-t border-gray-100 dark:border-gray-800">
                                  <DataTable
                                    data={categoryData}
                                    columns={columns.filter(col => col.key !== 'model' && col.key !== 'category')}
                                    searchable={false}
                                    onRowClick={handleRowClick}
                                    emptyMessage="このカテゴリにはデータがありません"
                                    rowClassName={(row) => 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50'}
                                    className="border-0"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}

        {/* 詳細スライドオーバー */}
        <SecurityItemDetail
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
        />
      </div>
    </PageLayout>
  );
}