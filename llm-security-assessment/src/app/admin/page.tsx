'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, LogOut, Loader2, CheckCircle, XCircle, Home, Trash2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';

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

interface ModelWithCount {
  id: string;
  name: string;
  vendor: string;
  notes: string;
  assessmentCount: number;
  lastAssessmentDate: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [modelName, setModelName] = useState('');
  const [vendor, setVendor] = useState('');
  const [investigating, setInvestigating] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>([]);
  const [models, setModels] = useState<ModelWithCount[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [progressSteps, setProgressSteps] = useState<{
    step: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    message: string;
  }[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogWindow, setShowLogWindow] = useState(false);
  const [result, setResult] = useState<{
    assessment: { id: string; modelId: string; createdAt: string; createdBy: string; status: string; summary: string };
    model: { id: string; name: string; vendor: string; notes: string };
    items: Array<{
      id: string;
      assessmentId: string;
      itemId: string;
      judgement: '○' | '×' | '要改善' | null;
      comment: string;
      evidences: Array<{ url: string; title: string; snippet: string }>;
    }>;
  } | null>(null);
  // const [recentAssessments, setRecentAssessments] = useState<never[]>([]);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    fetchSecurityItems();
    fetchModels();
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
    }
  };

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch('/api/admin/models');
      if (response.ok) {
        const models = await response.json();
        setModels(models);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  // セキュリティ項目の詳細を取得するヘルパー関数
  const getSecurityItem = (itemId: string): SecurityItem | null => {
    return securityItems.find(item => item.id === itemId) || null;
  };

  // モデル削除機能
  const handleDeleteModel = async (modelId: string, modelName: string) => {
    if (!confirm(`モデル「${modelName}」とその全ての評価結果を削除しますか？この操作は元に戻せません。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        // モデル一覧を再取得
        await fetchModels();
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete model error:', error);
      alert('削除中にエラーが発生しました');
    }
  };

  // 進捗ステップを管理するヘルパー関数
  const updateProgressStep = (stepIndex: number, status: 'pending' | 'active' | 'completed' | 'error', message?: string) => {
    setProgressSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status, ...(message && { message }) }
        : step
    ));
  };

  // ログ追加関数
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
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
    setLogs([]);
    setShowLogWindow(true);

    // 進捗ステップを初期化
    const steps = initializeProgressSteps();
    
    try {
      // ステップ1: 初期化
      updateProgressStep(0, 'active');
      setProgress('アセスメントを初期化しています...');
      addLog('アセスメントを開始しました');
      addLog(`対象モデル: ${modelName}${vendor ? ` (${vendor})` : ''}`);
      setProgressValue(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgressStep(0, 'completed');
      addLog('初期化が完了しました');

      // ステップ2: 情報収集開始
      updateProgressStep(1, 'active');
      setProgress('Tavilyで情報を収集中...');
      addLog('7つの戦略的検索グループによる情報収集を開始します');
      setProgressValue(15);
      
      const response = await fetch('/api/admin/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelName, vendor }),
      });

      if (response.ok) {
        addLog('情報収集が完了しました');
        updateProgressStep(1, 'completed');
        
        addLog('モデル情報を作成しています...');
        updateProgressStep(2, 'completed');
        
        addLog('セキュリティ項目を取得しています...');
        updateProgressStep(3, 'completed');
        
        addLog('AI による評価を実行しています...');
        updateProgressStep(4, 'completed');
        
        addLog('アセスメント結果を保存しています...');
        updateProgressStep(5, 'completed');
        
        setProgress('結果を処理中...');
        setProgressValue(85);
        
        const data = await response.json();
        
        addLog(`評価完了: ${data.items?.length || 0}項目を評価しました`);
        if (data.categorySummaries) {
          addLog(`カテゴリ別サマリー: ${Object.keys(data.categorySummaries).length}カテゴリ`);
        }
        if (data.overallAssessment) {
          addLog('総合評価を生成しました');
        }
        
        updateProgressStep(6, 'completed');
        setResult(data);
        setProgress('アセスメント完了！');
        setProgressValue(100);
        addLog('アセスメント処理が正常に完了しました');
        
        // モデル一覧を更新
        await fetchModels();
      } else {
        const currentActiveIndex = steps.findIndex(step => ['active', 'pending'].includes(step.status));
        if (currentActiveIndex !== -1) {
          updateProgressStep(currentActiveIndex, 'error', 'エラーが発生しました');
        }
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        setProgress(`アセスメント中にエラーが発生しました: ${response.status}`);
        addLog(`APIエラー: ${response.status} - ${response.statusText}`);
        addLog(`エラー詳細: ${errorText}`);
        alert(`エラー詳細: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('Investigation error:', error);
      const currentActiveIndex = steps.findIndex(step => ['active', 'pending'].includes(step.status));
      if (currentActiveIndex !== -1) {
        updateProgressStep(currentActiveIndex, 'error', 'エラーが発生しました');
      }
      setProgress('アセスメント中にエラーが発生しました');
      addLog(`予期しないエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      alert(`エラー詳細: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setInvestigating(false);
    }
  };

  const handleViewAssessment = () => {
    if (result) {
      router.push(`/assessments/details?assessmentId=${result.assessment.id}`);
    }
  };

  return (
    <PageLayout
      title="モデル/サービスアセスメント"
      description="AIモデル・サービスのセキュリティアセスメント実施・管理"
      breadcrumbs={[
        { label: 'ホーム', href: '/', icon: <Home className="h-3 w-3" /> },
        { label: 'モデル/サービスアセスメント' }
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
            <CardTitle>モデル/サービスアセスメント</CardTitle>
            <CardDescription>
              AIモデル・サービス名を入力して、包括的なセキュリティアセスメントを自動実行します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">モデル・サービス名 *</label>
                  <Input
                    placeholder="例: GPT-5, Claude-3.5, Gemini-2.0, ChatGPT Plus"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    disabled={investigating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">開発会社・プロバイダー</label>
                  <Input
                    placeholder="例: OpenAI, Anthropic, Google, Microsoft"
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{progressValue}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLogWindow(!showLogWindow)}
                        >
                          {showLogWindow ? 'ログを隠す' : 'ログを表示'}
                        </Button>
                      </div>
                    </div>
                    <Progress value={progressValue} className="w-full h-3" />
                  </div>

                  {/* ログウィンドウ */}
                  {showLogWindow && (
                    <Card className="bg-gray-900 text-green-400 font-mono text-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-green-300">評価ログ</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {logs.map((log, index) => (
                            <div key={index} className="whitespace-pre-wrap">
                              {log}
                            </div>
                          ))}
                          {logs.length === 0 && (
                            <div className="text-gray-500">ログはまだありません</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                        {result.items.filter((i) => i.judgement === '○').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">不適合</div>
                      <div className="text-2xl font-bold text-red-500">
                        {result.items.filter((i) => i.judgement === '×').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">要改善</div>
                      <div className="text-2xl font-bold text-yellow-500">
                        {result.items.filter((i) => i.judgement === '要改善').length}
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
                      {result.items.slice(0, 10).map((item, index: number) => {
                        const securityItem = getSecurityItem(item.itemId);
                        return (
                          <tr key={index} className="border-b">
                            <td className="p-2">
                              <div className="font-medium text-sm">
                                {securityItem ? securityItem.name : `項目 ${index + 1}`}
                              </div>
                              {securityItem && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {securityItem.category}
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {item.judgement === '○' && <Badge variant="success">○</Badge>}
                              {item.judgement === '×' && <Badge variant="destructive">×</Badge>}
                              {item.judgement === '要改善' && <Badge variant="warning">要改善</Badge>}
                              {!item.judgement && <Badge variant="outline">-</Badge>}
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">{item.comment || '-'}</td>
                            <td className="p-2 text-center">{item.evidences?.length || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleViewAssessment} className="flex-1">
                    評価結果を詳しく見る
                  </Button>
                  <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
                    閉じる
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* モデル管理セクション */}
        <Card>
          <CardHeader>
            <CardTitle>登録済みモデル管理</CardTitle>
            <CardDescription>
              評価済みのモデル一覧と削除機能
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingModels ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <div className="text-sm text-gray-500">モデル一覧を読み込み中...</div>
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                登録されているモデルがありません
              </div>
            ) : (
              <div className="space-y-2">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {model.name}
                            {model.vendor && (
                              <span className="text-sm text-gray-500 ml-2">({model.vendor})</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {model.assessmentCount > 0 ? (
                              <>
                                評価件数: {model.assessmentCount}件 • 
                                最終評価: {model.lastAssessmentDate ? new Date(model.lastAssessmentDate).toLocaleDateString('ja-JP') : '不明'}
                              </>
                            ) : (
                              '評価結果なし'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteModel(model.id, model.name)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}