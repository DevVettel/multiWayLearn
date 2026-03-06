import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  Brain, BookOpen, BookMarked, Zap,
  Plus, FlaskConical, BarChart3, Gamepad2,
  Link2, Settings, LogOut, ArrowRight,
} from "lucide-react";

const stats = [
  { icon: BookOpen, value: 0, label: "Öğrenilen", color: "text-rose-400" },
  { icon: BookMarked, value: 0, label: "Devam Eden", color: "text-primary" },
  { icon: Zap, value: 10, label: "Günlük Hedef", color: "text-amber-400" },
];

const features = [
  { icon: Plus, title: "Kelime Ekle", desc: "Yeni kelimeler öğren", path: "/words", color: "from-emerald-500 to-teal-600" },
  { icon: FlaskConical, title: "Teste Başla", desc: "6 Sefer algoritması", path: "/quiz", color: "from-violet-500 to-purple-600" },
  { icon: BarChart3, title: "Analiz", desc: "İlerleme raporun", path: "/analysis", color: "from-blue-500 to-cyan-600" },
  { icon: Gamepad2, title: "Wordle", desc: "Kelime oyunu", path: "/wordle", color: "from-rose-500 to-pink-600" },
  { icon: Link2, title: "Word Chain", desc: "LLM hikaye üret", path: "/wordchain", color: "from-orange-500 to-amber-600" },
  { icon: Settings, title: "Ayarlar", desc: "Hesap tercihlerin", path: "/settings", color: "from-slate-500 to-gray-600" },
];

function Dashboard() {
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">

      <header className="sticky top-0 z-40 border-b border-border"
        style={{
          backgroundColor: "hsl(var(--background) / 0.85)",
          backdropFilter: "blur(20px)",
          transition: "background-color 0.5s ease",
        }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-0 animate-fade-in-up">
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
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
                Hoş geldin,{" "}
                <span className="font-semibold text-foreground">{username}</span> 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 opacity-0 animate-fade-in stagger-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-300 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`opacity-0 animate-fade-in-up stagger-${i + 1} bg-card rounded-2xl border border-border p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] group`}
            >
              <stat.icon className={`w-8 h-8 mb-3 ${stat.color} transition-transform duration-300 group-hover:scale-110`} />
              <p className="text-3xl font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              onClick={() => navigate(feature.path)}
              className={`opacity-0 animate-fade-in-up stagger-${i + 4} bg-card rounded-2xl border border-border p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] group cursor-pointer`}
            >
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
      </main>
    </div>
  );
}

export default Dashboard;