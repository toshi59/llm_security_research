'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Clock, BarChart3, Users, Shield, TrendingUp } from 'lucide-react'

export interface DashboardStats {
  totalItems: number
  evaluatedModels: number
  evaluatedItems: number
  compliantItems: number
  nonCompliantItems: number
  needsImprovementItems: number
  categoryStats: Array<{
    category: string
    total: number
    compliant: number
    nonCompliant: number
    needsImprovement: number
    pending: number
  }>
  riskLevelStats: {
    low: number
    medium: number
    high: number
    critical: number
  }
  recentActivity: Array<{
    id: string
    type: 'evaluation' | 'investigation' | 'update'
    description: string
    timestamp: string
    user: string
  }>
}

interface DashboardProps {
  stats: DashboardStats
  className?: string
}

export function Dashboard({ stats, className }: DashboardProps) {
  const evaluationRate = stats.totalItems > 0 ? (stats.evaluatedItems / stats.totalItems) * 100 : 0
  const complianceRate = stats.evaluatedItems > 0 ? (stats.compliantItems / stats.evaluatedItems) * 100 : 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* 概要統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="評価モデル数"
          value={stats.evaluatedModels}
          icon={<Users className="h-5 w-5 text-purple-600" />}
          description="アセスメント済み"
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
        />
        
        <StatCard
          title="総項目数"
          value={stats.totalItems}
          icon={<BarChart3 className="h-5 w-5" />}
          description="セキュリティ評価項目"
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        />
        
        <StatCard
          title="評価済み"
          value={stats.evaluatedItems}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          description={`${evaluationRate.toFixed(1)}% 完了`}
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
        />
        
        <StatCard
          title="適合率"
          value={`${complianceRate.toFixed(1)}%`}
          icon={<Shield className="h-5 w-5 text-blue-600" />}
          description="評価済み項目中の適合率"
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        />
        
        <StatCard
          title="要対応"
          value={stats.nonCompliantItems + stats.needsImprovementItems}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          description="不適合・要改善項目"
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 判定状況サマリー */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              判定状況サマリー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">適合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{stats.compliantItems}</span>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {stats.totalItems > 0 ? ((stats.compliantItems / stats.totalItems) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">不適合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{stats.nonCompliantItems}</span>
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    {stats.totalItems > 0 ? ((stats.nonCompliantItems / stats.totalItems) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">要改善</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{stats.needsImprovementItems}</span>
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    {stats.totalItems > 0 ? ((stats.needsImprovementItems / stats.totalItems) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">未評価</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{stats.totalItems - stats.evaluatedItems}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalItems > 0 ? (((stats.totalItems - stats.evaluatedItems) / stats.totalItems) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* プログレスバー */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">全体進捗</span>
                <span className="font-medium">{evaluationRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${evaluationRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* カテゴリ別ドーナツチャート風 */}
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別評価状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.categoryStats.map((category, _index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{category.category}</span>
                    <span className="text-xs text-gray-500">
                      {category.total}項目
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 h-3">
                    {/* 適合 */}
                    <div
                      className="bg-green-400 rounded-sm h-full transition-all"
                      style={{
                        width: `${category.total > 0 ? (category.compliant / category.total) * 100 : 0}%`
                      }}
                      title={`適合: ${category.compliant}項目`}
                    />
                    {/* 要改善 */}
                    <div
                      className="bg-yellow-400 rounded-sm h-full transition-all"
                      style={{
                        width: `${category.total > 0 ? (category.needsImprovement / category.total) * 100 : 0}%`
                      }}
                      title={`要改善: ${category.needsImprovement}項目`}
                    />
                    {/* 不適合 */}
                    <div
                      className="bg-red-400 rounded-sm h-full transition-all"
                      style={{
                        width: `${category.total > 0 ? (category.nonCompliant / category.total) * 100 : 0}%`
                      }}
                      title={`不適合: ${category.nonCompliant}項目`}
                    />
                    {/* 未評価 */}
                    <div
                      className="bg-gray-300 rounded-sm h-full transition-all"
                      style={{
                        width: `${category.total > 0 ? (category.pending / category.total) * 100 : 0}%`
                      }}
                      title={`未評価: ${category.pending}項目`}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded" />
                      <span>{category.compliant}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded" />
                      <span>{category.needsImprovement}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded" />
                      <span>{category.nonCompliant}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded" />
                      <span>{category.pending}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* リスクレベル分布と最近のアクティビティ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              リスクレベル分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {stats.riskLevelStats.critical}
                </div>
                <div className="text-sm text-red-600 font-medium">極高</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.riskLevelStats.high}
                </div>
                <div className="text-sm text-orange-600 font-medium">高</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.riskLevelStats.medium}
                </div>
                <div className="text-sm text-yellow-600 font-medium">中</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {stats.riskLevelStats.low}
                </div>
                <div className="text-sm text-green-600 font-medium">低</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              最近のアクティビティ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {activity.type === 'evaluation' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'investigation' && <BarChart3 className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'update' && <Users className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {activity.user}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 統計カードコンポーネント
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description: string
  className?: string
}

function StatCard({ title, value, icon, description, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">
              {title}
            </p>
            <div className="text-3xl font-bold text-gray-900">
              {value}
            </div>
            <p className="text-xs text-gray-500">
              {description}
            </p>
          </div>
          <div className="opacity-60">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}