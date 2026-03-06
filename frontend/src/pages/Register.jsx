import { useState } from 'react';
import { register } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6E5] dark:bg-[#0a0f14] flex items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20 dark:opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #DDAED3, transparent)' }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 dark:opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #09637E, transparent)' }} />

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">

        <div className="text-center mb-10 opacity-0-init animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #DDAED3, #09637E)' }}>
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a2e35] dark:text-white">
            Hesap <span style={{ color: '#09637E' }}>Oluştur</span>
          </h1>
          <p className="text-[#4a7a8a] dark:text-slate-400 mt-2 text-sm font-medium">
            Öğrenme yolculuğuna başla
          </p>
        </div>

        <div className="opacity-0-init animate-fade-in-up delay-200 rounded-3xl p-8 shadow-xl border"
          style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(9,99,126,0.1)',
          }}>

          {error && (
            <div className="mb-5 p-4 rounded-2xl text-sm font-medium"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'Kullanıcı Adı', key: 'username', type: 'text', placeholder: 'kullaniciadi', delay: 'delay-300' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'ornek@email.com', delay: 'delay-400' },
              { label: 'Şifre', key: 'password', type: 'password', placeholder: '••••••••', delay: 'delay-500' },
            ].map((field) => (
              <div key={field.key} className={`opacity-0-init animate-fade-in-up ${field.delay}`}>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#4a7a8a] dark:text-slate-400">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full rounded-2xl px-4 py-3 text-[#1a2e35] dark:text-white placeholder-[#9abbc5] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#09637E] border"
                  style={{ backgroundColor: 'rgba(9,99,126,0.05)', borderColor: 'rgba(9,99,126,0.15)' }}
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-semibold text-white shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-60 opacity-0-init animate-fade-in-up delay-500"
              style={{
                background: 'linear-gradient(135deg, #09637E, #DDAED3)',
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Kaydediliyor...
                </span>
              ) : 'Kayıt Ol →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#09637E]/10 dark:border-slate-800 text-center">
            <p className="text-sm text-[#4a7a8a] dark:text-slate-400">
              Zaten hesabın var mı?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: '#09637E' }}>
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}