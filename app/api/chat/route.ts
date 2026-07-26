import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key belum diatur" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const body = await req.json();
    const { isInitial, imageBase64, imageMimeType, audioBase64, audioMimeType, character, language } = body;

    // KITA KEMBALI GUNAKAN MODEL YANG AKTIF DAN STABIL
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const daftarBenda = [
      'botol minum', 'sendok', 'sepatu', 'tas ransel', 
      'jam tangan', 'pensil', 'kacamata', 'penghapus', 
      'jaket', 'topi', 'sapu', 'kunci'
    ];
    const targetBenda = daftarBenda[Math.floor(Math.random() * daftarBenda.length)];

    let prompt = "";
    
    if (isInitial) {
      prompt = `PERANMU: Kamu adalah pahlawan/tokoh sejarah bernama ${character}.
      SITUASI: Kamu sedang memandu murid yang mengambil misi bahasa ${language}.
      TUGAS: Sapa murid dengan gaya dan ciri khas karaktermu. Berikan dia misi mendesak untuk memfoto dan menjelaskan benda ini: "${targetBenda}".
      ATURAN MUTLAK: Balasanmu WAJIB 100% menggunakan bahasa ${language}.
      
      KEMBALIKAN OUTPUT DALAM FORMAT JSON PERSIS SEPERTI INI (TANPA MARKDOWN):
      {
        "reply": "Balasan karaktermu di sini (maksimal 3 kalimat)",
        "pronunciation": 0,
        "fluency": 0,
        "accuracy": 0
      }`;
    } else {
      prompt = `PERANMU: Kamu adalah ${character}.
      SITUASI: Mengevaluasi hasil temuan benda murid dalam bahasa ${language}.
      TUGAS: Berikan nilai 0-100 yang jujur untuk pronunciation, fluency, dan accuracy berdasarkan bukti gambar/suara yang mereka kirim.
      ATURAN MUTLAK: Balasan WAJIB 100% menggunakan bahasa ${language}.
      
      KEMBALIKAN OUTPUT DALAM FORMAT JSON PERSIS SEPERTI INI (TANPA MARKDOWN):
      {
        "reply": "Komentar evaluasi dan penyemangatmu di sini (maksimal 3 kalimat)",
        "pronunciation": [isi dengan angka penilaianmu dari 0-100],
        "fluency": [isi dengan angka penilaianmu dari 0-100],
        "accuracy": [isi dengan angka penilaianmu dari 0-100]
      }`;
    }

    const parts: any[] = [prompt];
    if (imageBase64) {
      parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType || 'image/jpeg' } });
    }
    if (audioBase64) {
      parts.push({ inlineData: { data: audioBase64, mimeType: audioMimeType || 'audio/webm' } });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Gemini Error Detail:", error);
    return NextResponse.json({ 
      reply: "Sistem komunikasi GEMA sedang menyesuaikan frekuensi. Coba kirim ulang pesanmu ya, agen!", 
      pronunciation: 0, 
      fluency: 0, 
      accuracy: 0 
    });
  }
}
