'use client';


import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

interface Student {
  id: string;
  student_name: string;
  character_name: string;
  mission_status: string;
  pronunciation_score: number;
  fluency_score: number;
  accuracy_score: number;
  total_score: number;
}

interface RoomInfo {
  language: string;
}

export default function DashboardGuru() {
  const params = useParams();
  const roomCode = params.kode as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [disalin, setDisalin] = useState<boolean>(false);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();
      if (data) setRoomInfo(data);
    };

    const fetchStudents = async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('room_code', roomCode)
        .order('total_score', { ascending: false });
      if (data) setStudents(data);
    };

    fetchRoom();
    fetchStudents();

    const channel = supabase
      .channel('realtime-students')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'students',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          setStudents((prev) => [payload.new as Student, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          setStudents((prev) =>
            prev.map((student) =>
              student.id === payload.new.id ? (payload.new as Student) : student
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setDisalin(true);
    setTimeout(() => setDisalin(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px',
        fontFamily: 'sans-serif',
        backgroundColor: '#f8fafc',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h1 style={{ margin: 0, color: '#1e293b' }}>
              Dashboard Guru - GEMA
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>
              Bahasa Pembelajaran:{' '}
              <strong>{roomInfo?.language || 'Memuat...'}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                margin: '0 0 5px 0',
                fontSize: '14px',
                color: '#64748b',
              }}
            >
              Kode Room:
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '32px',
                  color: '#2563eb',
                  letterSpacing: '2px',
                }}
              >
                {roomCode}
              </h2>
              <button
                onClick={handleCopy}
                style={{
                  padding: '8px 16px',
                  backgroundColor: disalin ? '#10b981' : '#e2e8f0',
                  color: disalin ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {disalin ? '✓ Tersalin!' : 'Salin Kode'}
              </button>
            </div>
          </div>
        </div>

        <h3 style={{ color: '#1f2937' }}>Leaderboard & Penilaian Murid:</h3>
        {students.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            Belum ada murid yang masuk. Menunggu...
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontSize: '14px',
                  }}
                >
                  <th style={{ padding: '12px' }}>Nama Murid</th>
                  <th style={{ padding: '12px' }}>Karakter</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>
                    Pronunciation
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>
                    Fluency
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>
                    Accuracy
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>
                    Total Skor
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    style={{ borderBottom: '1px solid #e2e8f0' }}
                  >
                    <td
                      style={{
                        padding: '12px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                      }}
                    >
                      {student.student_name}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        color: '#64748b',
                        fontSize: '13px',
                      }}
                    >
                      {student.character_name}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: '#2563eb',
                        fontWeight: 'bold',
                      }}
                    >
                      {student.pronunciation_score}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: '#2563eb',
                        fontWeight: 'bold',
                      }}
                    >
                      {student.fluency_score}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: '#2563eb',
                        fontWeight: 'bold',
                      }}
                    >
                      {student.accuracy_score}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#dcfce3',
                          color: '#166534',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                        }}
                      >
                        {student.total_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
