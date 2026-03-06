import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "64px",
        height: "32px",
        borderRadius: "9999px",
        border: "1px solid hsl(var(--border))",
        backgroundColor: "hsl(var(--muted))",
        cursor: "pointer",
        transition: "all 0.4s ease",
        outline: "none",
      }}
      aria-label="Toggle theme"
    >
      <span
        style={{
          position: "absolute",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "var(--gradient-primary)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          left: dark ? "36px" : "4px",
          transition: "left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {dark
          ? <Moon style={{ width: "14px", height: "14px", color: "white" }} />
          : <Sun style={{ width: "14px", height: "14px", color: "white" }} />
        }
      </span>
    </button>
  );
};

export default ThemeToggle;