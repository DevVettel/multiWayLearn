import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Check, X } from 'lucide-react';
import { getSettings, updateDailyGoal } from '../services/api';

const PRESET_GOALS = [5, 10, 15, 20, 30, 50];

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings().then(res => {
      setSettings(res.data);
      setDailyGoal(res.data.DailyWordCount || 10);
    });
  }, []);

  const handleSave = async () => {
    console.log('Kaydedilen değer:', dailyGoal, typeof dailyGoal);
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateDailyGoal(Number(dailyGoal));
      setSuccess('Günlük hedef güncellendi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Hata:', err.response?.data);
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <header className="sticky top-0 z-40 border-b border-border"
        style={{ backgroundColor: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl border border-border hover:border-primary/50 transition-all">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold font-display">Ayarlar</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Kullanıcı Bilgisi */}
        {settings && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Hesap</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Kullanıcı Adı</span>
                <span className="font-semibold text-foreground">{settings.UserName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Email</span>
                <span className="font-semibold text-foreground">{settings.Email}</span>
              </div>
            </div>
          </div>
        )}

        {/* Günlük Hedef */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" /> Günlük Hedef
            </span>
          </h2>

          {/* Hazır seçenekler */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {PRESET_GOALS.map(goal => (
              <button
                key={goal}
                onClick={() => setDailyGoal(goal)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  dailyGoal === goal
                    ? 'gradient-bg text-white border-transparent scale-105'
                    : 'bg-muted border-border text-foreground hover:border-primary/50'
                }`}>
                {goal} kelime
              </button>
            ))}
          </div>

          {/* Manuel giriş */}
          <div className="flex items-center gap-3 mb-5">
            <input
              type="number"
              min="1"
              max="100"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <span className="text-muted-foreground text-sm whitespace-nowrap">kelime / gün</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 mb-4 text-sm">
              <X className="w-4 h-4" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-4 text-sm">
              <Check className="w-4 h-4" /> {success}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-bg text-white font-semibold transition-all hover:scale-[1.02] disabled:opacity-60">
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

      </main>
    </div>
  );
}