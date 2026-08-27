'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

interface Message {
  sender: 'ai' | 'murid';
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  scoreCard?: {
    pronunciation: number;
    fluency: number;
    accuracy: number;
  };
}

function ChatRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomCode = params.kode as string;
  const studentId = searchParams.get('studentId');

  const [studentData, setStudentData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return router.push('/');

      const { data: sData } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      const { data: rData } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (sData && rData) {
        setStudentData(sData);
        setRoomData(rData);

        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isInitial: true,
              character: sData.character_name,
              language: rData.language,
            }),
          });

          const result = await response.json();

          if (result.reply) {
            setMessages([{ sender: 'ai', text: result.reply }]);
          }
        } catch (e) {
          setMessages([
            {
              sender: 'ai',
              text: 'Koneksi terganggu. Reload halaman ya.',
            },
          ]);
        } finally {
          setIsAiTyping(false);
        }
      }
    };

    fetchData();
  }, [studentId, roomCode, router]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        setAudioBlob(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Izinkan akses mikrofon terlebih dahulu!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Fungsi mengubah file audio menjadi Base64
  const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };

      reader.readAsDataURL(file);
    });
  };

  // Fungsi BARU: Mengkompresi resolusi foto agar ringan di HP
  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resolusi maksimal
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Ubah ke JPEG kualitas 70%
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const kirimPesan = async () => {
    if (!imageFile && !audioBlob) {
      return alert(
        'Kirimkan Voice Note atau Foto benda terlebih dahulu!'
      );
    }

    setIsSending(true);

    const imageUrl = imageFile
      ? URL.createObjectURL(imageFile)
      : undefined;

    const audioUrl = audioBlob
      ? URL.createObjectURL(audioBlob)
      : undefined;

    setMessages((prev) => [
      ...prev,
      {
        sender: 'murid',
        imageUrl,
        audioUrl,
      },
    ]);

    try {
      // Menggunakan fungsi kompresi untuk gambar
      const imageBase64 = imageFile
        ? await compressImageToBase64(imageFile)
        : undefined;

      const audioBase64 = audioBlob
        ? await fileToBase64(audioBlob)
        : undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isInitial: false,
          imageBase64,
          imageMimeType: imageFile ? 'image/jpeg' : undefined, // Selalu jpeg setelah dikompres
          audioBase64,
          audioMimeType: audioBlob?.type,
          character: studentData.character_name,
          language: roomData.language,
        }),
      });

      const result = await response.json();

      if (result.reply) {
        const p = result.pronunciation || 75;
        const f = result.fluency || 75;
        const a = result.accuracy || 75;

        const total = Math.round((p + f + a) / 3);

        await supabase
          .from('students')
          .update({
            pronunciation_score: p,
            fluency_score: f,
            accuracy_score: a,
            total_score: total,
            mission_status: 'Misi Berjalan',
          })
          .eq('id', studentId);

        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: result.reply,
            scoreCard: {
              pronunciation: p,
              fluency: f,
              accuracy: a,
            },
          },
        ]);
      } else {
        throw new Error();
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text:
            'Maaf, gagal memproses penilaian. Coba kirim ulang.',
        },
      ]);
    }

    setImageFile(null);
    setAudioBlob(null);
    setIsSending(false);
  };

  if (!studentData) {
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

              .loading-content {
                text-align: center;
              }

              .loading-icon {
                width: 48px;
                height: 48px;
                margin: 0 auto 15px;
                border-radius: 16px;
                background: linear-gradient(135deg, #2563eb, #10b981);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                animation: pulse 1.3s infinite ease-in-out;
              }

              .loading-text {
                font-size: 13px;
                color: #6b7280;
                font-weight: 600;
              }

              @keyframes pulse {
                0%, 100% {
                  transform: scale(.94);
                  opacity: .7;
                }

                50% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
            `,
          }}
        />

        <div className="loading-content">
          <div className="loading-icon">G</div>
          <div className="loading-text">
            Memasuki dimensi...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

            * {
              box-sizing: border-box;
            }

            .chat-page {
              height: 100vh;
              display: flex;
              flex-direction: column;
              background: #f3f4f6;
              font-family: 'Space Grotesk', system-ui, sans-serif;
              color: #1f2937;
              overflow: hidden;
            }

            /* =========================
               HEADER
            ========================= */

            .chat-header {
              flex-shrink: 0;
              background: #2563eb;
              color: white;
              padding: 15px 22px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 15px;
              box-shadow: 0 4px 18px rgba(37, 99, 235, 0.15);
              position: relative;
              z-index: 5;
            }

            .character-info {
              display: flex;
              align-items: center;
              gap: 12px;
              min-width: 0;
            }

            .character-avatar {
              width: 43px;
              height: 43px;
              flex-shrink: 0;
              border-radius: 14px;
              background: rgba(255,255,255,.18);
              border: 1px solid rgba(255,255,255,.18);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              font-weight: 700;
            }

            .character-meta {
              min-width: 0;
            }

            .character-name {
              margin: 0;
              font-size: 15px;
              line-height: 1.25;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 550px;
            }

            .mission-language {
              margin: 3px 0 0;
              font-size: 11px;
              opacity: .78;
              font-weight: 500;
            }

            .agent-pill {
              flex-shrink: 0;
              padding: 8px 12px;
              border-radius: 99px;
              background: rgba(255,255,255,.16);
              border: 1px solid rgba(255,255,255,.12);
              font-size: 10px;
              font-weight: 700;
              max-width: 180px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            /* =========================
               CHAT AREA
            ========================= */

            .messages-area {
              flex: 1;
              min-height: 0;
              overflow-y: auto;
              padding: 26px 20px 30px;
              display: flex;
              flex-direction: column;
              gap: 14px;
              scroll-behavior: smooth;
            }

            .message-row {
              width: 100%;
              display: flex;
            }

            .message-row.ai {
              justify-content: flex-start;
            }

            .message-row.student {
              justify-content: flex-end;
            }

            .message-wrapper {
              max-width: min(720px, 86%);
            }

            .message-bubble {
              padding: 14px 16px;
              border-radius: 20px;
              color: #1f2937;
              box-shadow: 0 5px 18px rgba(0,0,0,.035);
              border: 1px solid rgba(0,0,0,.025);
            }

            .message-bubble.ai {
              background: white;
              border-top-left-radius: 7px;
            }

            .message-bubble.student {
              background: #dcfce3;
              border-top-right-radius: 7px;
            }

            .message-text {
              margin: 0;
              line-height: 1.65;
              font-size: 14px;
              font-weight: 500;
              white-space: pre-wrap;
            }

            .message-label {
              font-size: 9px;
              font-weight: 700;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 6px;
            }

            /* =========================
               TYPING
            ========================= */

            .typing-bubble {
              align-self: flex-start;
              background: white;
              padding: 13px 16px;
              border-radius: 20px;
              border-top-left-radius: 7px;
              box-shadow: 0 5px 18px rgba(0,0,0,.035);
              color: #9ca3af;
              font-size: 12px;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 9px;
            }

            .typing-dots {
              display: flex;
              gap: 3px;
            }

            .typing-dots span {
              width: 5px;
              height: 5px;
              background: #9ca3af;
              border-radius: 50%;
              animation: typing 1.1s infinite ease-in-out;
            }

            .typing-dots span:nth-child(2) {
              animation-delay: .15s;
            }

            .typing-dots span:nth-child(3) {
              animation-delay: .3s;
            }

            @keyframes typing {
              0%, 60%, 100% {
                transform: translateY(0);
                opacity: .4;
              }

              30% {
                transform: translateY(-3px);
                opacity: 1;
              }
            }

            /* =========================
               IMAGE
            ========================= */

            .message-image {
              display: block;
              max-width: 320px;
              width: 100%;
              border-radius: 14px;
              margin-top: 9px;
              border: 1px solid rgba(0,0,0,.05);
            }

            /* =========================
               AUDIO
            ========================= */

            .message-audio {
              width: 100%;
              min-width: 250px;
              height: 38px;
              margin-top: 9px;
            }

            /* =========================
               SCORE CARD
            ========================= */

            .score-card {
              margin-top: 12px;
              padding: 13px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 15px;
            }

            .score-title {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              margin-bottom: 11px;
            }

            .score-title strong {
              font-size: 11px;
              color: #475569;
              font-weight: 700;
            }

            .ai-badge {
              padding: 4px 7px;
              border-radius: 7px;
              background: #eff6ff;
              color: #2563eb;
              font-size: 8px;
              font-weight: 700;
              letter-spacing: .7px;
              text-transform: uppercase;
            }

            .score-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 7px;
            }

            .score-item {
              background: white;
              border-radius: 10px;
              padding: 9px 7px;
              text-align: center;
              border: 1px solid #f1f5f9;
            }

            .score-icon {
              font-size: 13px;
              margin-bottom: 3px;
            }

            .score-label {
              display: block;
              font-size: 8px;
              color: #94a3b8;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: .4px;
            }

            .score-value {
              display: block;
              margin-top: 2px;
              color: #2563eb;
              font-size: 15px;
              font-weight: 700;
            }

            /* =========================
               COMPOSER
            ========================= */

            .composer {
              flex-shrink: 0;
              background: white;
              border-top: 1px solid #e5e7eb;
              padding: 12px 16px 16px;
              box-shadow: 0 -8px 25px rgba(0,0,0,.025);
              position: relative;
              z-index: 5;
            }

            .attachments {
              display: flex;
              gap: 7px;
              margin-bottom: 9px;
              min-height: 0;
            }

            .attachment {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 9px;
              border-radius: 9px;
              background: #eff6ff;
              color: #2563eb;
              border: 1px solid #dbeafe;
              font-size: 10px;
              font-weight: 700;
            }

            .composer-row {
              max-width: 900px;
              margin: 0 auto;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .action-button {
              flex: 1;
              min-width: 0;
              height: 48px;
              padding: 0 13px;
              border-radius: 15px;
              border: 1px solid #e5e7eb;
              background: #f9fafb;
              color: #374151;
              font-family: inherit;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              transition:
                transform .18s ease,
                background .18s ease,
                border-color .18s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            }

            .action-button:hover {
              transform: translateY(-1px);
              background: white;
              border-color: #d1d5db;
            }

            .action-button.recording {
              background: #ef4444;
              border-color: #ef4444;
              color: white;
              animation: recordingPulse 1.3s infinite;
            }

            @keyframes recordingPulse {
              0%, 100% {
                box-shadow: 0 0 0 0 rgba(239,68,68,.2);
              }

              50% {
                box-shadow: 0 0 0 6px rgba(239,68,68,0);
              }
            }

            .send-button {
              width: 54px;
              height: 48px;
              flex-shrink: 0;
              border: none;
              border-radius: 15px;
              background: #2563eb;
              color: white;
              font-family: inherit;
              font-size: 18px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 7px 17px rgba(37,99,235,.18);
              transition:
                transform .18s ease,
                opacity .18s ease,
                box-shadow .18s ease;
            }

            .send-button:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(37,99,235,.22);
            }

            .send-button:disabled {
              background: #9ca3af;
              cursor: not-allowed;
              box-shadow: none;
            }

            .composer-hint {
              max-width: 900px;
              margin: 8px auto 0;
              text-align: center;
              color: #cbd5e1;
              font-size: 9px;
              font-weight: 600;
              letter-spacing: .2px;
            }

            /* =========================
               MOBILE
            ========================= */

            @media (max-width: 600px) {
              .chat-header {
                padding: 12px 14px;
              }

              .character-avatar {
                width: 39px;
                height: 39px;
                border-radius: 12px;
              }

              .character-name {
                font-size: 13px;
                max-width: 210px;
              }

              .mission-language {
                font-size: 10px;
              }

              .agent-pill {
                max-width: 105px;
                padding: 7px 9px;
                font-size: 9px;
              }

              .messages-area {
                padding: 20px 12px 24px;
              }

              .message-wrapper {
                max-width: 91%;
              }

              .message-bubble {
                padding: 12px 13px;
                border-radius: 17px;
              }

              .message-text {
                font-size: 13px;
              }

              .score-grid {
                gap: 5px;
              }

              .score-item {
                padding: 8px 4px;
              }

              .score-label {
                font-size: 7px;
              }

              .composer {
                padding: 9px 10px 12px;
              }

              .composer-row {
                gap: 6px;
              }

              .action-button {
                height: 46px;
                padding: 0 7px;
                font-size: 9px;
              }

              .send-button {
                width: 49px;
                height: 46px;
              }

              .composer-hint {
                font-size: 8px;
              }
            }
          `,
        }}
      />

      {/* =========================
          HEADER
      ========================= */}

      <header className="chat-header">
        <div className="character-info">
          <div className="character-avatar">
            ✦
          </div>

          <div className="character-meta">
            <h2 className="character-name">
              {studentData.character_name}
            </h2>

            <p className="mission-language">
              Misi Bahasa · {roomData.language}
            </p>
          </div>
        </div>

        <div className="agent-pill">
          Agent · {studentData.student_name}
        </div>
      </header>

      {/* =========================
          MESSAGES
      ========================= */}

      <main className="messages-area">
        {isAiTyping && (
          <div className="typing-bubble">
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>

            Karakter sedang menyiapkan misi...
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-row ${
              msg.sender === 'ai' ? 'ai' : 'student'
            }`}
          >
            <div className="message-wrapper">

              <div
                className={`message-bubble ${
                  msg.sender === 'ai'
                    ? 'ai'
                    : 'student'
                }`}
              >

                <div className="message-label">
                  {msg.sender === 'ai'
                    ? studentData.character_name
                    : 'You'}
                </div>

                {msg.text && (
                  <p className="message-text">
                    {msg.text}
                  </p>
                )}

                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Temuan"
                    className="message-image"
                  />
                )}

                {msg.audioUrl && (
                  <audio
                    controls
                    src={msg.audioUrl}
                    className="message-audio"
                  />
                )}

                {msg.scoreCard && (
                  <div className="score-card">

                    <div className="score-title">
                      <strong>
                        📊 Penilaian AI
                      </strong>

                      <span className="ai-badge">
                        Evaluated
                      </span>
                    </div>

                    <div className="score-grid">

                      <div className="score-item">
                        <div className="score-icon">
                          🗣️
                        </div>

                        <span className="score-label">
                          Pronunciation
                        </span>

                        <span className="score-value">
                          {msg.scoreCard.pronunciation}
                        </span>
                      </div>

                      <div className="score-item">
                        <div className="score-icon">
                          🌊
                        </div>

                        <span className="score-label">
                          Fluency
                        </span>

                        <span className="score-value">
                          {msg.scoreCard.fluency}
                        </span>
                      </div>

                      <div className="score-item">
                        <div className="score-icon">
                          🎯
                        </div>

                        <span className="score-label">
                          Accuracy
                        </span>

                        <span className="score-value">
                          {msg.scoreCard.accuracy}
                        </span>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="typing-bubble">
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>

            AI sedang mengevaluasi suara dan fotomu...
          </div>
        )}
      </main>

      {/* =========================
          COMPOSER
      ========================= */}

      <div className="composer">

        {(imageFile || audioBlob) && (
          <div className="attachments">

            {imageFile && (
              <span className="attachment">
                📸 Foto Siap
              </span>
            )}

            {audioBlob && (
              <span className="attachment">
                🎤 VN Siap
              </span>
            )}

          </div>
        )}

        <div className="composer-row">

          {/* CAMERA */}
          <label className="action-button">
            <span>
              {imageFile ? '🔄' : '📷'}
            </span>

            <span>
              {imageFile
                ? 'Ganti Foto'
                : 'Jepret Benda'}
            </span>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) =>
                setImageFile(
                  e.target.files?.[0] || null
                )
              }
              style={{ display: 'none' }}
            />
          </label>

          {/* VOICE */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`action-button ${
              isRecording ? 'recording' : ''
            }`}
          >
            <span>
              {isRecording ? '⏺' : '🎙️'}
            </span>

            <span>
              {isRecording
                ? 'Merekam...'
                : 'Tahan VN'}
            </span>
          </button>

          {/* SEND */}
          <button
            onClick={kirimPesan}
            disabled={
              isSending ||
              (!imageFile && !audioBlob)
            }
            className="send-button"
            aria-label="Kirim"
          >
            {isSending ? '…' : '↑'}
          </button>

        </div>

        <div className="composer-hint">
          Kirim foto benda atau tahan tombol VN untuk melanjutkan misi
        </div>

      </div>
    </div>
  );
}

export default function ChatRoom() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: '50px',
            textAlign: 'center',
            color: '#1f2937',
          }}
        >
          Memuat sistem AI...
        </div>
      }
    >
      <ChatRoomContent />
    </Suspense>
  );
}
