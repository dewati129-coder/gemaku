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
        backgroundColor: '#f3f4f6',
        padding: '20px',
        // Memakai font modern yang di-import di bawah
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Trik Import Font Google Langsung Tanpa Repot */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
      `}} />

      <div
        style={{
          backgroundColor: 'white',
          padding: '48px 40px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
          textAlign: 'center',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid rgba(0,0,0,0.02)',
        }}
      >
        <h1
          style={{
            fontSize: '48px',
            fontWeight: '800',
            letterSpacing: '-2px',
            marginBottom: '8px',
            // Efek Teks Gradasi (Estetik Vibes)
            background: 'linear-gradient(135deg, #2563eb, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GEMA
        </h1>
        <p
          style={{
            color: '#6b7280',
            marginBottom: '40px',
            fontSize: '15px',
            fontWeight: '400',
            lineHeight: '1.6',
          }}
        >
          Dobrak Batas Bahasa, Ciptakan Generasi Mendunia!
        </p>

        {view === 'home' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <button
              onClick={() => setView('guru')}
              style={{
                padding: '16px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '99px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              Masuk sebagai Guru
            </button>
            <button
              onClick={() => setView('murid')}
              style={{
                padding: '16px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '99px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              Masuk sebagai Murid
            </button>
          </div>
        )}

        {view === 'guru' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h3 style={{ color: '#1f2937', fontSize: '18px', margin: 0, fontWeight: '600' }}>
              Pilih Bahasa Pembelajaran
            </h3>
            <select
              value={bahasa}
              onChange={(e) => setBahasa(e.target.value)}
              style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1.5px solid #e5e7eb',
                color: '#1f2937',
                backgroundColor: '#f9fafb',
                fontSize: '16px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
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
                padding: '16px',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '99px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '8px',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.2)',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Membuat Room...' : 'Buat Room'}
            </button>
            <button
              onClick={() => setView('home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                marginTop: '10px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'inherit',
              }}
            >
              Kembali
            </button>
          </div>
        )}

        {view === 'murid' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h3 style={{ color: '#1f2937', fontSize: '18px', margin: 0, fontWeight: '600' }}>
              Masukkan Kode Room
            </h3>
            <input
              type="text"
              placeholder="Contoh: X7B9AQ"
              value={inputKode}
              onChange={(e) => setInputKode(e.target.value)}
              style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1.5px solid #e5e7eb',
                textTransform: 'uppercase',
                color: '#1f2937',
                backgroundColor: '#f9fafb',
                fontSize: '18px',
                textAlign: 'center',
                fontWeight: '800',
                outline: 'none',
                letterSpacing: '2px',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleMasukMurid}
              style={{
                padding: '16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '99px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
                fontFamily: 'inherit',
              }}
            >
              Masuk Room
            </button>
            <button
              onClick={() => setView('home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                marginTop: '10px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'inherit',
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
