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
    const { prompt, model, systemInstruction } = await req.json();

    // Use gemini-3.1-flash-lite for fast tasks or gemini-3.8-flash for general tasks
    const targetModel = model || 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
      config: systemInstruction
        ? {
            systemInstruction,
          }
        : undefined,
    });

    return NextResponse.json({
      text: response.text || '',
      modelUsed: targetModel,
    });
  } catch (error: unknown) {
    console.error('Gemini Generate Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generating content' },
      { status: 500 }
    );
  }
}
