import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Brain } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { login, register, forgotPassword } from "../services/api";

function getSubtitle(view) {
  if (view === "login") return "Hesabına giriş yap";
  if (view === "register") return "Yeni hesap oluştur";
  return "Şifre sıfırlama";
}

function FooterLink({ view, switchView }) {
  if (view === "forgot") {
    return (
      <>
        Şifreni hatırladın mı?{" "}
        <button
          onClick={() => switchView("login")}
          className="text-primary font-semibold hover:underline underline-offset-4 transition-all duration-200"
        >
          Giriş Yap
        </button>
      </>
    );
  }
  if (view === "login") {
    return (
      <>
        Hesabın yok mu?{" "}
        <button
          onClick={() => switchView("register")}
          className="text-primary font-semibold hover:underline underline-offset-4 transition-all duration-200"
        >
          Kayıt Ol
        </button>
      </>
    );
  }
  return (
    <>
      Zaten hesabın var mı?{" "}
      <button
        onClick={() => switchView("login")}
        className="text-primary font-semibold hover:underline underline-offset-4 transition-all duration-200"
      >
        Giriş Yap
      </button>
    </>
  );
}

// view: 'login' | 'register' | 'forgot'
export default function Login() {
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const switchView = (next) => {
    setView(next);
    setError("");
    setSuccess("");
  };

  const handleLogin = async () => {
    const res = await login({ email: form.email, password: form.password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("username", res.data.username);
    localStorage.setItem("userID", res.data.userID);
    navigate("/dashboard");
  };

  const handleRegister = async () => {
    await register({ username: form.username, email: form.email, password: form.password });
    switchView("login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (view === "login") {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = view === "login" ? "Giriş Yap" : "Kayıt Ol";
  const loadingLabel = view === "login" ? "Giriş yapılıyor..." : "Kaydediliyor...";
  const emailStagger = view === "login" ? "stagger-1" : "stagger-2";
  const passwordStagger = view === "login" ? "stagger-2" : "stagger-3";
  const submitStagger = view === "login" ? "stagger-3" : "stagger-4";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-500 px-4">

      <div className="fixed top-6 right-6 z-50 animate-fade-in">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md opacity-0 animate-fade-in-up">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-4 shadow-card transition-transform duration-300 hover:scale-110">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display">
            MultiWay<span className="gradient-text">Learn</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm tracking-wide">
            {getSubtitle(view)}
          </p>
        </div>

        {/* Kart */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-8 transition-all duration-300">

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-scale-in">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm border border-emerald-500/20 animate-scale-in">
              ✓ {success}
            </div>
          )}

          {view === "forgot" ? (
            <form onSubmit={handleForgot} className="space-y-5">
              <div className="opacity-0 animate-fade-in-up stagger-1">
                <label htmlFor="forgot-email" className="block text-sm font-medium mb-2 text-foreground">
                  Email Adresi
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:border-primary/50"
                  placeholder="kayıtlı email adresiniz"
                  required
                />
              </div>
              <div className="opacity-0 animate-fade-in-up stagger-2">
                <button
                  type="submit"
                  disabled={loading || !!success}
                  className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-card-hover active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Kontrol ediliyor...
                    </span>
                  ) : "Sıfırla"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {view === "register" && (
                <div className="opacity-0 animate-fade-in-up stagger-1">
                  <label htmlFor="username" className="block text-sm font-medium mb-2 text-foreground">
                    Kullanıcı Adı
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:border-primary/50"
                    placeholder="kullanıcı adınız"
                  />
                </div>
              )}

              <div className={`opacity-0 animate-fade-in-up ${emailStagger}`}>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:border-primary/50"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className={`opacity-0 animate-fade-in-up ${passwordStagger}`}>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">Şifre</label>
                  {view === "login" && (
                    <button
                      type="button"
                      onClick={() => switchView("forgot")}
                      className="text-xs text-primary hover:underline underline-offset-4 transition-all duration-200"
                    >
                      Şifremi unuttum?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:border-primary/50 pr-12"
                    placeholder="••••••••"
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

              <div className={`opacity-0 animate-fade-in-up ${submitStagger}`}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-card-hover active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {loadingLabel}
                    </span>
                  ) : buttonLabel}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground opacity-0 animate-fade-in-up stagger-5">
          <FooterLink view={view} switchView={switchView} />
        </p>
      </div>
    </div>
  );
}
