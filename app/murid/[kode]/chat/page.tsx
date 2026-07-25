"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

interface Message {
  sender: 'ai' | 'murid';
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  scoreCard?: { pronunciation: number; fluency: number; accuracy: number };
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

      const { data: sData } = await supabase.from('students').select('*').eq('id', studentId).single();
      const { data: rData } = await supabase.from('rooms').select('*').eq('room_code', roomCode).single();
      
      if (sData && rData) {
        setStudentData(sData);
        setRoomData(rData);
        
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isInitial: true, character: sData.character_name, language: rData.language })
          });
          const result = await response.json();
          if (result.reply) {
            setMessages([{ sender: 'ai', text: result.reply }]);
          }
        } catch (e) {
          setMessages([{ sender: 'ai', text: "Koneksi terganggu. Reload halaman ya." }]);
        } finally {
          setIsAiTyping(false);
        }
      }
    };
    fetchData();
  }, [studentId, roomCode, router]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop()); 
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Izinkan akses mikrofon terlebih dahulu!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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

  const kirimPesan = async () => {
    if (!imageFile && !audioBlob) {
      return alert("Kirimkan Voice Note atau Foto benda terlebih dahulu!");
    }

    setIsSending(true);

    const imageUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
    const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : undefined;
    
    setMessages(prev => [...prev, { sender: 'murid', imageUrl, audioUrl }]);

    try {
      const imageBase64 = imageFile ? await fileToBase64(imageFile) : undefined;
      const audioBase64 = audioBlob ? await fileToBase64(audioBlob) : undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isInitial: false,
          imageBase64,
          imageMimeType: imageFile?.type,
          audioBase64,
          audioMimeType: audioBlob?.type,
          character: studentData.character_name,
          language: roomData.language
        })
      });

      const result = await response.json();
      
      if (result.reply) {
        const p = result.pronunciation || 75;
        const f = result.fluency || 75;
        const a = result.accuracy || 75;
        const total = Math.round((p + f + a) / 3);

        await supabase.from('students').update({
          pronunciation_score: p,
          fluency_score: f,
          accuracy_score: a,
          total_score: total,
          mission_status: 'Misi Berjalan'
        }).eq('id', studentId);

        setMessages(prev => [
          ...prev, 
          { 
            sender: 'ai', 
            text: result.reply,
            scoreCard: { pronunciation: p, fluency: f, accuracy: a }
          }
        ]);
      } else {
        throw new Error();
      }
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Maaf, gagal memproses penilaian. Coba kirim ulang." }]);
    }

    setImageFile(null);
    setAudioBlob(null);
    setIsSending(false);
  };

  if (!studentData) return <div style={{ padding: '50px', textAlign: 'center', color: '#1f2937' }}>Memasuki dimensi...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{studentData.character_name}</h2>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Misi Bahasa {roomData.language}</p>
        </div>
        <div style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '15px' }}>
          Agent: {studentData.student_name}
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {isAiTyping && (
          <div style={{ alignSelf: 'flex-start', backgroundColor: 'white', padding: '12px', borderRadius: '12px', color: '#6b7280', fontStyle: 'italic' }}>
            Karakter sedang menyiapkan misi...
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} style={{ alignSelf: msg.sender === 'ai' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
            <div style={{ 
              backgroundColor: msg.sender === 'ai' ? 'white' : '#dcfce3', 
              padding: '12px', 
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              color: '#1f2937'
            }}>
              {msg.text && <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.text}</p>}
              
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Temuan" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px' }} />
              )}
              {msg.audioUrl && (
                <audio controls src={msg.audioUrl} style={{ width: '100%', height: '35px', marginTop: '8px' }} />
              )}

              {msg.scoreCard && (
                <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                  <strong>📊 Penilaian AI:</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>🗣️ Pronunciation: <b>{msg.scoreCard.pronunciation}</b></span>
                    <span>🌊 Fluency: <b>{msg.scoreCard.fluency}</b></span>
                    <span>🎯 Accuracy: <b>{msg.scoreCard.accuracy}</b></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isSending && <div style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '14px' }}>AI sedang mengevaluasi suara dan fotomu...</div>}
      </div>

      <div style={{ backgroundColor: 'white', padding: '15px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          {imageFile && <span style={{ fontSize: '12px', padding: '5px', backgroundColor: '#e0f2fe', borderRadius: '4px', color: '#1f2937' }}>📸 Foto Siap</span>}
          {audioBlob && <span style={{ fontSize: '12px', padding: '5px', backgroundColor: '#e0f2fe', borderRadius: '4px', color: '#1f2937' }}>🎤 VN Siap</span>}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ flex: 1, backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid #ccc', color: '#374151', fontWeight: 'bold' }}>
            {imageFile ? 'Ganti Foto' : '📷 Jepret Benda'}
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
          </label>

          <button 
            onMouseDown={startRecording} 
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            style={{ 
              flex: 1, 
              backgroundColor: isRecording ? '#ef4444' : '#f3f4f6', 
              color: isRecording ? 'white' : '#374151', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #ccc', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isRecording ? 'Merekam... (Lepas)' : '🎙️ Tahan VN'}
          </button>

          <button 
            onClick={kirimPesan}
            disabled={isSending || (!imageFile && !audioBlob)}
            style={{ 
              backgroundColor: (isSending || (!imageFile && !audioBlob)) ? '#9ca3af' : '#2563eb', 
              color: 'white', 
              padding: '12px 20px', 
              borderRadius: '8px', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatRoom() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center', color: '#1f2937' }}>Memuat sistem AI...</div>}>
      <ChatRoomContent />
    </Suspense>
  );
}