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
    <div className="page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

            * {
              box-sizing: border-box;
            }

            .page {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: #f3f4f6;
              font-family: 'Space Grotesk', system-ui, sans-serif;
              color: #1f2937;
              position: relative;
              overflow: hidden;
            }

            .page::before,
            .page::after {
              content: '';
              position: absolute;
              width: 280px;
              height: 280px;
              border-radius: 50%;
              pointer-events: none;
              opacity: 0.08;
              filter: blur(2px);
            }

            .page::before {
              background: #2563eb;
              top: -130px;
              left: -100px;
            }

            .page::after {
              background: #10b981;
              right: -110px;
              bottom: -130px;
            }

            .card {
              width: 100%;
              max-width: 460px;
              background: white;
              border: 1px solid rgba(0, 0, 0, 0.05);
              border-radius: 32px;
              padding: 42px;
              position: relative;
              z-index: 1;
              box-shadow:
                0 24px 60px rgba(0, 0, 0, 0.06),
                0 4px 12px rgba(0, 0, 0, 0.025);
            }

            .top-line {
              width: 42px;
              height: 5px;
              border-radius: 99px;
              background: linear-gradient(90deg, #2563eb, #10b981);
              margin: 0 auto 24px;
            }

            .brand {
              text-align: center;
            }

            .logo {
              margin: 0;
              font-size: 56px;
              line-height: 1;
              font-weight: 700;
              letter-spacing: -4px;
              background: linear-gradient(135deg, #2563eb, #10b981);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .tagline {
              margin: 14px auto 34px;
              max-width: 330px;
              color: #6b7280;
              font-size: 14px;
              line-height: 1.7;
              font-weight: 500;
            }

            .home-content {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .role-button {
              width: 100%;
              border: none;
              padding: 17px 20px;
              border-radius: 18px;
              color: white;
              cursor: pointer;
              font-family: inherit;
              font-size: 15px;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: space-between;
              transition:
                transform 0.2s ease,
                box-shadow 0.2s ease,
                filter 0.2s ease;
            }

            .role-button:hover {
              transform: translateY(-2px);
              filter: brightness(1.02);
            }

            .role-button:active {
              transform: translateY(0);
            }

            .teacher-button {
              background: #2563eb;
              box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18);
            }

            .student-button {
              background: #10b981;
              box-shadow: 0 8px 20px rgba(16, 185, 129, 0.18);
            }

            .button-left {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .icon-box {
              width: 34px;
              height: 34px;
              border-radius: 11px;
              background: rgba(255, 255, 255, 0.18);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 17px;
            }

            .arrow {
              font-size: 20px;
              opacity: 0.75;
              transition: transform 0.2s ease;
            }

            .role-button:hover .arrow {
              transform: translateX(3px);
            }

            .form {
              display: flex;
              flex-direction: column;
              gap: 14px;
            }

            .form-header {
              text-align: left;
              margin-bottom: 8px;
            }

            .eyebrow {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              color: #6b7280;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .eyebrow-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #10b981;
            }

            .form-title {
              color: #1f2937;
              font-size: 22px;
              line-height: 1.25;
              margin: 0;
              font-weight: 700;
              letter-spacing: -0.6px;
            }

            .form-description {
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.5;
              margin: 7px 0 0;
            }

            .field-label {
              color: #6b7280;
              font-size: 12px;
              font-weight: 600;
              margin: 4px 0 -5px 3px;
            }

            .select,
            .room-input {
              width: 100%;
              padding: 16px 17px;
              border-radius: 16px;
              border: 1.5px solid #e5e7eb;
              color: #1f2937;
              background: #f9fafb;
              font-family: inherit;
              outline: none;
              transition:
                border-color 0.2s ease,
                box-shadow 0.2s ease,
                background 0.2s ease;
            }

            .select {
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
            }

            .select:focus,
            .room-input:focus {
              border-color: #2563eb;
              background: white;
              box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
            }

            .room-input {
              font-size: 22px;
              text-align: center;
              font-weight: 700;
              letter-spacing: 5px;
              text-transform: uppercase;
            }

            .room-input::placeholder {
              color: #d1d5db;
              letter-spacing: 2px;
              font-weight: 500;
              font-size: 15px;
            }

            .primary-button {
              width: 100%;
              border: none;
              padding: 16px;
              border-radius: 17px;
              color: white;
              cursor: pointer;
              font-family: inherit;
              font-size: 15px;
              font-weight: 600;
              margin-top: 4px;
              transition:
                transform 0.2s ease,
                box-shadow 0.2s ease,
                opacity 0.2s ease;
            }

            .primary-button:hover:not(:disabled) {
              transform: translateY(-2px);
            }

            .blue-button {
              background: #2563eb;
              box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18);
            }

            .green-button {
              background: #10b981;
              box-shadow: 0 8px 20px rgba(16, 185, 129, 0.18);
            }

            .primary-button:disabled {
              background: #9ca3af;
              cursor: not-allowed;
              box-shadow: none;
            }

            .back-button {
              border: none;
              background: transparent;
              color: #9ca3af;
              cursor: pointer;
              font-family: inherit;
              font-size: 13px;
              font-weight: 600;
              padding: 8px;
              margin: 2px auto -5px;
              transition: color 0.2s ease;
            }

            .back-button:hover {
              color: #1f2937;
            }

            .footer {
              text-align: center;
              color: #d1d5db;
              font-size: 11px;
              margin-top: 28px;
              font-weight: 500;
              letter-spacing: 0.3px;
            }

            @media (max-width: 520px) {
              .page {
                padding: 16px;
              }

              .card {
                padding: 32px 22px;
                border-radius: 26px;
              }

              .logo {
                font-size: 50px;
              }

              .tagline {
                margin-bottom: 28px;
              }
            }
          `,
        }}
      />

      <div className="card">
        <div className="top-line" />

        <div className="brand">
          <h1 className="logo">GEMA</h1>

          <p className="tagline">
            Dobrak Batas Bahasa, Ciptakan Generasi Mendunia!
          </p>
        </div>

        {view === 'home' && (
          <>
            <div className="home-content">
              <button
                onClick={() => setView('guru')}
                className="role-button teacher-button"
              >
                <span className="button-left">
                  <span className="icon-box">✦</span>
                  <span>Masuk sebagai Guru</span>
                </span>

                <span className="arrow">→</span>
              </button>

              <button
                onClick={() => setView('murid')}
                className="role-button student-button"
              >
                <span className="button-left">
                  <span className="icon-box">✎</span>
                  <span>Masuk sebagai Murid</span>
                </span>

                <span className="arrow">→</span>
              </button>
            </div>

            <div className="footer">
              Learning • Connecting • Growing
            </div>
          </>
        )}

        {view === 'guru' && (
          <div className="form">
            <div className="form-header">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                Teacher Space
              </div>

              <h3 className="form-title">
                Siapkan ruang belajar kamu.
              </h3>

              <p className="form-description">
                Pilih bahasa pembelajaran untuk membuat room baru.
              </p>
            </div>

            <label className="field-label">
              Bahasa Pembelajaran
            </label>

            <select
              value={bahasa}
              onChange={(e) => setBahasa(e.target.value)}
              className="select"
            >
              <option value="Indonesia">Bahasa Indonesia</option>
              <option value="Inggris">Bahasa Inggris</option>
              <option value="Jawa">Bahasa Jawa</option>
            </select>

            <button
              onClick={handleBuatRoom}
              disabled={loading}
              className="primary-button blue-button"
            >
              {loading ? 'Membuat Room...' : 'Buat Room →'}
            </button>

            <button
              onClick={() => setView('home')}
              className="back-button"
            >
              ← Kembali
            </button>
          </div>
        )}

        {view === 'murid' && (
          <div className="form">
            <div className="form-header">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                Student Space
              </div>

              <h3 className="form-title">
                Ready buat belajar?
              </h3>

              <p className="form-description">
                Masukkan kode room dari guru untuk bergabung.
              </p>
            </div>

            <label className="field-label">
              Kode Room
            </label>

            <input
              type="text"
              placeholder="X7B9AQ"
              value={inputKode}
              maxLength={6}
              onChange={(e) => setInputKode(e.target.value)}
              className="room-input"
            />

            <button
              onClick={handleMasukMurid}
              className="primary-button green-button"
            >
              Masuk Room →
            </button>

            <button
              onClick={() => setView('home')}
              className="back-button"
            >
              ← Kembali
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
