import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/page-layout';
import { Shield, Search, FileText, Lock, BarChart3, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <PageLayout showBreadcrumbs={false}>
      <div className="py-8">
        {/* ヒーローセクション */}
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              LLMセキュリティ
            </span>
            <br />
            評価システム
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8">
            AI言語モデルのセキュリティ、プライバシー、倫理的側面を<br />
            <strong className="text-blue-600 dark:text-blue-400">40項目の包括的な基準</strong>で自動評価します
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/assessments">
              <Button size="lg" className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-3">
                <BarChart3 className="w-5 h-5 mr-2" />
                評価結果を見る
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-3 border-2">
                <Lock className="w-5 h-5 mr-2" />
                管理者ログイン
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
              リアルタイム評価
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              エビデンスベース
            </div>
          </div>
        </div>



      </div>
    </PageLayout>
  );
}
