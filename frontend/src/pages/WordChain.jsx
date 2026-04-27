import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Sparkles, BookOpen } from 'lucide-react';
import axios from 'axios';

const getSafeImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (!/^\/uploads\/story_\d+_\d+\.png$/.test(imagePath)) return null;
    return `http://localhost:3001${imagePath}`;
};

const API = axios.create({ baseURL: 'http://localhost:3001/api' });
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default function WordChain() {
    const navigate = useNavigate();
    const [availableWords, setAvailableWords] = useState([]);
    const [selectedWords, setSelectedWords] = useState([]);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [tab, setTab] = useState('create'); // 'create' | 'history'

    useEffect(() => {
        fetchWords();
        fetchStories();
    }, []);

    const fetchWords = async () => {
        try {
            const activeLevels = JSON.parse(localStorage.getItem('activeLevels') || '["A1"]');
            const allWords = [];
            for (const level of activeLevels) {
                const res = await API.get(`/wordchain/words?level=${level}`);
                allWords.push(...res.data);
            }
            const shuffled = allWords.sort(() => Math.random() - 0.5);
            setAvailableWords(shuffled);
        } catch {
            setError('Kelimeler yüklenemedi');
        }
    };

    const fetchStories = async () => {
        try {
            const res = await API.get('/wordchain/stories');
            setStories(res.data);
        } catch {
            console.log('Hikayeler yüklenemedi');
        }
    };

    // Zincir kuralı kontrolü
    const isValidNext = (word) => {
        if (selectedWords.length === 0) return true;
        const lastWord = selectedWords[selectedWords.length - 1];
        const lastChar = lastWord.slice(-1).toLowerCase();
        const firstChar = word[0].toLowerCase();
        return lastChar === firstChar;
    };

    const addWord = (word) => {
        if (selectedWords.includes(word)) return;
        if (!isValidNext(word)) {
            setError(`"${word}" kelimesi zincire uymuyor! Son harf: "${selectedWords[selectedWords.length - 1].slice(-1).toUpperCase()}"`);
            return;
        }
        setError('');
        setSelectedWords([...selectedWords, word]);
    };

    const removeWord = (index) => {
        // Zinciri kırmamak için sadece son kelimeyi sil
        if (index === selectedWords.length - 1) {
            setSelectedWords(selectedWords.slice(0, -1));
            setError('');
        }
    };

    const handleGenerate = async () => {
        if (selectedWords.length < 2) {
            setError('En az 2 kelime seçmelisin');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await API.post('/wordchain/generate', { words: selectedWords });
            setResult(res.data);
            setSelectedWords([]);
            fetchStories();
        } catch (err) {
            setError(err.response?.data?.error || 'Hikaye oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* Header */}
            <header className="border-b border-border"
                style={{ backgroundColor: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(20px)' }}>
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-xl border border-border hover:border-primary/50 transition-all">
                        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-bold font-display">Word Chain</h1>
                        <p className="text-xs text-muted-foreground">Kelime zinciri hikayesi</p>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Tabs */}
                <div className="max-w-2xl mx-auto px-6 pb-4 flex gap-2">
                    <button
                        onClick={() => setTab('create')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'create'
                            ? 'gradient-bg text-white'
                            : 'border border-border text-muted-foreground hover:text-foreground'
                            }`}>
                        ✨ Oluştur
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'history'
                            ? 'gradient-bg text-white'
                            : 'border border-border text-muted-foreground hover:text-foreground'
                            }`}>
                        📚 Hikayelerim ({stories.length})
                    </button>
                </div>
            </header>

            <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-6">

                {tab === 'create' && (
                    <div className="space-y-6">

                        {/* Zincir gösterimi */}
                        <div className="p-4 rounded-2xl border border-border bg-card">
                            <p className="text-xs text-muted-foreground mb-3 font-medium">SEÇİLEN ZİNCİR</p>
                            {selectedWords.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-4">
                                    Aşağıdan kelime seç — son harf, sonraki kelimenin ilk harfi olmalı
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {selectedWords.map((word, i) => (
                                        <div key={i} className="flex items-center gap-1">
                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl gradient-bg text-white text-sm font-semibold">
                                                <span>{word}</span>
                                                {i === selectedWords.length - 1 && (
                                                    <button onClick={() => removeWord(i)} className="ml-1 hover:opacity-70">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            {i < selectedWords.length - 1 && (
                                                <span className="text-muted-foreground text-xs">→</span>
                                            )}
                                        </div>
                                    ))}
                                    {selectedWords.length > 0 && (
                                        <div className="px-3 py-1.5 rounded-xl border-2 border-dashed border-primary/30 text-primary/50 text-xs flex items-center">
                                            "{selectedWords[selectedWords.length - 1].slice(-1).toUpperCase()}" ile başlayan kelime...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hata */}
                        {error && (
                            <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Üret butonu */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading || selectedWords.length < 2}
                            className="w-full py-3 rounded-xl gradient-bg text-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100">
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Hikaye oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Hikaye Oluştur
                                </>
                            )}
                        </button>

                        {/* Sonuç */}
                        {result && (
                            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    <p className="font-semibold text-sm">Hikayeniz oluşturuldu!</p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {result.words.map((w, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                                            {w}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-sm leading-relaxed text-foreground">{result.story}</p>
                                {getSafeImageUrl(result.imagePath) && (
                                    <img
                                        src={getSafeImageUrl(result.imagePath)}
                                        alt="Story illustration"
                                        className="w-full rounded-xl object-cover aspect-square"
                                    />
                                )}
                                {!result.imagePath && (
                                    <div className="w-full aspect-square rounded-xl bg-muted flex items-center justify-center">
                                        <p className="text-muted-foreground text-sm">Görsel üretilemedi (API limiti)</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Kelime listesi */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-3 font-medium">KELİMELER</p>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    // Zincire uygun kelimeleri öne al
                                    const lastChar = selectedWords.length > 0
                                        ? selectedWords[selectedWords.length - 1].slice(-1).toLowerCase()
                                        : null;

                                    const sorted = [...availableWords].sort((a, b) => {
                                        const aMatch = lastChar && a.EngWordName[0].toLowerCase() === lastChar;
                                        const bMatch = lastChar && b.EngWordName[0].toLowerCase() === lastChar;
                                        if (aMatch && !bMatch) return -1;
                                        if (!aMatch && bMatch) return 1;
                                        return 0;
                                    });

                                    // Her harften max 4, ama zincire uyanlarda limit yok
                                    const letterCount = {};
                                    const nonMatchFiltered = availableWords.filter(word => {
                                        const letter = word.EngWordName[0].toLowerCase();
                                        const isMatch = lastChar && letter === lastChar;
                                        if (isMatch) return false; // bunları ayrı alacağız
                                        if (!letterCount[letter]) letterCount[letter] = 0;
                                        if (letterCount[letter] >= 4) return false;
                                        letterCount[letter]++;
                                        return true;
                                    });

                                    const matchWords = lastChar
                                        ? availableWords.filter(w => w.EngWordName[0].toLowerCase() === lastChar)
                                        : [];

                                    const filtered = [...matchWords, ...nonMatchFiltered];


                                    return filtered.map((word, i) => {
                                        const eng = word.EngWordName;
                                        const valid = isValidNext(eng);
                                        const selected = selectedWords.includes(eng);
                                        const isNextMatch = lastChar && eng[0].toLowerCase() === lastChar;

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => addWord(eng)}
                                                disabled={selected || (!valid && selectedWords.length > 0)}
                                                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${selected
                                                    ? 'bg-primary/20 border-primary/30 text-primary/50 cursor-default'
                                                    : isNextMatch
                                                        ? 'border-primary bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                                                        : valid || selectedWords.length === 0
                                                            ? 'border-border hover:border-primary/50 hover:bg-primary/5 text-foreground cursor-pointer'
                                                            : 'border-border/30 text-muted-foreground/30 cursor-not-allowed'
                                                    }`}>
                                                {eng}
                                                {isNextMatch && !selected && (
                                                    <Plus className="w-3 h-3 inline ml-1" />
                                                )}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-4">
                        {stories.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-4xl mb-3">📖</p>
                                <p>Henüz hikaye oluşturmadın</p>
                            </div>
                        ) : (
                            stories.map((s) => (
                                <div key={s.StoryID} className="p-5 rounded-2xl border border-border bg-card space-y-3">
                                    <div className="flex flex-wrap gap-1">
                                        {s.words.map((w, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                                                {w}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-sm leading-relaxed">{s.Story}</p>
                                    {getSafeImageUrl(s.ImagePath) && (
                                        <img
                                            src={getSafeImageUrl(s.ImagePath)}
                                            alt="Story"
                                            className="w-full rounded-xl object-cover aspect-square"
                                        />
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(s.CreatedAt).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}