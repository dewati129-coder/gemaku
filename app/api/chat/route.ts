import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            reply: { type: SchemaType.STRING, description: "Balasan karakter" },
            pronunciation: { type: SchemaType.INTEGER, description: "Skor pelafalan dari 0-100" },
            fluency: { type: SchemaType.INTEGER, description: "Skor kelancaran dari 0-100" },
            accuracy: { type: SchemaType.INTEGER, description: "Skor ketepatan bahasa dari 0-100" }
          },
          required: ["reply", "pronunciation", "fluency", "accuracy"],
        },
      },
    });

    // 1. Trik Mengacak Benda dengan JavaScript
    const daftarBenda = [
      'botol minum', 'sendok', 'sepatu', 'tas ransel', 
      'jam tangan', 'pensil', 'kacamata', 'penghapus', 
      'jaket', 'topi', 'sapu', 'kunci'
    ];
    const targetBenda = daftarBenda[Math.floor(Math.random() * daftarBenda.length)];

    let prompt = "";
    
    // 2. Mempertegas Prompt agar patuh pada bahasa room
    if (isInitial) {
      prompt = `PERANMU: Kamu adalah pahlawan/tokoh sejarah bernama ${character}.
      SITUASI: Kamu sedang memandu murid yang mengambil misi bahasa ${language}.
      TUGAS: 
      1. Sapa murid dengan gaya dan ciri khas karaktermu.
      2. Berikan dia misi mendesak untuk memfoto dan menjelaskan benda ini: "${targetBenda}".
      ATURAN MUTLAK: Balasanmu WAJIB 100% menggunakan bahasa ${language}. Jika room bahasa Jawa, gunakan bahasa Jawa sepenuhnya. Jika Inggris, gunakan bahasa Inggris sepenuhnya.
      Batas: Maksimal 3 kalimat. Set skor pronunciation, fluency, dan accuracy ke angka 0.`;
    } else {
      prompt = `PERANMU: Kamu adalah ${character}.
      SITUASI: Mengevaluasi hasil temuan benda murid dalam bahasa ${language}.
      TUGAS:
      1. Berikan nilai 0-100 yang jujur untuk pronunciation, fluency, dan accuracy berdasarkan bukti gambar/suara yang mereka kirim.
      2. Berikan komentar evaluasi dan semangat untuk misi selanjutnya.
      ATURAN MUTLAK: Balasan WAJIB 100% menggunakan bahasa ${language}.
      Batas: Maksimal 3 kalimat.`;
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
    console.error("Gemini Error:", error);
    return NextResponse.json({ 
      reply: "Maaf, dimensi komunikasi terganggu sesaat. Coba reload sistemnya.", 
      pronunciation: 0, 
      fluency: 0, 
      accuracy: 0 
    });
  }
}
