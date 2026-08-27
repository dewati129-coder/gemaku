'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

const karakterList: Record<string, string[]> = {
  Indonesia: [
    'Jenderal Sudirman: The Phantom Strategist',
    'Cut Nyak Dhien: The Iron Queen of Aceh',
    'Sultan Hasanuddin: The Great Phoenix of the East',
    'Tan Malaka: The Ghost of the Revolution',
    'Nyi Ageng Serang: The Strategic Shadow',
  ],
  Inggris: [
    'Grigori Rasputin: The Unkillable Mystic',
    'Napoleon Bonaparte: The Artillery Emperor',
    'Joan of Arc (Jeanne d’Arc): The Holy Vanguard',
    'Sherlock Holmes: The Mind-Palace Master',
    'William Shakespeare: The Fate Weaver',
  ],
  Jawa: [
    'Ken Arok: The Cursed Rogue',
    'Nyi Roro Kidul: The Ocean Sovereign',
    'Raden Wijaya: The Founder of the Sun',
    'Aji Saka: The Word Weaver',
    'Gajah Mada: The Eternal Mahapatih',
  ],
};

export default function PersiapanMurid() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.kode as string;

  const [bahasaRoom, setBahasaRoom] = useState<string>('');
  const [namaMurid, setNamaMurid] = useState<string>('');
  const [karakterPilihan, setKarakterPilihan] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('language')
        .eq('room_code', roomCode)
        .single();

      if (error || !data) {
        alert('Room tidak ditemukan!');
        router.push('/');
        return;
      }

      setBahasaRoom(data.language);
      setLoading(false);
    };

    fetchRoom();
  }, [roomCode, router]);

  const handleMulaiGame = async () => {
    if (!namaMurid) return alert('Isi namamu dulu!');
    if (!karakterPilihan) return alert('Pilih karakter pahlawanmu!');

    setSubmitLoading(true);

    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          room_code: roomCode,
          student_name: namaMurid,
          character_name: karakterPilihan,
          mission_status: 'Memulai Misi',
        },
      ])
      .select()
      .single();

    if (error || !data) {
      alert('Gagal masuk ke room. Coba lagi.');
      setSubmitLoading(false);
      return;
    }

    router.push(`/murid/${roomCode}/chat?studentId=${data.id}`);
  };

  if (loading) {
    return (
      <div className="loading-page">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

              .loading-page {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f3f4f6;
                font-family: 'Space Grotesk', system-ui, sans-serif;
                color: #1f2937;
              }

              .loading-box {
                text-align: center;
              }

              .loading-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #2563eb;
                margin: 0 auto 14px;
                animation: pulse 1s infinite ease-in-out;
              }

              .loading-text {
                font-size: 13px;
                color: #6b7280;
                font-weight: 600;
              }

              @keyframes pulse {
                0%, 100% {
                  transform: scale(0.7);
                  opacity: 0.5;
                }

                50% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
            `,
          }}
        />

        <div className="loading-box">
          <div className="loading-dot" />
          <div className="loading-text">
            Mencari Room...
          </div>
        </div>
      </div>
    );
  }

  const pilihanKarakter = karakterList[bahasaRoom] || [];

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
              padding: 30px 20px;
              background: #f3f4f6;
              font-family: 'Space Grotesk', system-ui, sans-serif;
              color: #1f2937;
              position: relative;
              overflow-x: hidden;
            }

            .page::before,
            .page::after {
              content: '';
              position: fixed;
              width: 300px;
              height: 300px;
              border-radius: 50%;
              pointer-events: none;
              opacity: 0.06;
            }

            .page::before {
              background: #2563eb;
              top: -150px;
              left: -110px;
            }

            .page::after {
              background: #10b981;
              bottom: -160px;
              right: -120px;
            }

            .wrapper {
              width: 100%;
              max-width: 560px;
              margin: 0 auto;
              position: relative;
              z-index: 1;
            }

            .card {
              background: white;
              border-radius: 30px;
              padding: 34px;
              border: 1px solid rgba(0, 0, 0, 0.04);
              box-shadow:
                0 24px 60px rgba(0, 0, 0, 0.055),
                0 4px 12px rgba(0, 0, 0, 0.025);
            }

            .top-section {
              text-align: center;
              margin-bottom: 28px;
            }

            .mission-icon {
              width: 54px;
              height: 54px;
              margin: 0 auto 15px;
              border-radius: 17px;
              background: linear-gradient(135deg, #2563eb, #10b981);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 23px;
              font-weight: 700;
              box-shadow: 0 10px 22px rgba(37, 99, 235, 0.16);
            }

            .eyebrow {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              color: #9ca3af;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 1.3px;
              text-transform: uppercase;
              margin-bottom: 7px;
            }

            .dot {
              width: 6px;
              height: 6px;
              background: #10b981;
              border-radius: 50%;
            }

            .title {
              margin: 0;
              font-size: 27px;
              line-height: 1.15;
              letter-spacing: -1px;
              font-weight: 700;
              color: #1f2937;
            }

            .subtitle {
              margin: 9px auto 0;
              max-width: 370px;
              font-size: 13px;
              line-height: 1.6;
              color: #9ca3af;
              font-weight: 500;
            }

            .room-info {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 8px;
              margin-top: 17px;
              flex-wrap: wrap;
            }

            .room-pill {
              padding: 7px 11px;
              border-radius: 99px;
              background: #eff6ff;
              color: #2563eb;
              font-size: 11px;
              font-weight: 700;
            }

            .language-pill {
              padding: 7px 11px;
              border-radius: 99px;
              background: #f0fdf4;
              color: #166534;
              font-size: 11px;
              font-weight: 700;
            }

            .divider {
              height: 1px;
              background: #f1f5f9;
              margin: 26px 0;
            }

            .field {
              margin-bottom: 24px;
            }

            .label {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 9px;
              color: #374151;
              font-size: 12px;
              font-weight: 700;
            }

            .label-number {
              color: #cbd5e1;
              font-size: 10px;
              font-weight: 700;
            }

            .name-input {
              width: 100%;
              padding: 15px 16px;
              border-radius: 16px;
              border: 1.5px solid #e5e7eb;
              background: #f9fafb;
              color: #1f2937;
              font-family: inherit;
              font-size: 15px;
              font-weight: 500;
              outline: none;
              transition:
                border-color 0.2s ease,
                background 0.2s ease,
                box-shadow 0.2s ease;
            }

            .name-input::placeholder {
              color: #cbd5e1;
            }

            .name-input:focus {
              background: white;
              border-color: #2563eb;
              box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
            }

            .character-grid {
              display: flex;
              flex-direction: column;
              gap: 9px;
            }

            .character-card {
              width: 100%;
              padding: 14px;
              border-radius: 16px;
              border: 1.5px solid #e5e7eb;
              background: white;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 12px;
              text-align: left;
              transition:
                transform 0.18s ease,
                border-color 0.18s ease,
                background 0.18s ease,
                box-shadow 0.18s ease;
            }

            .character-card:hover {
              transform: translateY(-1px);
              border-color: #bfdbfe;
              background: #fafcff;
            }

            .character-card.selected {
              border-color: #2563eb;
              background: #eff6ff;
              box-shadow: 0 7px 18px rgba(37, 99, 235, 0.08);
            }

            .character-number {
              width: 31px;
              height: 31px;
              border-radius: 10px;
              background: #f8fafc;
              color: #94a3b8;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 700;
              flex-shrink: 0;
              transition:
                background 0.18s ease,
                color 0.18s ease;
            }

            .character-card.selected .character-number {
              background: #2563eb;
              color: white;
            }

            .character-name {
              flex: 1;
              color: #475569;
              font-size: 13px;
              line-height: 1.45;
              font-weight: 500;
            }

            .character-card.selected .character-name {
              color: #1f2937;
              font-weight: 700;
            }

            .check {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              border: 1.5px solid #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: center;
              color: transparent;
              font-size: 11px;
              flex-shrink: 0;
            }

            .character-card.selected .check {
              background: #2563eb;
              border-color: #2563eb;
              color: white;
            }

            .start-button {
              width: 100%;
              padding: 17px;
              border: none;
              border-radius: 17px;
              background: #10b981;
              color: white;
              font-family: inherit;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 9px 22px rgba(16, 185, 129, 0.18);
              transition:
                transform 0.2s ease,
                box-shadow 0.2s ease,
                opacity 0.2s ease;
            }

            .start-button:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 12px 25px rgba(16, 185, 129, 0.22);
            }

            .start-button:active:not(:disabled) {
              transform: translateY(0);
            }

            .start-button:disabled {
              background: #9ca3af;
              cursor: not-allowed;
              box-shadow: none;
            }

            .footer {
              text-align: center;
              margin-top: 17px;
              color: #cbd5e1;
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 0.3px;
            }

            @media (max-width: 600px) {
              .page {
                padding: 16px;
              }

              .card {
                padding: 26px 20px;
                border-radius: 25px;
              }

              .title {
                font-size: 24px;
              }

              .character-card {
                padding: 13px;
              }
            }
          `,
        }}
      />

      <div className="wrapper">
        <div className="card">

          {/* HEADER */}
          <div className="top-section">
            <div className="mission-icon">
              ✦
            </div>

            <div className="eyebrow">
              <span className="dot" />
              Mission Setup
            </div>

            <h2 className="title">
              Siap memulai misi?
            </h2>

            <p className="subtitle">
              Kenalkan dirimu dan pilih partner karakter
              yang akan menemanimu dalam perjalanan.
            </p>

            <div className="room-info">
              <span className="room-pill">
                ROOM · {roomCode}
              </span>

              <span className="language-pill">
                {bahasaRoom}
              </span>
            </div>
          </div>

          <div className="divider" />

          {/* NAMA */}
          <div className="field">
            <label className="label">
              <span>Nama Kamu</span>
              <span className="label-number">01</span>
            </label>

            <input
              type="text"
              placeholder="Masukkan namamu..."
              value={namaMurid}
              onChange={(e) => setNamaMurid(e.target.value)}
              className="name-input"
            />
          </div>

          {/* KARAKTER */}
          <div className="field">
            <label className="label">
              <span>Pilih Partner Karaktermu</span>
              <span className="label-number">02</span>
            </label>

            <div className="character-grid">
              {pilihanKarakter.map((karakter, index) => (
                <label
                  key={index}
                  className={`character-card ${
                    karakterPilihan === karakter ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="karakter"
                    value={karakter}
                    checked={karakterPilihan === karakter}
                    onChange={(e) =>
                      setKarakterPilihan(e.target.value)
                    }
                    style={{ display: 'none' }}
                  />

                  <span className="character-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="character-name">
                    {karakter}
                  </span>

                  <span className="check">
                    ✓
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleMulaiGame}
            disabled={submitLoading}
            className="start-button"
          >
            {submitLoading
              ? 'Memasuki Room...'
              : 'Mulai Game →'}
          </button>

          <div className="footer">
            Choose your character · Start your mission
          </div>

        </div>
      </div>
    </div>
  );
}
