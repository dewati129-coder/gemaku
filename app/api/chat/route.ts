import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key belum diatur' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const body = await req.json();
    const {
      isInitial,
      imageBase64,
      imageMimeType,
      audioBase64,
      audioMimeType,
      character,
      language,
    } = body;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            reply: {
              type: SchemaType.STRING,
              description: 'Balasan karakter dalam bahasa target (2-3 kalimat)',
            },
            pronunciation: {
              type: SchemaType.INTEGER,
              description: 'Skor pelafalan dari 0 sampai 100',
            },
            fluency: {
              type: SchemaType.INTEGER,
              description: 'Skor kelancaran dari 0 sampai 100',
            },
            accuracy: {
              type: SchemaType.INTEGER,
              description: 'Skor ketepatan dari 0 sampai 100',
            },
          },
          required: ['reply', 'pronunciation', 'fluency', 'accuracy'],
        },
      },
    });

    let prompt = '';
    if (isInitial) {
      prompt = `You are ${character}, guiding a student learning ${language}. Greet them in character and immediately give them a fun mission to find a specific object in the classroom. Set pronunciation, fluency, and accuracy scores to 0. Reply ONLY in JSON format containing reply, pronunciation, fluency, and accuracy.`;
    } else {
      prompt = `You are ${character}, guiding a student learning ${language}. Evaluate their audio/image response regarding the mission. Give strict scores from 0 to 100 for pronunciation, fluency, and accuracy. Reply in character, encouraging them and giving the next step, ONLY in JSON format.`;
    }

    const parts: any[] = [prompt];
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType || 'image/jpeg',
        },
      });
    }
    if (audioBase64) {
      parts.push({
        inlineData: {
          data: audioBase64,
          mimeType: audioMimeType || 'audio/webm',
        },
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Gemini Error Detail:', error);
    // Fallback yang aman agar tidak memunculkan error teks biasa
    return NextResponse.json({
      reply: `Greetings, Agent! I am ready to guide you. Let's begin our mission! Find a book in this room.`,
      pronunciation: 0,
      fluency: 0,
      accuracy: 0,
    });
  }
}
