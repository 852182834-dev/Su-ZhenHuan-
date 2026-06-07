import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // 排除静态资源和登录页面
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path === '/login' ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 读取 Supabase 自动设置的 cookies。
  // 通常 supabase client 会存储 tokens 包含 'auth-token' 或 'supabase' 关键字的 cookie 中。
  const cookies = request.cookies.getAll();
  const hasAuthToken = cookies.some(c => 
    c.name.includes('auth-token') || 
    c.name.includes('supabase.auth.token') ||
    c.name.includes('sb-')
  );

  // 由于 Supabase 默认将 Token 存储在客户端的 localStorage 中（不写入 Cookie），
  // 且项目支持“免登录体验（Demo）模式”（不产生 Supabase Cookie），
  // 如果在此处强制进行 Cookie 校验和重定向，会导致页面在 '/' 和 '/login' 之间无限循环跳转。
  // 我们完全信任客户端（src/app/page.js 和 src/app/login/page.js）自带的路由拦截守卫（Auth Guard）。
  
  /*
  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co';

  if (isSupabaseConfigured && !hasAuthToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API 路由)
     * - _next/static (静态文件)
     * - _next/image (图像优化文件)
     * - favicon.ico (浏览器图标)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
