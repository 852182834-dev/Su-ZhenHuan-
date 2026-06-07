import './globals.css';

export const metadata = {
  title: 'StudyHub - 大学生智能化学习辅助工具',
  description: 'StudyHub 帮助大学生高效记录课堂笔记、管理每日学习待办、利用番茄钟与备考倒计时专注备考，并与同伴在共享社区实时交流互助。',
  keywords: 'StudyHub, 学习工具, 番茄钟, 备考倒计时, 大学生, 待办清单, 学习笔记, 共享社区, Supabase, Next.js',
  authors: [{ name: 'StudyHub Team' }],
  viewport: 'width=device-width, initial-scale=1.0',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
