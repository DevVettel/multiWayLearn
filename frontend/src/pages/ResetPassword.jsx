import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Brain, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-destructive text-sm">Geçersiz şifre sıfırlama bağlantısı.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-500 px-4">

      <div className="fixed top-6 right-6 z-50 animate-fade-in">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md opacity-0 animate-fade-in-up">

        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-4 shadow-card">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display">
            MultiWay<span className="gradient-text">Learn</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm tracking-wide">Yeni şifre belirle</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-8">

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-foreground font-medium">Şifreniz başarıyla güncellendi!</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02]"
              >
                Giriş Yap
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-scale-in">
                  ⚠️ {error}
                </div>
              )}

              <div className="opacity-0 animate-fade-in-up stagger-1">
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:border-primary/50 pr-12"
                    placeholder="en az 6 karakter"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="opacity-0 animate-fade-in-up stagger-2">
                <label htmlFor="confirm" className="block text-sm font-medium mb-2 text-foreground">
                  Şifre Tekrar
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:border-primary/50"
                  placeholder="şifrenizi tekrar girin"
                  required
                />
              </div>

              <div className="opacity-0 animate-fade-in-up stagger-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-card-hover active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Güncelleniyor...
                    </span>
                  ) : 'Şifremi Güncelle'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground opacity-0 animate-fade-in-up stagger-4">
          <button
            onClick={() => navigate('/login')}
            className="text-primary font-semibold hover:underline underline-offset-4 transition-all duration-200"
          >
            Giriş sayfasına dön
          </button>
        </p>
      </div>
    </div>
  );
}
