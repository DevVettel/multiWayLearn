import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Brain, CheckCircle, XCircle, Trophy, Target } from 'lucide-react';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001/api' });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const STREAK_LABELS = ['', '1. Gün', '1. Hafta', '1. Ay', '3. Ay', '6. Ay', '1. Yıl ✓'];

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeLevels = location.state?.activeLevels || JSON.parse(localStorage.getItem('activeLevels') || '["A1"]');
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [finishReason, setFinishReason] = useState('');
  const [dailyGoal, setDailyGoal] = useState(10);
  const [todayCount, setTodayCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, learned: 0 });
  const [skippedIDs, setSkippedIDs] = useState([]);

  useEffect(() => { fetchNext([]); }, []);

  const fetchNext = async (currentSkipped = skippedIDs) => {
    setLoading(true);
    setSelected(null);
    setResult(null);
    try {
      const params = new URLSearchParams();
      if (currentSkipped.length > 0) params.append('skipped', currentSkipped.join(','));
      params.append('levels', activeLevels.join(','));

      const res = await API.get(`/quiz/next?${params.toString()}`);
      if (res.data.finished) {
        setFinishReason(res.data.reason || 'daily_goal');
        setDailyGoal(res.data.dailyGoal || 10);
        setTodayCount(res.data.todayCount || 0);
        setFinished(true);
      } else {
        setQuestion(res.data.word);
        setOptions(res.data.options);
        setDailyGoal(res.data.dailyGoal);
        setTodayCount(res.data.todayCount);
      }
    } catch {
      setFinished(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (option) => {
    if (selected) return;
    setSelected(option);
    try {
      const res = await API.post('/quiz/answer', {
        systemWordID: question.systemWordID,
        correct: option.correct
      });
      setResult(res.data);
      // Backend'den gelen güncel sayıları kullan
      if (res.data.todayCount !== undefined) setTodayCount(res.data.todayCount);
      if (res.data.dailyGoal !== undefined) setDailyGoal(res.data.dailyGoal);
      setSessionStats(prev => ({
        correct: prev.correct + (option.correct ? 1 : 0),
        wrong: prev.wrong + (option.correct ? 0 : 1),
        learned: prev.learned + (res.data.isLearned ? 1 : 0),
      }));
      if (!option.correct) {
        setSkippedIDs(prev => [...prev, question.systemWordID]);
      }
    } catch {
      setResult({ correct: option.correct, message: 'Hata oluştu' });
    }
  };

  const handleNext = () => {
    const newSkipped = !result?.correct
      ? [...skippedIDs, question.systemWordID]
      : skippedIDs;
    setSkippedIDs(newSkipped);
    fetchNext(newSkipped);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Brain className="w-12 h-12 text-primary mx-auto animate-pulse" />
    </div>
  );

  if (finished) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-display mb-2">
          {finishReason === 'daily_goal' ? 'Günlük Hedefe Ulaşıldı!' : 'Harika iş!'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {finishReason === 'daily_goal'
            ? `Bugün ${todayCount} kelime çalıştın. Yarın devam et!`
            : 'Tüm kelimeler tamamlandı.'}
        </p>

        {/* Günlük ilerleme */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" /> Günlük Hedef
            </span>
            <span className="font-semibold text-foreground">{todayCount}/{dailyGoal}</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
              style={{ width: `${Math.min((todayCount / dailyGoal) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-2xl font-bold text-emerald-500">{sessionStats.correct}</p>
            <p className="text-xs text-muted-foreground mt-1">Doğru</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-2xl font-bold text-destructive">{sessionStats.wrong}</p>
            <p className="text-xs text-muted-foreground mt-1">Yanlış</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-2xl font-bold text-amber-400">{sessionStats.learned}</p>
            <p className="text-xs text-muted-foreground mt-1">Öğrenildi</p>
          </div>
        </div>

        <button onClick={() => navigate('/dashboard')}
          className="w-full py-3 rounded-xl gradient-bg text-white font-semibold transition-all hover:scale-[1.02]">
          Dashboard'a Dön
        </button>
      </div>
    </div>
  );

  const progressPercent = dailyGoal > 0 ? Math.min((todayCount / dailyGoal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border"
        style={{ backgroundColor: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl border border-border hover:border-primary/50 transition-all">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <h1 className="text-lg font-bold font-display">6 Sefer Quiz</h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-emerald-500 font-semibold">✓ {sessionStats.correct}</span>
              <span className="text-destructive font-semibold">✗ {sessionStats.wrong}</span>
              {sessionStats.learned > 0 && (
                <span className="text-amber-400 font-semibold">🏆 {sessionStats.learned}</span>
              )}
            </div>
          </div>

          {/* Günlük ilerleme çubuğu */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              <span className="text-foreground font-semibold">{todayCount}</span>/{dailyGoal} bugün
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {question && (
          <div className="space-y-6 animate-fade-in-up">

            {/* Seviye + Seri */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                {question.level}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i <= question.correctStreak
                      ? 'bg-emerald-500 text-white scale-110'
                      : 'bg-muted text-muted-foreground'
                      }`}>
                    {i}
                  </div>
                ))}
              </div>
            </div>

            {/* Soru */}
            <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-card">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                Bu kelimenin Türkçesi nedir?
              </p>
              <h2 className="text-5xl font-bold font-display text-foreground mb-3">
                {question.engWord}
              </h2>
              {question.correctStreak > 0 && (
                <p className="text-xs text-muted-foreground">
                  Sonraki tekrar: <span className="text-primary font-medium">
                    {STREAK_LABELS[question.correctStreak + 1] || '✓'}
                  </span>
                </p>
              )}
            </div>

            {/* Şıklar */}
            <div className="grid grid-cols-2 gap-3">
              {options.map((option, i) => {
                let style = 'bg-card border-border hover:border-primary/50 hover:scale-[1.02] cursor-pointer';
                if (selected) {
                  if (option.correct) style = 'bg-emerald-500/10 border-emerald-500 scale-[1.02]';
                  else if (selected === option) style = 'bg-destructive/10 border-destructive';
                  else style = 'bg-card border-border opacity-50';
                }
                return (
                  <button key={i} onClick={() => handleAnswer(option)}
                    className={`rounded-2xl border p-5 text-left transition-all duration-200 ${style}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{option.text}</span>
                      {selected && option.correct && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      {selected && selected === option && !option.correct && <XCircle className="w-5 h-5 text-destructive" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sonuç + Devam */}
            {result && (
              <div className="animate-fade-in-up">
                <div className={`p-4 rounded-xl border mb-4 text-center font-semibold ${result.correct
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
                  }`}>
                  {result.message}
                </div>
                {result.dailyGoalReached ? (
                  <button onClick={() => {
                    setTodayCount(result.todayCount);
                    setDailyGoal(result.dailyGoal);
                    setFinishReason('daily_goal');
                    setFinished(true);
                  }}
                    className="w-full py-4 rounded-xl gradient-bg text-white font-semibold text-lg transition-all hover:scale-[1.02]">
                    Sonuçları Gör
                  </button>
                ) : (
                  <button onClick={handleNext}
                    className="w-full py-4 rounded-xl gradient-bg text-white font-semibold text-lg transition-all hover:scale-[1.02]">
                    Sonraki Kelime
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}