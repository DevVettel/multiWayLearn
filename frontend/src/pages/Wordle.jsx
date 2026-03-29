import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001/api' });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','DEL'],
];

const TILE_COLORS = {
  correct: 'bg-emerald-500 border-emerald-500 text-white',
  present: 'bg-amber-500 border-amber-500 text-white',
  absent: 'bg-muted border-muted text-muted-foreground',
  empty: 'bg-transparent border-border text-foreground',
  active: 'bg-transparent border-primary text-foreground',
};

const KEY_COLORS = {
  correct: 'bg-emerald-500 text-white',
  present: 'bg-amber-500 text-white',
  absent: 'bg-muted text-muted-foreground',
  default: 'bg-card border border-border text-foreground hover:border-primary/50',
};

export default function Wordle() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeLevels = location.state?.activeLevels ||
    JSON.parse(localStorage.getItem('activeLevels') || '["A1"]');

  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [wordInfo, setWordInfo] = useState(null);
  const [letterStates, setLetterStates] = useState({});
  const [targetWord, setTargetWord] = useState('');

  const MAX_GUESSES = 6;
  const WORD_LENGTH = 5;

  const fetchWord = () => {
    const levelsParam = activeLevels.join(',');
    API.get(`/wordle/word?levels=${levelsParam}`)
      .then(res => {
        setTargetWord(res.data.word);
        setWordInfo(res.data);
        setGuesses([]);
        setCurrentGuess('');
        setGameOver(false);
        setWon(false);
        setError('');
        setLetterStates({});
      })
      .catch(() => setError('Kelime yüklenemedi'));
  };

  useEffect(() => { fetchWord(); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      const key = e.key.toUpperCase();
      if (key === 'ENTER') handleSubmit();
      else if (key === 'BACKSPACE') handleDelete();
      else if (/^[A-Z]$/.test(key)) handleLetter(key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, targetWord]);

  const handleLetter = (letter) => {
    if (currentGuess.length < WORD_LENGTH && !gameOver) {
      setCurrentGuess(prev => prev + letter);
      setError('');
    }
  };

  const handleDelete = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (currentGuess.length !== WORD_LENGTH) {
      setError('Kelime 5 harfli olmalı!');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      const res = await API.post('/wordle/guess', {
        guess: currentGuess,
        target: targetWord,
      });

      const { result, isWon } = res.data;
      const newGuess = { guess: currentGuess, result };
      const newGuesses = [...guesses, newGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      // Klavye renklerini güncelle
      const newLetterStates = { ...letterStates };
      currentGuess.split('').forEach((letter, i) => {
        const current = newLetterStates[letter];
        const next = result[i];
        if (current === 'correct') return;
        if (current === 'present' && next !== 'correct') return;
        newLetterStates[letter] = next;
      });
      setLetterStates(newLetterStates);

      if (isWon) {
        setWon(true);
        setGameOver(true);
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
      }
    } catch {
      setError('Bir hata oluştu');
    }
  };

  const rows = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      rows.push({ type: 'done', data: guesses[i] });
    } else if (i === guesses.length && !gameOver) {
      rows.push({ type: 'current', data: currentGuess });
    } else {
      rows.push({ type: 'empty', data: '' });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="border-b border-border"
        style={{ backgroundColor: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl border border-border hover:border-primary/50 transition-all">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold font-display">Wordle</h1>
            {wordInfo && (
              <p className="text-xs text-muted-foreground">
                {wordInfo.activeLevels.join('+')} · {wordInfo.totalWords} kelime
              </p>
            )}
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Hata mesajı */}
      {error && (
        <div className="max-w-lg mx-auto px-6 pt-3 w-full">
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {/* Oyun bitti mesajı */}
      {gameOver && (
        <div className="max-w-lg mx-auto px-6 pt-3 w-full">
          <div className={`p-4 rounded-xl border text-center ${
            won
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            <p className="font-bold text-lg">{won ? 'You are so cooked!' : 'loserrrr'}</p>
            <p className="text-sm mt-1">
              {won
                ? `${guesses.length} denemede buldun!`
                : `Doğru kelime: ${targetWord}`}
            </p>
            <div className="flex gap-3 mt-3 justify-center">
              <button
                onClick={fetchWord}
                className="px-6 py-2 rounded-xl gradient-bg text-white text-sm font-semibold transition-all hover:scale-[1.02]">
                Yeniden Oyna 🔄
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
                Görev başarili asker üsse dön o7.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Izgara */}
      <div className="flex-1 flex items-center justify-center py-6">
        <div className="flex flex-col gap-2">
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={`flex gap-2 ${row.type === 'current' && shake ? 'animate-bounce' : ''}`}>
              {Array(WORD_LENGTH).fill(null).map((_, colIdx) => {
                let letter = '';
                let colorClass = TILE_COLORS.empty;

                if (row.type === 'done') {
                  letter = row.data.guess[colIdx] || '';
                  colorClass = TILE_COLORS[row.data.result[colIdx]] || TILE_COLORS.empty;
                } else if (row.type === 'current') {
                  letter = row.data[colIdx] || '';
                  colorClass = letter ? TILE_COLORS.active : TILE_COLORS.empty;
                }

                return (
                  <div
                    key={colIdx}
                    className={`w-14 h-14 border-2 rounded-2xl flex items-center justify-center text-xl font-bold font-display transition-all duration-300 ${colorClass}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Klavye */}
      <div className="pb-8 px-4 max-w-lg mx-auto w-full">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5 mb-1.5">
            {row.map(key => {
              const isSpecial = key === 'ENTER' || key === 'DEL';
              const state = letterStates[key];
              const colorClass = state ? KEY_COLORS[state] : KEY_COLORS.default;

              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'ENTER') handleSubmit();
                    else if (key === 'DEL') handleDelete();
                    else handleLetter(key);
                  }}
                  className={`${isSpecial ? 'px-3 text-xs' : 'w-9'} h-14 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 ${colorClass}`}>
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
}