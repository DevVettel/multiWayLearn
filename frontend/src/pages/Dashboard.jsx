import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">🧠 MultiWayLearn</h1>
            <p className="text-gray-500">Hoş geldin, <span className="font-semibold text-gray-700">{username}</span>!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium"
          >
            Çıkış Yap
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: '📚', title: 'Kelime Ekle', desc: 'Yeni kelime öğren', path: '/words' },
            { icon: '🧪', title: 'Teste Başla', desc: '6 Sefer algoritması', path: '/quiz' },
            { icon: '📊', title: 'Analiz', desc: 'İlerleme raporun', path: '/analysis' },
            { icon: '🎮', title: 'Wordle', desc: 'Kelime oyunu', path: '/wordle' },
            { icon: '🔗', title: 'Word Chain', desc: 'Hikaye oluştur', path: '/wordchain' },
            { icon: '⚙️', title: 'Ayarlar', desc: 'Hesap ayarları', path: '/settings' },
          ].map((item) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}