import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getLevelProgress, getSettings } from "../services/api";
import {
  Brain, BookOpen, BookMarked, Zap,
  Plus, FlaskConical, BarChart3, Gamepad2,
  Link2, Settings, LogOut, ArrowRight, Lock, Unlock
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

const features = [
  { icon: Plus, title: "Kelime Ekle", desc: "Yeni kelimeler öğren", path: "/words", color: "from-emerald-500 to-teal-600" },
  { icon: FlaskConical, title: "Teste Başla", desc: "6 Sefer algoritması", path: "/quiz", color: "from-violet-500 to-purple-600" },
  { icon: BarChart3, title: "Analiz", desc: "İlerleme raporun", path: "/analysis", color: "from-blue-500 to-cyan-600" },
  { icon: Gamepad2, title: "Wordle", desc: "Kelime oyunu", path: "/wordle", color: "from-rose-500 to-pink-600" },
  { icon: Link2, title: "Word Chain", desc: "LLM hikaye üret", path: "/wordchain", color: "from-orange-500 to-amber-600" },
  { icon: Settings, title: "Ayarlar", desc: "Hesap tercihlerin", path: "/settings", color: "from-slate-500 to-gray-600" },
];

const levelColors = {
  A1: { bar: "from-emerald-500 to-teal-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  A2: { bar: "from-blue-500 to-cyan-500", badge: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  B1: { bar: "from-violet-500 to-purple-500", badge: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
};

function LevelCard({ data, index, isActive, onToggle }) {
  const colors = levelColors[data.level];

  return (
    <div className={`opacity-0 animate-fade-in-up stagger-${index + 1} bg-card rounded-2xl border p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] ${isActive ? 'border-primary/50' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${colors.badge}`}>
            {data.level}
          </span>
          <span className="text-xs text-muted-foreground">{data.learned} / {data.unlockThreshold} öğrenildi</span>
        </div>
        {/* Toggle butonu */}
        <button
          onClick={() => onToggle(data.level)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            isActive
              ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
              : 'bg-muted text-muted-foreground border border-border hover:border-primary/30 hover:text-primary'
          }`}>
          {isActive ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {isActive ? 'Aktif' : 'Aktif Et'}
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>İlerleme</span>
          <span>%{data.percentage}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`}
            style={{ width: `${data.percentage}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Toplam: {data.total} kelime</span>
        <span>Devam eden: {data.inProgress}</span>
      </div>

      {data.learned < data.unlockThreshold && isActive && (
        <p className="text-xs text-muted-foreground mt-2">
          Otomatik kilit için <span className="text-primary font-semibold">{data.unlockThreshold - data.learned} kelime</span> daha öğren
        </p>
      )}
      {data.learned >= data.unlockThreshold && (
        <p className="text-xs text-emerald-500 mt-2 font-semibold">✓ Sonraki seviye açıldı!</p>
      )}
    </div>
  );
}

LevelCard.propTypes = {
  data: PropTypes.shape({
    level: PropTypes.string.isRequired,
    learned: PropTypes.number.isRequired,
    unlockThreshold: PropTypes.number.isRequired,
    percentage: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    inProgress: PropTypes.number.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

function Dashboard() {
  const username = localStorage.getItem("username");
  const navigate = useNavigate();
  const [levelProgress, setLevelProgress] = useState([]);
  const [totalLearned, setTotalLearned] = useState(0);
  const [totalInProgress, setTotalInProgress] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [activeLevels, setActiveLevels] = useState(() => {
    const saved = localStorage.getItem('activeLevels');
    return saved ? JSON.parse(saved) : ['A1'];
  });

  useEffect(() => {
    getLevelProgress()
      .then(res => {
        setLevelProgress(res.data);
        setTotalLearned(res.data.reduce((sum, l) => sum + l.learned, 0));
        setTotalInProgress(res.data.reduce((sum, l) => sum + l.inProgress, 0));
      })
      .catch(() => {});

    getSettings()
      .then(res => setDailyGoal(res.data.DailyWordCount || 10))
      .catch(() => {});
  }, []);

  const handleLevelToggle = (level) => {
    setActiveLevels(prev => {
      const newLevels = prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level];
      // En az bir seviye aktif olmalı
      if (newLevels.length === 0) return prev;
      localStorage.setItem('activeLevels', JSON.stringify(newLevels));
      return newLevels;
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const stats = [
    { icon: BookOpen, value: totalLearned, label: "Öğrenilen", color: "text-rose-400" },
    { icon: BookMarked, value: totalInProgress, label: "Devam Eden", color: "text-primary" },
    { icon: Zap, value: dailyGoal, label: "Günlük Hedef", color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">

      <header className="sticky top-0 z-40 border-b border-border"
        style={{
          backgroundColor: "hsl(var(--background) / 0.85)",
          backdropFilter: "blur(20px)",
        }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-0 animate-fade-in-up">
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px hsl(var(--primary) / 0.3)",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display">
                MultiWay<span className="gradient-text">Learn</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Hoş geldin, <span className="font-semibold text-foreground">{username}</span> 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 opacity-0 animate-fade-in stagger-1">
            <ThemeToggle />
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <LogOut className="w-4 h-4" /> Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* İstatistik kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div key={stat.label}
              onClick={() => stat.label === 'Günlük Hedef' && navigate('/settings')}
              className={`opacity-0 animate-fade-in-up stagger-${i + 1} bg-card rounded-2xl border border-border p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] group ${stat.label === 'Günlük Hedef' ? 'cursor-pointer hover:border-primary/50' : ''}`}>
              <stat.icon className={`w-8 h-8 mb-3 ${stat.color} transition-transform duration-300 group-hover:scale-110`} />
              <p className="text-3xl font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Seviye ilerleme kartları */}
        {levelProgress.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Seviye İlerlemesi</h2>
              <p className="text-xs text-muted-foreground">
                Aktif: <span className="text-primary font-semibold">{activeLevels.join(', ')}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {levelProgress.map((level, i) => (
                <LevelCard
                  key={level.level}
                  data={level}
                  index={i}
                  isActive={activeLevels.includes(level.level)}
                  onToggle={handleLevelToggle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Modül kartları */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Modüller</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div key={feature.title}
                onClick={() => {
                  if (feature.path === '/quiz') {
                    navigate('/quiz', { state: { activeLevels } });
                  } else {
                    navigate(feature.path);
                  }
                }}
                className={`opacity-0 animate-fade-in-up stagger-${i + 4} bg-card rounded-2xl border border-border p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] group cursor-pointer`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold font-display text-foreground text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary transition-all duration-300 group-hover:gap-2">
                  Aç <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;