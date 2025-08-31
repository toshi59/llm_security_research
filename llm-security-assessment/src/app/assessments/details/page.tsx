'use client';

import { useEffect, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { Filters, FilterGroup, FilterPills } from '@/components/ui/filters';
import { SecurityItemDetail } from '@/components/ui/slide-over';
import { PageLayout } from '@/components/layout/page-layout';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ChevronRight, ChevronDown, CheckCircle, XCircle, AlertCircle, Home, Package2, Layers, Filter } from 'lucide-react';
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

export default function AssessmentDetailsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    category: string;
    subcategory: string;
    criteria: string;
    standards: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    judgement?: '○' | '×' | '要改善' | null;
    comment?: string;
    evidences?: string[];
    filledBy?: string;
    updatedAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
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
        
        // 同じモデルに対して最新のアセスメントのみを保持
        const latestAssessments = assessmentsData.reduce((acc: Assessment[], current: Assessment) => {
          const existingIndex = acc.findIndex(a => a.model?.name === current.model?.name);
          
          if (existingIndex === -1) {
            // 新しいモデルの場合は追加
            acc.push(current);
          } else {
            // 既存モデルの場合、より新しい日時のものを保持
            const existing = acc[existingIndex];
            const currentDate = new Date(current.createdAt);
            const existingDate = new Date(existing.createdAt);
            
            if (currentDate > existingDate) {
              acc[existingIndex] = current;
            }
          }
          
          return acc;
        }, []);
        
        setAssessments(latestAssessments);
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
        { value: 'null', label: '未アセスメント' }
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

  // テーブルカラム定義
  const columns: Column<typeof filteredData[0]>[] = [
    {
      key: 'model',
      header: 'モデル',
      sortable: true,
      filterable: true,
      className: 'w-[150px]',
      render: (value) => (
        <div className="font-medium text-gray-900">{String(value)}</div>
      )
    },
    {
      key: 'category',
      header: 'カテゴリ',
      sortable: true,
      filterable: true,
      className: 'w-[180px]',
      render: (value) => (
        <Badge variant="outline" className="text-xs text-gray-900 dark:text-gray-100">{String(value)}</Badge>
      )
    },
    {
      key: 'subcategory',
      header: 'チェック項目',
      sortable: true,
      filterable: true,
      className: 'w-[200px]',
      render: (value) => (
        <div className="text-base text-gray-900">{String(value)}</div>
      )
    },
    {
      key: 'judgement',
      header: '判定',
      sortable: true,
      className: 'text-center w-[80px]',
      render: (value, _row) => {
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
      className: 'min-w-[500px]',
      render: (value, _row) => {
        const securityItem = securityItems.find(si => si.id === row.assessmentItem?.itemId);
        const riskColors = {
          low: 'bg-green-100 text-green-800',
          medium: 'bg-yellow-100 text-yellow-800',
          high: 'bg-orange-100 text-orange-800',
          critical: 'bg-red-100 text-red-800'
        };
        const riskLabels = {
          low: '低', medium: '中', high: '高', critical: '極高'
        };
        return (
          <div className="space-y-1">
            <span className={cn(
              'inline-block px-2 py-1 text-xs font-medium rounded-full',
              riskColors[value as keyof typeof riskColors] || 'bg-gray-100 text-gray-800'
            )}>
              {riskLabels[value as keyof typeof riskLabels] || String(value)}
            </span>
            {securityItem?.risk && (
              <div className="text-xs text-gray-600 line-clamp-2">
                {securityItem.risk}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'filledBy',
      header: 'アセスメント実施者',
      sortable: true,
      className: 'w-[120px]',
      render: (value) => (
        <span className="text-sm text-gray-900">{String(value)}</span>
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
      const selectedDetail = {
        id: row.assessmentItem.id,
        category: row.category,
        subcategory: row.subcategory,
        criteria: row.criteria,
        standards: row.standards,
        riskLevel: row.riskLevel as 'low' | 'medium' | 'high' | 'critical',
        judgement: row.judgement,
        comment: row.comment,
        evidences: Array.isArray(row.evidences) ? row.evidences.map(e => typeof e === 'string' ? e : (e as Record<string, unknown>)?.url ? String((e as Record<string, unknown>).url) : String(e)) : [],
        filledBy: row.filledBy,
        updatedAt: row.updatedAt
      };
      setSelectedItem(selectedDetail);
    }
  };

  // アクティブフィルターのピル表示用データ
  const activeFilters = Object.entries(filterValues)
    .filter(([_key, value]) => {
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

  // モデル別サマリ生成関数
  const generateSummaryForModel = (modelName: string, modelData: typeof filteredData, _assessment: Assessment) => {
    const totalItems = modelData.length;
    const compliantItems = modelData.filter(item => item.judgement === '○').length;
    const nonCompliantItems = modelData.filter(item => item.judgement === '×').length;
    const improvementItems = modelData.filter(item => item.judgement === '要改善').length;
    
    const complianceRate = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;
    
    // 主要な問題カテゴリを特定
    const categoryStats = categories.reduce((acc, category) => {
      const categoryItems = modelData.filter(item => item.category === category);
      const issues = categoryItems.filter(item => item.judgement === '×' || item.judgement === '要改善');
      if (issues.length > 0) {
        acc.push({ category, issueCount: issues.length, totalCount: categoryItems.length });
      }
      return acc;
    }, [] as Array<{ category: string; issueCount: number; totalCount: number }>);
    
    // 問題の多いカテゴリを特定
    const topIssueCategories = categoryStats
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, 2)
      .map(stat => stat.category);

    // 強みのあるカテゴリを特定
    const strongCategories = categories.reduce((acc, category) => {
      const categoryItems = modelData.filter(item => item.category === category);
      const compliantCount = categoryItems.filter(item => item.judgement === '○').length;
      const rate = categoryItems.length > 0 ? (compliantCount / categoryItems.length) * 100 : 0;
      if (rate >= 90) {
        acc.push(category);
      }
      return acc;
    }, [] as string[]);

    let summary = `${modelName}のセキュリティアセスメント結果: `;
    
    if (complianceRate >= 80) {
      summary += `総合適合率${complianceRate}%で、優良なセキュリティ水準を維持しています。`;
    } else if (complianceRate >= 60) {
      summary += `総合適合率${complianceRate}%で、概ね良好ですが改善の余地があります。`;
    } else if (complianceRate >= 40) {
      summary += `総合適合率${complianceRate}%で、重要な改善が必要です。`;
    } else {
      summary += `総合適合率${complianceRate}%で、包括的な改善が急務です。`;
    }
    
    // 強みがある場合は言及
    if (strongCategories.length > 0) {
      summary += ` 「${strongCategories.slice(0, 2).join('」「')}」では特に優秀な評価を獲得しています。`;
    }
    
    // 問題がある場合の詳細
    if (nonCompliantItems > 0 || improvementItems > 0) {
      summary += ` 一方で、`;
      if (nonCompliantItems > 0) {
        summary += `${nonCompliantItems}項目が不適合`;
      }
      if (nonCompliantItems > 0 && improvementItems > 0) {
        summary += '、';
      }
      if (improvementItems > 0) {
        summary += `${improvementItems}項目で要改善`;
      }
      summary += 'となっており';
      
      if (topIssueCategories.length > 0) {
        summary += `、特に「${topIssueCategories.join('」「')}」分野での対策が重要です。`;
      } else {
        summary += '、各分野での継続的な改善が推奨されます。';
      }
    }
    
    return summary;
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
      title="アセスメント詳細結果"
      description="セキュリティアセスメントの詳細結果と分析"
      breadcrumbs={[
        { label: 'ホーム', href: '/', icon: <Home className="h-3 w-3" /> },
        { label: 'アセスメント結果', href: '/assessments' },
        { label: '詳細結果' }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">詳細アセスメント結果</h2>
        </div>

        <div className="space-y-6">
          {/* フィルターエリア */}
          <div>
            <Filters
              groups={filterGroups}
              values={filterValues}
              onChange={handleFilterChange}
              onClear={handleFilterClear}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
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
              
              // このモデルに対応するアセスメントを取得
              const modelAssessment = assessments.find(assessment => 
                assessment.model?.name === modelName
              );
              
              // カテゴリ別にグループ化
              const categoriesByModel = categories.reduce((acc, category) => {
                const categoryData = modelData.filter(item => item.category === category);
                if (categoryData.length > 0) {
                  acc[category] = categoryData;
                }
                return acc;
              }, {} as Record<string, typeof modelData>);
              
              return (
                <AccordionItem key={modelName} className="border border-gray-200">
                  <AccordionTrigger 
                    isOpen={isModelExpanded}
                    onClick={() => toggleModelExpansion(modelName)}
                    className="hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Package2 className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-lg text-gray-900 mb-1">{modelName}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {modelData.length}項目 • 
                          適合: {modelData.filter(item => item.judgement === '○').length} • 
                          不適合: {modelData.filter(item => item.judgement === '×').length} • 
                          要改善: {modelData.filter(item => item.judgement === '要改善').length}
                        </div>
                        {modelAssessment && (
                          <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 mt-2 border border-gray-200">
                            <div className="font-medium text-xs text-gray-500 mb-2">📋 アセスメントサマリ</div>
                            <p className="text-sm leading-relaxed overflow-hidden" 
                               style={{ 
                                 display: '-webkit-box',
                                 WebkitLineClamp: 4,
                                 WebkitBoxOrient: 'vertical' as const
                               }}>
                              {modelAssessment.summary || generateSummaryForModel(modelName, modelData, modelAssessment)}
                            </p>
                          </div>
                        )}
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
                              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg"
                            >
                              <div className="flex items-center gap-2">
                                {isCategoryExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <Layers className="h-4 w-4 text-gray-600" />
                                <Badge variant="outline" className="text-sm text-gray-900 dark:text-gray-100">{category}</Badge>
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
                                  rowClassName={(row) => 'cursor-pointer hover:bg-gray-50'}
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