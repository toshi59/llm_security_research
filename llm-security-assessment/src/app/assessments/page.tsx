'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { BarChart3, Filter, Home, ArrowRight, TrendingUp, FileText, Users, Clock } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  vendor: string;
  notes?: string;
}

interface AssessmentItem {
  id: string;
  judgement: '○' | '×' | '要改善' | null;
  comment: string;
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    evaluatedModels: 0,
    completedToday: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/assessments');
      if (response.ok) {
        const assessmentsData = await response.json();
        
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
        
        // 統計情報を計算
        const today = new Date().toDateString();
        const completedToday = latestAssessments.filter(a => 
          new Date(a.createdAt).toDateString() === today
        ).length;
        
        // アセスメント項目の適合率を計算
        const totalItems = latestAssessments.reduce((sum, assessment) => 
          sum + assessment.items.length, 0
        );
        const compliantItems = latestAssessments.reduce((sum, assessment) => 
          sum + assessment.items.filter((item) => item.judgement === '○').length, 0
        );
        const averageScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;
        
        setStats({
          totalAssessments: latestAssessments.length,
          evaluatedModels: latestAssessments.length,
          completedToday,
          averageScore
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
      title="アセスメント結果"
      description="LLMセキュリティアセスメントの結果概要"
      breadcrumbs={[
        { label: 'ホーム', href: '/', icon: <Home className="h-3 w-3" /> },
        { label: 'アセスメント結果' }
      ]}
    >
      <div className="space-y-8">
        {/* 概要統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総アセスメント数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalAssessments}</div>
              <p className="text-xs text-muted-foreground">実施済み</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">評価済みモデル</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.evaluatedModels}</div>
              <p className="text-xs text-muted-foreground">ユニークモデル数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本日完了</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">今日のアセスメント</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均適合率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">全モデル平均</p>
            </CardContent>
          </Card>
        </div>

        {/* アクションカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">ダッシュボード</CardTitle>
                  <p className="text-sm text-gray-600">統計とチャートで全体を把握</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                アセスメント結果の統計情報、カテゴリ別分析、リスクレベル分布などを視覚的に確認できます。
              </p>
              <Link href="/assessments/dashboard">
                <Button className="w-full" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  ダッシュボードを見る
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Filter className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">詳細結果</CardTitle>
                  <p className="text-sm text-gray-600">項目別の詳細分析とフィルタリング</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                モデル別・カテゴリ別の詳細な結果表示、フィルタリング機能、個別項目の詳細確認が可能です。
              </p>
              <Link href="/assessments/details">
                <Button variant="outline" className="w-full" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  詳細結果を見る
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 最近のアセスメント */}
        {assessments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">最近のアセスメント</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assessments.slice(0, 5).map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {assessment.model?.name} ({assessment.model?.vendor})
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(assessment.createdAt).toLocaleDateString('ja-JP')} • 
                        {assessment.items.length}項目評価済み
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-green-600">
                        {Math.round((assessment.items.filter((item) => item.judgement === '○').length / assessment.items.length) * 100)}%
                      </div>
                      <div className="text-xs text-gray-400">適合率</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}