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
              student.id === payload.new.id
                ? (payload.new as Student)
                : student
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
    <div className="dashboard">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

            * {
              box-sizing: border-box;
            }

            .dashboard {
              min-height: 100vh;
              padding: 32px;
              background: #f3f4f6;
              font-family: 'Space Grotesk', system-ui, sans-serif;
              color: #1f2937;
              position: relative;
              overflow-x: hidden;
            }

            .dashboard::before,
            .dashboard::after {
              content: '';
              position: fixed;
              width: 300px;
              height: 300px;
              border-radius: 50%;
              pointer-events: none;
              opacity: 0.06;
              z-index: 0;
            }

            .dashboard::before {
              background: #2563eb;
              top: -140px;
              left: -100px;
            }

            .dashboard::after {
              background: #10b981;
              bottom: -150px;
              right: -100px;
            }

            .container {
              width: 100%;
              max-width: 1100px;
              margin: 0 auto;
              position: relative;
              z-index: 1;
            }

            .header {
              background: white;
              border-radius: 28px;
              padding: 28px 30px;
              border: 1px solid rgba(0, 0, 0, 0.04);
              box-shadow:
                0 20px 50px rgba(0, 0, 0, 0.045),
                0 3px 10px rgba(0, 0, 0, 0.02);
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 24px;
              margin-bottom: 20px;
            }

            .brand-area {
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .brand-icon {
              width: 50px;
              height: 50px;
              border-radius: 16px;
              background: linear-gradient(135deg, #2563eb, #10b981);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 21px;
              font-weight: 700;
              box-shadow: 0 8px 18px rgba(37, 99, 235, 0.15);
              flex-shrink: 0;
            }

            .eyebrow {
              display: flex;
              align-items: center;
              gap: 7px;
              color: #9ca3af;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 1.2px;
              text-transform: uppercase;
              margin-bottom: 4px;
            }

            .dot {
              width: 6px;
              height: 6px;
              background: #10b981;
              border-radius: 50%;
            }

            .title {
              margin: 0;
              font-size: 24px;
              line-height: 1.2;
              font-weight: 700;
              letter-spacing: -0.7px;
              color: #1f2937;
            }

            .language {
              margin: 6px 0 0;
              font-size: 13px;
              color: #9ca3af;
            }

            .language strong {
              color: #6b7280;
              font-weight: 600;
            }

            .room-box {
              display: flex;
              align-items: center;
              gap: 13px;
              background: #f9fafb;
              border: 1px solid #f1f5f9;
              padding: 9px 10px 9px 17px;
              border-radius: 18px;
            }

            .room-label {
              font-size: 10px;
              color: #9ca3af;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 2px;
            }

            .room-code {
              margin: 0;
              color: #2563eb;
              font-size: 25px;
              line-height: 1;
              font-weight: 700;
              letter-spacing: 3px;
            }

            .copy-button {
              border: none;
              padding: 11px 14px;
              border-radius: 13px;
              background: #e2e8f0;
              color: #475569;
              cursor: pointer;
              font-family: inherit;
              font-size: 12px;
              font-weight: 700;
              transition:
                transform 0.2s ease,
                background 0.2s ease;
            }

            .copy-button:hover {
              transform: translateY(-1px);
            }

            .copy-button.copied {
              background: #10b981;
              color: white;
            }

            .stats-row {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 14px;
              margin-bottom: 20px;
            }

            .stat-card {
              background: white;
              border: 1px solid rgba(0, 0, 0, 0.04);
              border-radius: 20px;
              padding: 18px 20px;
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.035);
            }

            .stat-label {
              color: #9ca3af;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }

            .stat-number {
              margin: 5px 0 0;
              color: #1f2937;
              font-size: 25px;
              font-weight: 700;
              letter-spacing: -1px;
            }

            .leaderboard {
              background: white;
              border-radius: 28px;
              border: 1px solid rgba(0, 0, 0, 0.04);
              box-shadow:
                0 20px 50px rgba(0, 0, 0, 0.045),
                0 3px 10px rgba(0, 0, 0, 0.02);
              overflow: hidden;
            }

            .leaderboard-header {
              padding: 25px 28px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
            }

            .section-title {
              margin: 0;
              font-size: 18px;
              font-weight: 700;
              letter-spacing: -0.4px;
              color: #1f2937;
            }

            .section-subtitle {
              margin: 5px 0 0;
              color: #9ca3af;
              font-size: 12px;
            }

            .live-badge {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              padding: 7px 11px;
              border-radius: 99px;
              background: #f0fdf4;
              color: #166534;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.7px;
            }

            .live-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #10b981;
            }

            .table-wrapper {
              overflow-x: auto;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              min-width: 780px;
            }

            thead tr {
              background: #f8fafc;
            }

            th {
              padding: 13px 18px;
              color: #94a3b8;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.7px;
              text-align: left;
              white-space: nowrap;
            }

            th.center {
              text-align: center;
            }

            td {
              padding: 16px 18px;
              border-top: 1px solid #f1f5f9;
              white-space: nowrap;
            }

            tbody tr {
              transition: background 0.15s ease;
            }

            tbody tr:hover {
              background: #fafafa;
            }

            .student-cell {
              display: flex;
              align-items: center;
              gap: 11px;
            }

            .avatar {
              width: 34px;
              height: 34px;
              border-radius: 11px;
              background: #eff6ff;
              color: #2563eb;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 700;
            }

            .student-name {
              color: #1f2937;
              font-size: 13px;
              font-weight: 700;
            }

            .character {
              color: #64748b;
              font-size: 12px;
              font-weight: 500;
            }

            .score {
              text-align: center;
              color: #2563eb;
              font-size: 13px;
              font-weight: 700;
            }

            .total-score {
              display: inline-flex;
              min-width: 48px;
              justify-content: center;
              padding: 6px 10px;
              border-radius: 10px;
              background: #dcfce3;
              color: #166534;
              font-size: 12px;
              font-weight: 700;
            }

            .empty-state {
              padding: 65px 20px;
              text-align: center;
            }

            .empty-icon {
              width: 48px;
              height: 48px;
              margin: 0 auto 14px;
              border-radius: 15px;
              background: #f8fafc;
              color: #94a3b8;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            }

            .empty-title {
              margin: 0;
              color: #475569;
              font-size: 14px;
              font-weight: 600;
            }

            .empty-description {
              margin: 5px 0 0;
              color: #cbd5e1;
              font-size: 12px;
            }

            @media (max-width: 760px) {
              .dashboard {
                padding: 18px;
              }

              .header {
                padding: 22px;
                flex-direction: column;
                align-items: stretch;
              }

              .room-box {
                justify-content: space-between;
              }

              .stats-row {
                grid-template-columns: 1fr;
              }

              .leaderboard-header {
                padding: 22px;
                align-items: flex-start;
              }
            }

            @media (max-width: 480px) {
              .brand-icon {
                width: 44px;
                height: 44px;
                border-radius: 14px;
              }

              .title {
                font-size: 20px;
              }

              .room-code {
                font-size: 21px;
              }

              .room-box {
                padding-left: 13px;
              }

              .copy-button {
                padding: 10px 11px;
              }
            }
          `,
        }}
      />

      <div className="container">

        {/* HEADER */}
        <div className="header">
          <div className="brand-area">
            <div className="brand-icon">G</div>

            <div>
              <div className="eyebrow">
                <span className="dot" />
                Teacher Dashboard
              </div>

              <h1 className="title">
                Dashboard Guru — GEMA
              </h1>

              <p className="language">
                Bahasa Pembelajaran:{' '}
                <strong>{roomInfo?.language || 'Memuat...'}</strong>
              </p>
            </div>
          </div>

          <div className="room-box">
            <div>
              <div className="room-label">
                Kode Room
              </div>

              <h2 className="room-code">
                {roomCode}
              </h2>
            </div>

            <button
              onClick={handleCopy}
              className={`copy-button ${disalin ? 'copied' : ''}`}
            >
              {disalin ? '✓ Tersalin' : 'Salin Kode'}
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">
              Total Murid
            </div>

            <div className="stat-number">
              {students.length}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Status
            </div>

            <div className="stat-number">
              Live
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Room
            </div>

            <div className="stat-number">
              Aktif
            </div>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="leaderboard">

          <div className="leaderboard-header">
            <div>
              <h3 className="section-title">
                Leaderboard & Penilaian
              </h3>

              <p className="section-subtitle">
                Pantau perkembangan murid secara realtime.
              </p>
            </div>

            <div className="live-badge">
              <span className="live-dot" />
              Live Data
            </div>
          </div>

          {students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                ✦
              </div>

              <p className="empty-title">
                Belum ada murid yang masuk.
              </p>

              <p className="empty-description">
                Menunggu murid bergabung ke room...
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nama Murid</th>
                    <th>Karakter</th>
                    <th className="center">
                      Pronunciation
                    </th>
                    <th className="center">
                      Fluency
                    </th>
                    <th className="center">
                      Accuracy
                    </th>
                    <th className="center">
                      Total Skor
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>

                      <td>
                        <div className="student-cell">
                          <div className="avatar">
                            {student.student_name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <span className="student-name">
                            {student.student_name}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="character">
                          {student.character_name}
                        </span>
                      </td>

                      <td className="score">
                        {student.pronunciation_score}
                      </td>

                      <td className="score">
                        {student.fluency_score}
                      </td>

                      <td className="score">
                        {student.accuracy_score}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className="total-score">
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
    </div>
  );
}
