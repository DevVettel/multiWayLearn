import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWords, addWord, deleteWord } from '../services/api';
import {
  ArrowLeft, Plus, Trash2, BookOpen,
  Image, FileText, X, Check, Pencil
} from 'lucide-react';

export default function Words() {
  const [words, setWords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWord, setEditingWord] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ engWord: '', turWord: '', samples: ['', '', ''] });
  const [picture, setPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchWords(); }, []);

  const fetchWords = async () => {
    try {
      const res = await getWords();
      setWords(res.data);
    } catch {
      setError('Kelimeler yüklenemedi (something went wrong)');
    }
  };

  const handlePicture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPicture(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const openAddForm = () => {
    setEditingWord(null);
    setForm({ engWord: '', turWord: '', samples: ['', '', ''] });
    setPicture(null);
    setPicturePreview(null);
    setShowForm(true);
  };

  const openEditForm = (word) => {
    setEditingWord(word);
    const samples = [...(word.Samples || []), '', '', ''].slice(0, 3);
    setForm({ engWord: word.EngWordName, turWord: word.TurWordName, samples });
    setPicture(null);
    setPicturePreview(word.Picture ? `http://localhost:3001${word.Picture}` : null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('engWord', form.engWord);
      formData.append('turWord', form.turWord);
      formData.append('samples', JSON.stringify(form.samples.filter(s => s.trim())));
      if (picture) formData.append('picture', picture);

      if (editingWord) {
        // Düzenleme: sil + yeniden ekle

        await deleteWord(editingWord.WordID);
        await addWord(formData);
        setSuccess('Kelime başarıyla güncellendi!');
      } else {
        await addWord(formData);
        setSuccess('Kelime başarıyla eklendi!');
      }

      setForm({ engWord: '', turWord: '', samples: ['', '', ''] });
      setPicture(null);
      setPicturePreview(null);
      setShowForm(false);
      setEditingWord(null);
      fetchWords();
    } catch (err) {
      setError(err.response?.data?.error || 'İşlem gerçekleştirilemedi (something went wrong)');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu kelimeyi silmek istiyor musun?')) return;
    try {
      await deleteWord(id);
      fetchWords();
    } catch {
      setError('Kelime silinemedi (something went wrong)');
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border"
        style={{ backgroundColor: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold font-display">Kelime Yönetimi</h1>
              <p className="text-xs text-muted-foreground">{words.length} kelime</p>
            </div>
          </div>
          <button onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-medium transition-all duration-300 hover:scale-105">
            <Plus className="w-4 h-4" /> Kelime Ekle
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
            <X className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-2">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card animate-scale-in">
            <h2 className="text-lg font-bold font-display mb-6">
              {editingWord ? `"${editingWord.EngWordName}" Düzenle` : 'Yeni Kelime Ekle'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">İngilizce Kelime *</label>
                  <input type="text" value={form.engWord}
                    onChange={(e) => setForm({ ...form, engWord: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    placeholder="örn: apple" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Türkçe Karşılığı *</label>
                  <input type="text" value={form.turWord}
                    onChange={(e) => setForm({ ...form, turWord: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    placeholder="örn: elma" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Örnek Cümleler 
                </label>
                {form.samples.map((sample, i) => (
                  <input key={i} type="text" value={sample}
                    onChange={(e) => {
                      const newSamples = [...form.samples];
                      newSamples[i] = e.target.value;
                      setForm({ ...form, samples: newSamples });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all mb-2"
                    placeholder={`${i + 1}. örnek cümle`} />
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                  <Image className="w-4 h-4" /> Resim (opsiyonel)
                </label>
                <input type="file" accept="image/*" onChange={handlePicture}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none transition-all" />
                {picturePreview && (
                  <img src={picturePreview} alt="Önizleme"
                    className="mt-3 w-32 h-32 object-cover rounded-xl border border-border" />
                )}
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl gradient-bg text-white font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-60">
                  {loading ? 'İşleniyor...' : editingWord ? 'Güncelle' : 'Kelime Ekle'}
                </button>
                <button type="button"
                  onClick={() => { setShowForm(false); setEditingWord(null); }}
                  className="px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all">
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kelime Listesi */}
        {words.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Henüz kelime eklenmedi (Starting is half the work of finishing.)</h3>
            <p className="text-muted-foreground text-sm">Kelime ekle butonuna tıklayarak ilk kelimeni ekle</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {words.map((word) => (
              <div key={word.WordID}
                className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    {word.Picture && (
                      <img src={`http://localhost:3001${word.Picture}`} alt={word.EngWordName}
                        className="w-16 h-16 object-cover rounded-xl border border-border flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-foreground">{word.EngWordName}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-lg font-semibold text-primary">{word.TurWordName}</span>
                      </div>
                      {word.Samples?.length > 0 && (
                        <div className="space-y-1">
                          {word.Samples.map((sample, j) => (
                            <p key={j} className="text-sm text-muted-foreground italic">"{sample}"</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Düzenle + Sil butonları */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEditForm(word)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(word.WordID)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}