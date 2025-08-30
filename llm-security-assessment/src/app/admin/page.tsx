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
  const [result, setResult] = useState<any>(null);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleInvestigate = async () => {
    if (!modelName.trim()) {
      alert('モデル名を入力してください');
      return;
    }

    setInvestigating(true);
    setProgress('調査を開始しています...');
    setResult(null);

    try {
      setProgress('Tavilyで情報を収集中...');
      
      const response = await fetch('/api/admin/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelName, vendor }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setProgress('調査完了！');
      } else {
        setProgress('調査中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Investigation error:', error);
      setProgress('調査中にエラーが発生しました');
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
      title="管理画面"
      description="モデル調査と管理"
      breadcrumbs={[
        { label: 'ホーム', href: '/', icon: <Home className="h-3 w-3" /> },
        { label: '管理画面' }
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div></div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            ログアウト
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>LLMモデル調査</CardTitle>
            <CardDescription>
              モデル名を入力して、セキュリティ評価の自動調査を実行します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">モデル名 *</label>
                  <Input
                    placeholder="例: GPT-5 Enterprise"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    disabled={investigating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">ベンダー</label>
                  <Input
                    placeholder="例: OpenAI"
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
                    調査中...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    調査を実行
                  </>
                )}
              </Button>
              
              {progress && (
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