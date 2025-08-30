// デザインシステムの基盤となるトークン定義
export const designTokens = {
  // ブランドカラー
  colors: {
    brand: {
      primary: {
        50: '#e6f0ff',
        100: '#b3d1ff', 
        500: '#0066FF', // メインプライマリ
        600: '#0052cc',
        900: '#003d99'
      },
      accent: {
        50: '#f0ffeb',
        100: '#ccffb3',
        500: '#66CC00', // メインアクセント  
        600: '#52a300',
        900: '#3d7a00'
      }
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a'
    },
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b', 
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  
  // タイポグラフィ
  typography: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }]
    }
  },
  
  // スペーシング
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    base: '1rem',   // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem'   // 64px
  },
  
  // ボーダーラディウス
  borderRadius: {
    sm: '0.375rem',
    base: '0.5rem', 
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem'
  },
  
  // シャドウ
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  
  // アニメーション
  animation: {
    transition: {
      fast: '150ms ease-out',
      base: '250ms ease-out', 
      slow: '350ms ease-out'
    }
  }
} as const;

// 判定結果の色定義
export const judgementColors = {
  '○': designTokens.colors.semantic.success,
  '×': designTokens.colors.semantic.error,
  '要改善': designTokens.colors.semantic.warning,
  null: designTokens.colors.neutral[400]
} as const;