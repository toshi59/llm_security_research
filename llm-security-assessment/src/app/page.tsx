'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/page-layout';
import { CheckCircle, ArrowRight, BarChart3, Settings, Filter } from 'lucide-react';

export default function Home() {
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="p-3 bg-blue-100 rounded-lg mx-auto mb-3 w-fit">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">アセスメント結果</CardTitle>
                <CardDescription>統計とチャートで全体を把握</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/assessments">
                  <Button className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    結果を見る
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="p-3 bg-green-100 rounded-lg mx-auto mb-3 w-fit">
                  <Filter className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">アセスメント項目一覧</CardTitle>
                <CardDescription>40項目の評価基準を確認</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/security-items">
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    項目を見る
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="p-3 bg-purple-100 rounded-lg mx-auto mb-3 w-fit">
                  <Settings className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg">AIモデルアセスメント</CardTitle>
                <CardDescription>新しいモデルの評価を実行</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/admin">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    実行する
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
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
      </div>
    </PageLayout>
  );
}