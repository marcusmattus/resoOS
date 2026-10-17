import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { message, history, currentFrequency, heartRate, hrv, bodyPart } = await req.json();

    const systemInstruction = `You are the ResOS Live Audio Guide and Bio-Harmonic Voice Companion.
You speak with calm, soothing, scientifically grounded warmth.
The user is currently in a sound healing session.
Session status:
- Active Frequency: ${currentFrequency || 528} Hz
- Target Area / Neural Link: ${bodyPart || 'Heart / Cardiac-Thymus'}
- Current Heart Rate: ${heartRate || 68} BPM
- Current HRV: ${hrv || 55} ms

Answer concisely (2-4 sentences max), guiding the user's breathing (inhale 4s, exhale 6s for vagal tone), explaining the acoustic resonance of the current frequency, or answering questions on their electromagnetic biofield. Keep responses calming and auditory-friendly.`;

    const chatContents = [];
    if (Array.isArray(history)) {
      for (const turn of history) {
        chatContents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        });
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: message || 'How is this frequency interacting with my heart rate and nervous system?' }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        systemInstruction,
      },
    });

    return NextResponse.json({
      text: response.text || '',
      modelUsed: 'gemini-3.8-live-companion',
    });
  } catch (error: unknown) {
    console.error('Voice Assistant Route Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error in voice conversation' },
      { status: 500 }
    );
  }
}
