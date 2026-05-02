import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, TrendingUp, BookOpen, Printer } from 'lucide-react';
import { getAnalysis } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const levelColors = {
  A1: { bar: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  A2: { bar: 'from-amber-500 to-yellow-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  B1: { bar: 'from-blue-500 to-cyan-500', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
};

const DONUT_COLORS = [
  { label: 'Öğrenilen', color: '#10b981' },
  { label: 'Devam Eden', color: '#f59e0b' },
  { label: 'Başlanmamış', color: '#6b7280' },
];

const STREAK_LABELS = ['Yeni', '1. Gün', '1. Hafta', '1. Ay', '3. Ay', '6. Ay'];

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function Analysis() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalysis()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Veri yüklenemedi.</p>
    </div>
  );

  const { general, levels, streakDist, weeklyActivity, systemTotals } = data;
  const totalCorrect = general.totalCorrect || 0;
  const totalWrong = general.totalWrong || 0;
  const totalAnswered = totalCorrect + totalWrong;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const last7Days = getLast7Days();
  const activityMap = Object.fromEntries(weeklyActivity.map(a => [a.date, a.count]));
  const maxActivity = Math.max(...last7Days.map(d => activityMap[d] || 0), 1);
  const systemTotalMap = Object.fromEntries(systemTotals.map(s => [s.Level, s.total]));

  const systemTotalAll = systemTotals.reduce((sum, s) => sum + s.total, 0);
  const learnedCount = general.totalLearned || 0;
  const inProgressCount = Math.max(0, (general.totalInProgress || 0) - learnedCount);
  const notStartedCount = Math.max(0, systemTotalAll - (general.totalInProgress || 0));
  const learnedPercent = systemTotalAll > 0 ? Math.round((learnedCount / systemTotalAll) * 100) : 0;
  const donutData = [
    { name: 'Öğrenilen', value: learnedCount },
    { name: 'Devam Eden', value: inProgressCount },
    { name: 'Başlanmamış', value: notStartedCount },
  ].filter(d => d.value > 0);
  const donutLegend = [
    { label: 'Öğrenilen', value: learnedCount, color: DONUT_COLORS[0].color },
    { label: 'Devam Eden', value: inProgressCount, color: DONUT_COLORS[1].color },
    { label: 'Başlanmamış', value: notStartedCount, color: DONUT_COLORS[2].color },
  ];

  return (
    <div className="min-h-screen bg-background">

      <header className="sticky top-0 z-40 border-b border-border print:hidden"
        style={{ backgroundColor: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl border border-border hover:border-primary/50 transition-all print:hidden">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold font-display">Analiz Raporu</h1>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all print:hidden">
            <Printer className="w-4 h-4" /> Yazdır
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Genel İstatistikler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Trophy, label: 'Öğrenilen', value: general.totalLearned || 0, color: 'text-amber-400' },
            { icon: BookOpen, label: 'Devam Eden', value: general.totalInProgress || 0, color: 'text-primary' },
            { icon: Target, label: 'Doğruluk', value: `%${accuracy}`, color: 'text-emerald-500' },
            { icon: TrendingUp, label: 'Toplam Cevap', value: totalAnswered, color: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5 shadow-card text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Genel Durum Donut Chart */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-5">
            Genel Durum
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData.length > 0 ? donutData : [{ name: 'Veri yok', value: 1 }]}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={76}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {(donutData.length > 0 ? donutData : [{ name: 'Veri yok', value: 1 }]).map((entry, index) => (
                      <Cell
                        key={index}
                        fill={donutData.length > 0 ? DONUT_COLORS[['Öğrenilen','Devam Eden','Başlanmamış'].indexOf(entry.name)]?.color ?? '#6b7280' : '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} kelime`, name]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                      fontSize: '13px',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    cursor={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-foreground">%{learnedPercent}</span>
                <span className="text-xs text-muted-foreground">tamamlandı</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 flex-1 w-full">
              {donutLegend.map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="text-sm font-semibold text-foreground">{item.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: systemTotalAll > 0 ? `${Math.round((item.value / systemTotalAll) * 100)}%` : '0%',
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Toplam hedef: {systemTotalAll} kelime</p>
            </div>
          </div>
        </div>

        {/* Seviye Bazlı Başarı */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Seviye Bazlı İlerleme
          </h2>
          {['A1', 'A2', 'B1'].map(level => {
            const levelData = levels.find(l => l.Level === level);
            const systemTotal = systemTotalMap[level] || 0;
            const learned = levelData?.learned || 0;
            const correct = levelData?.correct || 0;
            const wrong = levelData?.wrong || 0;
            const answered = correct + wrong;
            const levelAccuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
            const percent = systemTotal > 0 ? Math.round((learned / systemTotal) * 100) : 0;
            const colors = levelColors[level];

            return (
              <div key={level} className="mb-5 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${colors.badge}`}>
                      {level}
                    </span>
                    <span className="text-sm text-foreground font-medium">
                      {learned} / {systemTotal} öğrenildi
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-emerald-500">✓ {correct}</span>
                    <span className="text-destructive">✗ {wrong}</span>
                    <span className="font-semibold text-foreground">%{levelAccuracy} doğruluk</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">%{percent} tamamlandı</p>
              </div>
            );
          })}
        </div>

        {/* Kelime Aşama Dağılımı */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Kelime Aşama Dağılımı
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5].map(streak => {
              const item = streakDist.find(s => s.streak === streak);
              const count = item?.count || 0;
              return (
                <div key={streak} className="text-center bg-muted rounded-xl p-3">
                  <p className="text-lg font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{STREAK_LABELS[streak]}</p>
                  <div className="flex justify-center gap-0.5 mt-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i <= streak ? 'bg-emerald-500' : 'bg-border'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs text-muted-foreground">
              Öğrenilmiş: <span className="text-amber-400 font-semibold">{general.totalLearned || 0} kelime</span>
            </span>
          </div>
        </div>

        {/* Son 7 Gün Aktivite */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Son 7 Gün Aktivite
          </h2>
          <div className="flex items-end gap-2 h-28">
            {last7Days.map(date => {
              const count = activityMap[date] || 0;
              const heightPercent = Math.round((count / maxActivity) * 100);
              const dayName = new Date(date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'short' });
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground h-4">{count > 0 ? count : ''}</span>
                  <div className="w-full flex items-end" style={{ height: '64px' }}>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/50 transition-all duration-700"
                      style={{ height: `${heightPercent}%`, minHeight: count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}