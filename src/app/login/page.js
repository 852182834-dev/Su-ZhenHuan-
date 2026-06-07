'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Mail, Lock, LogIn, UserPlus, GraduationCap, AlertCircle, Play } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
    
    // Check if user is already logged in
    const checkSession = async () => {
      if (!isSupabaseConfigured()) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    if (!configured) {
      setErrorMessage('请先在 .env.local 中配置 Supabase 的 URL 和 Anon Key。');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        setSuccessMessage('登录成功，正在跳转...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1000);
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Check if user identity is automatically confirmed or requires email confirmation
        if (data?.user && data.session) {
          setSuccessMessage('注册并登录成功！正在跳转...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1000);
        } else {
          setSuccessMessage('注册成功！根据您的 Supabase 配置，可能需要前往邮箱进行激活验证。');
        }
      }
    } catch (error) {
      setErrorMessage(error.message || '操作失败，请检查您的输入或网络。');
    } finally {
      setLoading(false);
    }
  };

  // Dev Bypass Login for quick testing before Supabase configuration
  const handleBypass = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studyhub_demo_user', JSON.stringify({
        id: 'demo-user-id-123456',
        email: email || 'demo_student@studyhub.edu.cn',
        isDemo: true
      }));
      router.push('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative'
    }}>
      {/* Background decoration blur spheres */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        top: '10%',
        left: '15%',
        filter: 'blur(40px)',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        bottom: '10%',
        right: '15%',
        filter: 'blur(40px)',
        zIndex: -1
      }} />

      <div className="glass-panel pulse-card" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.5rem 2rem',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="flex-center" style={{ 
            width: '60px', 
            height: '60px', 
            background: 'var(--grad-primary)', 
            borderRadius: 'var(--radius-md)', 
            margin: '0 auto 1rem',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
          }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
            <span className="gradient-text">StudyHub</span>
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            大学生智能化学习辅助平台
          </p>
        </div>

        {/* Not Configured Alert */}
        {!configured && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <AlertCircle size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: '600', marginBottom: '0.25rem' }}>
                检测到 Supabase 未配置
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                请配置根目录下的 <code>.env.local</code>。当前支持使用下方按钮进行<strong>“免登录体验模式”</strong>进行演示。
              </p>
            </div>
          </div>
        )}

        {/* Tabs for Login / Register */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.75rem',
          border: '1px solid var(--border-light)'
        }}>
          <button 
            onClick={() => { setIsLogin(true); setErrorMessage(''); setSuccessMessage(''); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '0.95rem',
              background: isLogin ? 'var(--grad-primary)' : 'transparent',
              color: isLogin ? 'white' : 'var(--text-secondary)',
              boxShadow: isLogin ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none'
            }}
          >
            登录账号
          </button>
          <button 
            onClick={() => { setIsLogin(false); setErrorMessage(''); setSuccessMessage(''); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '0.95rem',
              background: !isLogin ? 'var(--grad-primary)' : 'transparent',
              color: !isLogin ? 'white' : 'var(--text-secondary)',
              boxShadow: !isLogin ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none'
            }}
          >
            注册新账号
          </button>
        </div>

        {/* Error and Success Banners */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {successMessage}
          </div>
        )}

        {/* Input Fields Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem'
            }}>
              学生邮箱 (Email)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem' }}
              />
              <Mail size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem'
            }}>
              登录密码 (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem' }}
              />
              <Lock size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem', height: '48px' }}
          >
            {loading ? (
              <span className="flex-center" style={{ gap: '0.5rem' }}>
                <span style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                正在处理...
              </span>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                安全登录
              </>
            ) : (
              <>
                <UserPlus size={18} />
                注册账户
              </>
            )}
          </button>
        </form>

        {/* Demo Bypass Trigger */}
        <div style={{
          marginTop: '1.5rem',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '1.25rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem'
          }}>
            快速体验 StudyHub 核心看板功能？
          </p>
          <button 
            onClick={handleBypass}
            className="btn-secondary"
            style={{ 
              width: '100%', 
              fontSize: '0.9rem',
              borderStyle: 'dashed',
              borderColor: 'var(--color-secondary)'
            }}
          >
            <Play size={16} color="var(--color-secondary)" />
            <span className="gradient-text-sec" style={{ fontWeight: '600' }}>进入 Demo 测试模式</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
