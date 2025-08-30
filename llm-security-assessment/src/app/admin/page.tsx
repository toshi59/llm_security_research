'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, LogOut, Loader2, CheckCircle, AlertTriangle, XCircle, Zap, ExternalLink, BarChart3, Home } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const router = useRouter();
  const [modelName, setModelName] = useState('');
  const [vendor, setVendor] = useState('');
  const [investigating, setInvestigating] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [progressSteps, setProgressSteps] = useState<{
    step: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    message: string;
  }[]>([]);
  const [result, setResult] = useState<any>(null);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [cleaning, setCleaning] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  // 進捗ステップを管理するヘルパー関数
  const updateProgressStep = (stepIndex: number, status: 'pending' | 'active' | 'completed' | 'error', message?: string) => {
    setProgressSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status, ...(message && { message }) }
        : step
    ));
  };

  const initializeProgressSteps = () => {
    const steps = [
      { step: '初期化', status: 'pending' as const, message: 'アセスメントを初期化しています...' },
      { step: '情報収集', status: 'pending' as const, message: 'Tavilyで情報を収集中...' },
      { step: 'モデル作成', status: 'pending' as const, message: 'モデル情報を作成中...' },
      { step: 'セキュリティ項目取得', status: 'pending' as const, message: 'セキュリティ項目を取得中...' },
      { step: 'アセスメント実行', status: 'pending' as const, message: 'AIによるアセスメントを実行中...' },
      { step: 'データ保存', status: 'pending' as const, message: 'アセスメント結果を保存中...' },
      { step: '完了', status: 'pending' as const, message: 'アセスメント完了！' }
    ];
    setProgressSteps(steps);
    return steps;
  };

  const handleCleanupOldAssessments = async () => {
    if (!confirm('古いアセスメント結果を削除しますか？この操作は元に戻せません。')) {
      return;
    }

    setCleaning(true);
    try {
      const response = await fetch('/api/assessments/cleanup', {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.message}\n残りモデル数: ${result.remainingModels}`);
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('Error cleaning up assessments:', error);
      alert('削除中にエラーが発生しました');
    } finally {
      setCleaning(false);
    }
  };

  const handleInvestigate = async () => {
    if (!modelName.trim()) {
      alert('モデル名を入力してください');
      return;
    }

    setInvestigating(true);
    setResult(null);
    setProgressValue(0);

    // 進捗ステップを初期化
    const steps = initializeProgressSteps();
    
    try {
      // ステップ1: 初期化
      updateProgressStep(0, 'active');
      setProgress('アセスメントを初期化しています...');
      setProgressValue(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgressStep(0, 'completed');

      // ステップ2: 情報収集開始
      updateProgressStep(1, 'active');
      setProgress('Tavilyで情報を収集中...');
      setProgressValue(15);
      
      const response = await fetch('/api/admin/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelName, vendor }),
      });

      if (response.ok) {
        updateProgressStep(1, 'completed');
        updateProgressStep(2, 'completed');
        updateProgressStep(3, 'completed');
        updateProgressStep(4, 'completed');
        updateProgressStep(5, 'completed');
        
        setProgress('結果を処理中...');
        setProgressValue(85);
        
        const data = await response.json();
        
        updateProgressStep(6, 'completed');
        setResult(data);
        setProgress('アセスメント完了！');
        setProgressValue(100);
      } else {
        const currentActiveIndex = steps.findIndex(step => step.status === 'active' || step.status === 'pending');
        if (currentActiveIndex !== -1) {
          updateProgressStep(currentActiveIndex, 'error', 'エラーが発生しました');
        }
        setProgress('アセスメント中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Investigation error:', error);
      const currentActiveIndex = steps.findIndex(step => step.status === 'active' || step.status === 'pending');
      if (currentActiveIndex !== -1) {
        updateProgressStep(currentActiveIndex, 'error', 'エラーが発生しました');
      }
      setProgress('アセスメント中にエラーが発生しました');
    } finally {
      setInvestigating(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!result) return;

    try {
      const response = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: result.model.id,
          summary: result.assessment.summary,
          items: result.items.map((item: any) => ({
            itemId: item.itemId,
            judgement: item.judgement,
            comment: item.comment,
            evidences: item.evidences,
          })),
        }),
      });

      if (response.ok) {
        alert('評価を保存しました');
        router.push('/assessments');
      } else {
        alert('保存中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    }
  };

  return (
    <PageLayout
      title="生成AIモデルアセスメント"
      description="生成AIモデルのセキュリティアセスメント実施・管理"
      breadcrumbs={[
        { label: 'ホーム', href: '/', icon: <Home className="h-3 w-3" /> },
        { label: '生成AIモデルアセスメント' }
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div></div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCleanupOldAssessments}
              disabled={cleaning}
            >
              {cleaning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              {cleaning ? '削除中...' : '古いアセスメント削除'}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>生成AIモデルアセスメント</CardTitle>
            <CardDescription>
              生成AIモデル名を入力して、包括的なセキュリティアセスメントを自動実行します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">生成AIモデル名 *</label>
                  <Input
                    placeholder="例: GPT-5, Claude-3.5, Gemini-2.0"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    disabled={investigating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">開発会社・ベンダー</label>
                  <Input
                    placeholder="例: OpenAI, Anthropic, Google"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    disabled={investigating}
                  />
                </div>
              </div>
              
              <Button
                onClick={handleInvestigate}
                disabled={investigating || !modelName.trim()}
                className="w-full"
              >
                {investigating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    アセスメント実行中...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    アセスメント実行
                  </>
                )}
              </Button>
              
              {investigating && progressSteps.length > 0 && (
                <div className="space-y-4">
                  {/* プログレスバー */}
                  <div className="w-full">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">進捗状況</span>
                      <span className="font-medium">{progressValue}%</span>
                    </div>
                    <Progress value={progressValue} className="w-full h-3" />
                  </div>

                  {/* 詳細ステップ */}
                  <div className="space-y-2">
                    {progressSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {step.status === 'completed' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {step.status === 'active' && (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          )}
                          {step.status === 'error' && (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {step.status === 'pending' && (
                            <div className="h-5 w-5 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{step.step}</div>
                          <div className="text-xs text-gray-500">{step.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {progress && !investigating && (
                <div className="text-sm text-muted-foreground text-center">
                  {progress}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>調査結果プレビュー</CardTitle>
              <CardDescription>
                {result.model.name} ({result.model.vendor}) の評価結果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">総項目数</div>
                      <div className="text-2xl font-bold">{result.items.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">適合</div>
                      <div className="text-2xl font-bold text-green-500">
                        {result.items.filter((i: any) => i.judgement === '○').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">不適合</div>
                      <div className="text-2xl font-bold text-red-500">
                        {result.items.filter((i: any) => i.judgement === '×').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">要改善</div>
                      <div className="text-2xl font-bold text-yellow-500">
                        {result.items.filter((i: any) => i.judgement === '要改善').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">項目</th>
                        <th className="text-center p-2">判定</th>
                        <th className="text-left p-2">コメント</th>
                        <th className="text-center p-2">エビデンス数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.slice(0, 10).map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">項目 {index + 1}</td>
                          <td className="p-2 text-center">
                            {item.judgement === '○' && <Badge variant="success">○</Badge>}
                            {item.judgement === '×' && <Badge variant="destructive">×</Badge>}
                            {item.judgement === '要改善' && <Badge variant="warning">要改善</Badge>}
                            {!item.judgement && <Badge variant="outline">-</Badge>}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">{item.comment || '-'}</td>
                          <td className="p-2 text-center">{item.evidences?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSaveAssessment} className="flex-1">
                    評価を登録
                  </Button>
                  <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
                    キャンセル
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}