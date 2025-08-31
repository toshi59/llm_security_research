'use client';

import { useEffect, useState } from 'react';
import { Dashboard, DashboardStats } from '@/components/ui/dashboard';
import { PageLayout } from '@/components/layout/page-layout';
import { Home, BarChart3 } from 'lucide-react';

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

export default function DashboardPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>([]);
  const [loading, setLoading] = useState(true);

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
            acc.push(current);
          } else {
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

  // ダッシュボード統計の計算
  const categories = [...new Set(securityItems.map(item => item.category))];
  const models = [...new Set(assessments.map(a => a.model?.name).filter(Boolean))];

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
        criteria: securityItem?.criteria || '',
        standards: securityItem?.standards || '',
        evidences: item.evidences?.map(e => e.snippet || e.url || '').filter(Boolean) || [],
        assessmentItem: item,
        securityItem
      };
    })
  ).filter(item => item.securityItem);

  const stats: DashboardStats = {
    totalItems: tableData.length,
    evaluatedModels: models.length,
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
      description: `${assessment.model?.name}のアセスメントを実行`,
      timestamp: assessment.createdAt,
      user: assessment.createdBy
    }))
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
      title="アセスメント結果ダッシュボード"
      description="セキュリティアセスメント結果の統計・分析画面"
      breadcrumbs={[
        { label: 'ホーム', href: '/', icon: <Home className="h-3 w-3" /> },
        { label: 'アセスメント結果', href: '/assessments' },
        { label: 'ダッシュボード' }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">統計ダッシュボード</h2>
        </div>
        
        <Dashboard stats={stats} />
      </div>
    </PageLayout>
  );
}