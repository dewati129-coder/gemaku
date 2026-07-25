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
      <div
        style={{
          textAlign: 'center',
          padding: '50px',
          fontFamily: 'sans-serif',
          color: '#1f2937',
        }}
      >
        Mencari Room...
      </div>
    );
  }

  const pilihanKarakter = karakterList[bahasaRoom] || [];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        backgroundColor: '#f3f4f6',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        <h2
          style={{ color: '#2563eb', textAlign: 'center', marginBottom: '5px' }}
        >
          Persiapan Misi
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: '25px',
          }}
        >
          Room: <strong>{roomCode}</strong> | Bahasa:{' '}
          <strong>{bahasaRoom}</strong>
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#374151',
            }}
          >
            Nama Kamu:
          </label>
          <input
            type="text"
            placeholder="Masukkan namamu..."
            value={namaMurid}
            onChange={(e) => setNamaMurid(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              color: '#1f2937',
              backgroundColor: 'white',
              fontSize: '16px',
            }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 'bold',
              color: '#374151',
            }}
          >
            Pilih Partner Karaktermu:
          </label>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {pilihanKarakter.map((karakter, index) => (
              <label
                key={index}
                style={{
                  padding: '12px',
                  border:
                    karakterPilihan === karakter
                      ? '2px solid #2563eb'
                      : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor:
                    karakterPilihan === karakter ? '#eff6ff' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="karakter"
                  value={karakter}
                  checked={karakterPilihan === karakter}
                  onChange={(e) => setKarakterPilihan(e.target.value)}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    fontWeight:
                      karakterPilihan === karakter ? 'bold' : 'normal',
                    color: '#1f2937',
                  }}
                >
                  {karakter}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleMulaiGame}
          disabled={submitLoading}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {submitLoading ? 'Memasuki Room...' : 'Mulai Game!'}
        </button>
      </div>
    </div>
  );
}