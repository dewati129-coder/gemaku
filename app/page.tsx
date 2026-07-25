'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const router = useRouter();

  const [view, setView] = useState<string>('home');
  const [loading, setLoading] = useState<boolean>(false);

  const [bahasa, setBahasa] = useState<string>('Inggris');
  const [inputKode, setInputKode] = useState<string>('');

  const handleBuatRoom = async () => {
    setLoading(true);
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
      .from('rooms')
      .insert([{ room_code: roomCode, language: bahasa }]);

    if (error) {
      alert('Gagal membuat room. Coba lagi!');
      setLoading(false);
      return;
    }

    router.push(`/guru/${roomCode}`);
  };

  const handleMasukMurid = () => {
    if (!inputKode) return alert('Masukkan kode room dulu!');
    router.push(`/murid/${inputKode.toUpperCase()}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        backgroundColor: '#f3f4f6',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#2563eb',
          }}
        >
          GEMA
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          Global, Expressive, and Multilingual Articulation
        </p>

        {view === 'home' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <button
              onClick={() => setView('guru')}
              style={{
                padding: '12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Masuk sebagai Guru
            </button>
            <button
              onClick={() => setView('murid')}
              style={{
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Masuk sebagai Murid
            </button>
          </div>
        )}

        {view === 'guru' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <h3 style={{ color: '#1f2937' }}>Pilih Bahasa Pembelajaran</h3>
            <select
              value={bahasa}
              onChange={(e) => setBahasa(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                color: '#1f2937',
                backgroundColor: 'white',
                fontSize: '16px',
              }}
            >
              <option value="Indonesia">Bahasa Indonesia</option>
              <option value="Inggris">Bahasa Inggris</option>
              <option value="Jawa">Bahasa Jawa</option>
            </select>
            <button
              onClick={handleBuatRoom}
              disabled={loading}
              style={{
                padding: '12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Membuat Room...' : 'Buat Room'}
            </button>
            <button
              onClick={() => setView('home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Kembali
            </button>
          </div>
        )}

        {view === 'murid' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <h3 style={{ color: '#1f2937' }}>Masukkan Kode Room</h3>
            <input
              type="text"
              placeholder="Contoh: X7B9AQ"
              value={inputKode}
              onChange={(e) => setInputKode(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                textTransform: 'uppercase',
                color: '#1f2937',
                backgroundColor: 'white',
                fontSize: '16px',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            />
            <button
              onClick={handleMasukMurid}
              style={{
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Masuk Room
            </button>
            <button
              onClick={() => setView('home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Kembali
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
