import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Brain } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { login, register } from "../services/api";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await login({ email: form.email, password: form.password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.username);
        localStorage.setItem("userID", res.data.userID);
        navigate("/dashboard");
      } else {
        await register({ username: form.username, email: form.email, password: form.password });
        setIsLogin(true);
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

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
            {isLogin ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
          </p>
        </div>

        {/* Kart */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-8 transition-all duration-300">

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-scale-in">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="opacity-0 animate-fade-in-up stagger-1">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:border-primary/50"
                  placeholder="kullanıcı adınız"
                />
              </div>
            )}

            <div className={`opacity-0 animate-fade-in-up ${isLogin ? "stagger-1" : "stagger-2"}`}>
              <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:border-primary/50"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className={`opacity-0 animate-fade-in-up ${isLogin ? "stagger-2" : "stagger-3"}`}>
              <label className="block text-sm font-medium mb-2 text-foreground">Şifre</label>
              <div className="relative">
                <input
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

            <div className={`opacity-0 animate-fade-in-up ${isLogin ? "stagger-3" : "stagger-4"}`}>
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
                    {isLogin ? "Giriş yapılıyor..." : "Kaydediliyor..."}
                  </span>
                ) : isLogin ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground opacity-0 animate-fade-in-up stagger-5">
          {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-primary font-semibold hover:underline underline-offset-4 transition-all duration-200"
          >
            {isLogin ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </p>
      </div>
    </div>
  );
}