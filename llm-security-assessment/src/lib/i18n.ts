export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

export const messages = {
  ja: {
    common: {
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      close: '閉じる',
    },
    nav: {
      home: 'ホーム',
      assessments: '評価一覧',
      admin: '管理画面',
      login: 'ログイン',
      logout: 'ログアウト',
    },
    auth: {
      loginTitle: '管理者ログイン',
      loginDescription: 'LLMセキュリティ評価システムの管理画面にアクセスします',
      username: 'ユーザー名',
      password: 'パスワード',
      loginButton: 'ログイン',
      loginButtonLoading: 'ログイン中...',
      invalidCredentials: 'ユーザー名またはパスワードが正しくありません',
      loginError: 'ログイン中にエラーが発生しました',
    },
    assessment: {
      title: 'LLMセキュリティ評価一覧',
      filters: 'フィルター',
      model: 'モデル',
      category: 'カテゴリ',
      judgement: '判定',
      all: 'すべて',
      compliant: '適合',
      nonCompliant: '不適合',
      needsImprovement: '要改善',
      notEvaluated: '未評価',
    },
    admin: {
      title: '管理画面',
      investigate: 'LLMモデル調査',
      investigateDescription: 'モデル名を入力して、セキュリティ評価の自動調査を実行します',
      modelName: 'モデル名',
      vendor: 'ベンダー',
      executeInvestigation: '調査を実行',
      investigating: '調査中...',
      investigationComplete: '調査完了！',
      saveAssessment: '評価を登録',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
    },
    nav: {
      home: 'Home',
      assessments: 'Assessments',
      admin: 'Admin',
      login: 'Login',
      logout: 'Logout',
    },
    auth: {
      loginTitle: 'Admin Login',
      loginDescription: 'Access the LLM Security Assessment System admin panel',
      username: 'Username',
      password: 'Password',
      loginButton: 'Login',
      loginButtonLoading: 'Logging in...',
      invalidCredentials: 'Invalid username or password',
      loginError: 'An error occurred during login',
    },
    assessment: {
      title: 'LLM Security Assessment List',
      filters: 'Filters',
      model: 'Model',
      category: 'Category',
      judgement: 'Judgement',
      all: 'All',
      compliant: 'Compliant',
      nonCompliant: 'Non-compliant',
      needsImprovement: 'Needs Improvement',
      notEvaluated: 'Not Evaluated',
    },
    admin: {
      title: 'Admin Panel',
      investigate: 'LLM Model Investigation',
      investigateDescription: 'Enter a model name to execute automated security assessment investigation',
      modelName: 'Model Name',
      vendor: 'Vendor',
      executeInvestigation: 'Execute Investigation',
      investigating: 'Investigating...',
      investigationComplete: 'Investigation Complete!',
      saveAssessment: 'Save Assessment',
    },
  },
} as const;

export function getMessage(locale: Locale, key: string): string {
  const keys = key.split('.');
  let current: any = messages[locale];
  
  for (const k of keys) {
    current = current?.[k];
  }
  
  return current || key;
}