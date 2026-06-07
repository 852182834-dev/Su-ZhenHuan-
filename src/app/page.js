'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  LogOut, Plus, Trash2, CheckCircle2, Circle, Clock, 
  Calendar, MessageSquare, BookOpen, AlertCircle, Play, 
  Pause, RotateCcw, Award, Layers, Sparkles, Send
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  
  // Auth states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [supabaseActive, setSupabaseActive] = useState(false);

  // Clock state
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState('');

  // Todo States
  const [tasks, setTasks] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [todoCategory, setTodoCategory] = useState('学习');
  const [todoLoading, setTodoLoading] = useState(false);

  // Tomato Timer States
  const [timerMode, setTimerMode] = useState('work'); // 'work' or 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef(null);

  // Exam States
  const [exams, setExams] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [examLoading, setExamLoading] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);

  // Notes/Community States
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [communityTab, setCommunityTab] = useState('all'); // 'all' or 'mine'
  const [noteLoading, setNoteLoading] = useState(false);

  // Global Config info
  useEffect(() => {
    setSupabaseActive(isSupabaseConfigured());
  }, []);

  // Time & Greeting effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Formatting time
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hrs}:${mins}:${secs}`);
      
      // Formatting date
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setDateStr(now.toLocaleDateString('zh-CN', options));

      // Greeting message
      const hour = now.getHours();
      if (hour < 5) setGreeting('深夜静谧，自律的你正在弯道超车 🌙');
      else if (hour < 9) setGreeting('一日之计在于晨，清晨好时光 🌅');
      else if (hour < 12) setGreeting('专注高效的上午，今天也是元气满满的一天 📖');
      else if (hour < 14) setGreeting('午休充个电，迎接精神饱满的下午吧 ☕');
      else if (hour < 18) setGreeting('斜阳西下，继续保持专注的学习状态吧 💻');
      else if (hour < 22) setGreeting('晚自习黄金时刻，理清思绪，专注当下 ⚡');
      else setGreeting('夜深了，学完这一节就早点休息吧 🛌');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auth Guard checking
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const isConfigured = isSupabaseConfigured();

      if (isConfigured) {
        // Try getting session from supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            isDemo: false
          });
          setIsDemo(false);
          setLoading(false);
          return;
        }
      }

      // Check if demo user is stored locally
      const storedDemo = localStorage.getItem('studyhub_demo_user');
      if (storedDemo) {
        const demoData = JSON.parse(storedDemo);
        setUser(demoData);
        setIsDemo(true);
        setLoading(false);
      } else {
        // No session or demo user, redirect to login page
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, supabaseActive]);

  // Load Database Data after Auth confirm
  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (user.isDemo) {
      // Load from LocalStorage
      const localTasks = JSON.parse(localStorage.getItem(`tasks_${user.id}`) || '[]');
      const localExams = JSON.parse(localStorage.getItem(`exams_${user.id}`) || '[]');
      const localNotes = JSON.parse(localStorage.getItem('notes_global') || '[]');
      
      setTasks(localTasks);
      setExams(localExams);
      setNotes(localNotes);
    } else {
      // Load from Supabase
      setTodoLoading(true);
      setExamLoading(true);
      setNoteLoading(true);
      try {
        // Tasks
        const { data: dbTasks, error: taskErr } = await supabase
          .from('study_tasks')
          .select('*')
          .order('created_at', { ascending: false });
        if (taskErr) throw taskErr;
        setTasks(dbTasks || []);

        // Exams
        const { data: dbExams, error: examErr } = await supabase
          .from('study_exams')
          .select('*')
          .order('exam_date', { ascending: true });
        if (examErr) throw examErr;
        setExams(dbExams || []);

        // Notes
        const { data: dbNotes, error: noteErr } = await supabase
          .from('study_notes')
          .select('*')
          .order('created_at', { descending: true });
        if (noteErr) throw noteErr;
        setNotes(dbNotes || []);
      } catch (err) {
        console.error('获取数据失败:', err);
      } finally {
        setTodoLoading(false);
        setExamLoading(false);
        setNoteLoading(false);
      }
    }
  };

  // Logout function
  const handleLogout = async () => {
    if (user && !user.isDemo) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('studyhub_demo_user');
    router.push('/login');
    router.refresh();
  };

  // --- TASK ACTIONS ---
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const newTask = {
      title: newTodoTitle.trim(),
      category: todoCategory,
      is_completed: false
    };

    if (user.isDemo) {
      const updated = [
        { id: Date.now(), created_at: new Date().toISOString(), user_id: user.id, ...newTask },
        ...tasks
      ];
      setTasks(updated);
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(updated));
      setNewTodoTitle('');
    } else {
      setTodoLoading(true);
      try {
        const { data, error } = await supabase
          .from('study_tasks')
          .insert({
            user_id: user.id,
            ...newTask
          })
          .select();
        if (error) throw error;
        setTasks([data[0], ...tasks]);
        setNewTodoTitle('');
      } catch (err) {
        alert('添加任务失败: ' + err.message);
      } finally {
        setTodoLoading(false);
      }
    }
  };

  const handleToggleTask = async (id, currentVal) => {
    if (user.isDemo) {
      const updated = tasks.map(t => t.id === id ? { ...t, is_completed: !currentVal } : t);
      setTasks(updated);
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(updated));
    } else {
      try {
        const { error } = await supabase
          .from('study_tasks')
          .update({ is_completed: !currentVal })
          .eq('id', id);
        if (error) throw error;
        setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !currentVal } : t));
      } catch (err) {
        alert('更新状态失败: ' + err.message);
      }
    }
  };

  const handleDeleteTask = async (id) => {
    if (user.isDemo) {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(updated));
    } else {
      try {
        const { error } = await supabase
          .from('study_tasks')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setTasks(tasks.filter(t => t.id !== id));
      } catch (err) {
        alert('删除任务失败: ' + err.message);
      }
    }
  };


  // --- TOMATO TIMER TIMER LOGIC ---
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerActive(false);
            
            // Switch modes or alarm
            if (timerMode === 'work') {
              alert('🍅 番茄钟任务结束！该休息5分钟啦。');
              setTimerMode('break');
              return 5 * 60;
            } else {
              alert('🎒 休息时间结束！继续专注25分钟。');
              setTimerMode('work');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive, timerMode]);

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(timerMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const getTimerPercentage = () => {
    const total = timerMode === 'work' ? 25 * 60 : 5 * 60;
    return (timeLeft / total) * 100;
  };


  // --- EXAM COUNTDOWN ACTIONS ---
  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newExamDate) return;

    const newExam = {
      subject: newSubject.trim(),
      exam_date: newExamDate
    };

    if (user.isDemo) {
      const updated = [
        { id: Date.now(), user_id: user.id, ...newExam },
        ...exams
      ].sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
      setExams(updated);
      localStorage.setItem(`exams_${user.id}`, JSON.stringify(updated));
      setNewSubject('');
      setNewExamDate('');
      setShowAddExam(false);
    } else {
      setExamLoading(true);
      try {
        const { data, error } = await supabase
          .from('study_exams')
          .insert({
            user_id: user.id,
            ...newExam
          })
          .select();
        if (error) throw error;
        setExams([...exams, data[0]].sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date)));
        setNewSubject('');
        setNewExamDate('');
        setShowAddExam(false);
      } catch (err) {
        alert('添加考试失败: ' + err.message);
      } finally {
        setExamLoading(false);
      }
    }
  };

  const handleDeleteExam = async (id) => {
    if (user.isDemo) {
      const updated = exams.filter(e => e.id !== id);
      setExams(updated);
      localStorage.setItem(`exams_${user.id}`, JSON.stringify(updated));
    } else {
      try {
        const { error } = await supabase
          .from('study_exams')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setExams(exams.filter(e => e.id !== id));
      } catch (err) {
        alert('删除考试失败: ' + err.message);
      }
    }
  };

  const getDaysRemaining = (targetDateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(targetDateStr);
    target.setHours(0,0,0,0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };


  // --- NOTES/BOARD ACTIONS ---
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || newNoteContent.length > 200) return;

    const notePayload = {
      content: newNoteContent.trim(),
      user_email: user.email
    };

    if (user.isDemo) {
      const updated = [
        { id: Date.now(), created_at: new Date().toISOString(), user_id: user.id, ...notePayload },
        ...notes
      ];
      setNotes(updated);
      localStorage.setItem('notes_global', JSON.stringify(updated));
      setNewNoteContent('');
    } else {
      setNoteLoading(true);
      try {
        const { data, error } = await supabase
          .from('study_notes')
          .insert({
            user_id: user.id,
            ...notePayload
          })
          .select();
        if (error) throw error;
        setNotes([data[0], ...notes]);
        setNewNoteContent('');
      } catch (err) {
        alert('发表心得失败: ' + err.message);
      } finally {
        setNoteLoading(false);
      }
    }
  };

  const handleDeleteNote = async (id) => {
    if (user.isDemo) {
      const updated = notes.filter(n => n.id !== id);
      setNotes(updated);
      localStorage.setItem('notes_global', JSON.stringify(updated));
    } else {
      try {
        const { error } = await supabase
          .from('study_notes')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setNotes(notes.filter(n => n.id !== id));
      } catch (err) {
        alert('删除心得失败: ' + err.message);
      }
    }
  };

  // Filter notes based on selection
  const filteredNotes = notes.filter(note => {
    if (communityTab === 'mine') {
      return note.user_id === user?.id || (user?.isDemo && note.user_email === user?.email);
    }
    return true;
  });

  const getCompletedTasksCount = () => tasks.filter(t => t.is_completed).length;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(168, 85, 247, 0.2)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          marginBottom: '1.5rem'
        }} />
        <h3 style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
          正在加载您的自习空间...
        </h3>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* HEADER SECTION */}
      <header className="glass-panel" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="flex-center" style={{
            width: '45px',
            height: '45px',
            background: 'var(--grad-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
          }}>
            <BookOpen size={22} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              StudyHub 
              {isDemo && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--color-secondary)',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  测试模式
                </span>
              )}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              学生: <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Clock */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.85rem',
            fontWeight: '800',
            letterSpacing: '0.05em',
            background: 'var(--grad-secondary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {timeStr}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {dateStr}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-light)'
          }}>
            <Sparkles size={16} color="var(--color-accent)" />
            <span>{greeting}</span>
          </div>

          <button 
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '0.6rem 1.2rem', gap: '0.4rem', fontSize: '0.9rem' }}
          >
            <LogOut size={16} />
            <span>退出</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD GRID CONTENT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Study Tasks, Tomato Timer, Countdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section: POMODORO & EXAMS in horizontal layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
          }}>
            {/* Tomato Timer Widget */}
            <div className="glass-panel pulse-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--color-primary)" />
                番茄钟 (Pomodoro)
              </h3>
              
              <div className="timer-container">
                <svg className="timer-svg">
                  <circle className="timer-circle-bg" cx="110" cy="110" r="95" />
                  <circle 
                    className="timer-circle-progress" 
                    cx="110" 
                    cy="110" 
                    r="95" 
                    stroke={timerMode === 'work' ? 'var(--color-primary)' : 'var(--color-success)'}
                    strokeDasharray="596.9"
                    strokeDashoffset={596.9 - (596.9 * getTimerPercentage()) / 100}
                  />
                </svg>
                <div className="timer-text-overlay">
                  <div className="timer-digits">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
                  <span className="timer-label" style={{
                    color: timerMode === 'work' ? 'var(--color-primary)' : 'var(--color-success)',
                    fontWeight: 'bold'
                  }}>
                    {timerMode === 'work' ? '专注时间' : '休息时间'}
                  </span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex-center" style={{ gap: '1rem' }}>
                <button 
                  onClick={toggleTimer}
                  className="btn-primary"
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    background: timerActive ? 'rgba(255, 255, 255, 0.05)' : 'var(--grad-primary)',
                    border: timerActive ? '1px solid var(--border-light)' : 'none',
                    boxShadow: timerActive ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.25)',
                    color: timerActive ? 'var(--text-primary)' : 'white'
                  }}
                >
                  {timerActive ? <Pause size={14} /> : <Play size={14} />}
                  <span>{timerActive ? '暂停' : '开始'}</span>
                </button>
                <button 
                  onClick={resetTimer}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <RotateCcw size={14} />
                  <span>重置</span>
                </button>
              </div>
            </div>

            {/* Exam Countdown Widget */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--color-secondary)" />
                  备考倒计时
                </h3>
                <button 
                  onClick={() => setShowAddExam(!showAddExam)}
                  className="btn-icon"
                  style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)' }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add Exam panel */}
              {showAddExam && (
                <form onSubmit={handleAddExam} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-light)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <input
                    type="text"
                    placeholder="科目 (如：操作系统)"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    required
                    className="input-field"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  />
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    required
                    className="input-field"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowAddExam(false)}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      取消
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto' }}
                    >
                      保存
                    </button>
                  </div>
                </form>
              )}

              {/* Countdown List */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                maxHeight: '170px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {examLoading ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>加载中...</p>
                ) : exams.length === 0 ? (
                  <div style={{
                    margin: 'auto',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    <Award size={24} style={{ opacity: 0.3, marginBottom: '0.25rem' }} />
                    <p style={{ fontSize: '0.8rem' }}>暂无考试倒计时，去新增一个吧</p>
                  </div>
                ) : (
                  exams.map(ex => {
                    const daysLeft = getDaysRemaining(ex.exam_date);
                    let badgeColor = 'rgba(16, 185, 129, 0.15)'; // green
                    let textColor = 'var(--color-success)';
                    if (daysLeft <= 3) {
                      badgeColor = 'rgba(239, 68, 68, 0.15)'; // red
                      textColor = 'var(--color-danger)';
                    } else if (daysLeft <= 7) {
                      badgeColor = 'rgba(245, 158, 11, 0.15)'; // orange
                      textColor = 'var(--color-primary)';
                    }

                    return (
                      <div key={ex.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.015)',
                        border: '1px solid var(--border-light)'
                      }}>
                        <div style={{ minWidth: 0, marginRight: '0.5rem' }}>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ex.subject}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ex.exam_date}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: badgeColor,
                            color: textColor,
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>
                            {daysLeft > 0 ? `${daysLeft} 天` : daysLeft === 0 ? '今天考试！' : '已结束'}
                          </span>
                          <button 
                            onClick={() => handleDeleteExam(ex.id)}
                            className="btn-danger-icon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Todo List Board */}
          <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={20} color="var(--color-primary)" />
                  今日待办看板 (Todo List)
                </h3>
                {tasks.length > 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    已完成 {getCompletedTasksCount()} / {tasks.length}
                  </p>
                )}
              </div>
              {tasks.length > 0 && (
                <div style={{
                  width: '100px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(getCompletedTasksCount() / tasks.length) * 100}%`,
                    height: '100%',
                    background: 'var(--grad-primary)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              )}
            </div>

            {/* Todo Input form */}
            <form onSubmit={handleAddTask} style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1.25rem'
            }}>
              <select 
                value={todoCategory}
                onChange={(e) => setTodoCategory(e.target.value)}
                className="input-field"
                style={{
                  width: '100px',
                  paddingRight: '0.5rem',
                  fontSize: '0.9rem',
                  background: 'var(--bg-input)'
                }}
              >
                <option value="学习">学习 📖</option>
                <option value="作业">作业 📝</option>
                <option value="备考">备考 ⚡</option>
                <option value="打卡">打卡 🏆</option>
                <option value="日常">日常 ☕</option>
              </select>
              <input
                type="text"
                placeholder="计划做什么学习内容..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="input-field"
                style={{ flex: 1 }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ padding: '0 1.25rem', height: '45px' }}
                disabled={todoLoading}
              >
                <Plus size={18} />
              </button>
            </form>

            {/* Todo List Scroll Area */}
            <div style={{ 
              maxHeight: '320px', 
              overflowY: 'auto', 
              paddingRight: '4px'
            }}>
              {todoLoading ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>任务加载中...</p>
              ) : tasks.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <CheckCircle2 size={36} style={{ opacity: 0.2, marginBottom: '0.5rem', display: 'inline-block' }} />
                  <p style={{ fontSize: '0.9rem' }}>今天还没有待办事项哦，开启你的自律一天吧！</p>
                </div>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className={`todo-item ${t.is_completed ? 'todo-completed' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <button 
                        onClick={() => handleToggleTask(t.id, t.is_completed)}
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        {t.is_completed ? (
                          <CheckCircle2 size={18} color="var(--color-success)" />
                        ) : (
                          <Circle size={18} color="var(--text-muted)" />
                        )}
                      </button>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-secondary)',
                        flexShrink: 0
                      }}>
                        {t.category}
                      </span>
                      <span className="todo-title-text" style={{ 
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        color: t.is_completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {t.title}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDeleteTask(t.id)}
                      className="btn-danger-icon"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Share Community Notes */}
        <div className="glass-panel" style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'stretch'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} color="var(--color-accent)" />
              共享笔记与留言社区
            </h3>

            {/* Community tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}>
              <button
                onClick={() => setCommunityTab('all')}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  background: communityTab === 'all' ? 'var(--grad-primary)' : 'transparent',
                  color: communityTab === 'all' ? 'white' : 'var(--text-secondary)'
                }}
              >
                全部留言
              </button>
              <button
                onClick={() => setCommunityTab('mine')}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  background: communityTab === 'mine' ? 'var(--grad-primary)' : 'transparent',
                  color: communityTab === 'mine' ? 'white' : 'var(--text-secondary)'
                }}
              >
                我的留言
              </button>
            </div>
          </div>

          {/* Form to submit study notes */}
          <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <textarea
                value={newNoteContent}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setNewNoteContent(e.target.value);
                  }
                }}
                className="input-field"
                placeholder="分享你的课堂笔记、考试资料链接或学习心得吧（限200字）..."
                rows={3}
                style={{
                  resize: 'none',
                  fontSize: '0.9rem',
                  paddingRight: '1rem'
                }}
                required
              />
              {/* Dynamic word count badge */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: newNoteContent.length >= 180 ? 'var(--color-danger)' : 'var(--text-muted)'
              }}>
                {newNoteContent.length}/200
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', gap: '0.5rem', height: '42px', fontSize: '0.9rem' }}
              disabled={noteLoading || !newNoteContent.trim()}
            >
              <Send size={15} />
              <span>发布分享</span>
            </button>
          </form>

          {/* Note List Scroll container */}
          <div className="note-board" style={{ flex: 1 }}>
            {noteLoading ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>留言同步中...</p>
            ) : filteredNotes.length === 0 ? (
              <div style={{
                padding: '4rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <MessageSquare size={36} style={{ opacity: 0.2, marginBottom: '0.5rem', display: 'inline-block' }} />
                <p style={{ fontSize: '0.9rem' }}>
                  {communityTab === 'mine' ? '你还没有发表过学习分享哦。' : '还没有同学留言，快来抢沙发！'}
                </p>
              </div>
            ) : (
              filteredNotes.map(n => {
                const isAuthor = n.user_id === user?.id || (user?.isDemo && n.user_email === user?.email);
                const showDeleteBtn = isAuthor;
                const formattedTime = new Date(n.created_at).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) + ' ' + new Date(n.created_at).toLocaleDateString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric'
                });

                return (
                  <div key={n.id} className="note-card">
                    <div className="note-header">
                      <span className="note-author">
                        🎓 {n.user_email.split('@')[0]}
                        {isAuthor && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>(我)</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="note-time">{formattedTime}</span>
                        {showDeleteBtn && (
                          <button 
                            onClick={() => handleDeleteNote(n.id)}
                            className="btn-danger-icon"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="note-content">{n.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
