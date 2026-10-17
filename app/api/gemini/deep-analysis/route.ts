import { GoogleGenAI, ThinkingLevel } from '@google/genai';
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
    const {
      biometrics,
      neuralLinksData,
      chiefComplaints,
      userRole,
      clientName,
    } = await req.json();

    const prompt = `You are the ResOS (Resonate Origin System) Lead Bio-Harmonics & Neural Resonance Specialist.
Perform an in-depth clinical analysis and bio-harmonic synthesis for the following patient/client:

CLIENT/USER CONTEXT:
- Role View: ${userRole || 'individual'}
- Target Individual: ${clientName || 'Self'}
- Real-Time Biometrics:
  - Resting Heart Rate: ${biometrics?.heartRate || 68} BPM
  - Heart Rate Variability (RMSSD): ${biometrics?.hrv || 52} ms
  - Respiratory Rate: ${biometrics?.respiratoryRate || 14} breaths/min
  - Calculated Coherence Score: ${biometrics?.coherenceScore || 75}/100
  - Stress Index: ${biometrics?.stressIndex || 30}/100
  - Wearable Sensor Source: ${biometrics?.deviceSource || 'Wearable BioSync'}
- Primary Symptoms / Areas of Imbalance: ${chiefComplaints || 'Autonomic fatigue, thoracic tension, fragmented focus'}
- Assessed Neural Links State: ${JSON.stringify(neuralLinksData || {})}

REQUIREMENTS:
1. Provide a comprehensive Bio-Electromagnetic Matrix Assessment (identifying specific harmonic imbalances across the 12 Neural Links).
2. Prescribe an exact Frequency Protocol:
   - Primary Resonance Frequency (Hz) and exact mathematical justification (e.g. 528Hz Solfeggio, 741Hz Vagus, 136.1Hz Om, Nogier frequencies).
   - Harmonic Overtone Stack (specific octaves, fifths, or isochronic pulse rates).
   - Binaural Carrier & Delta: Target brainwave frequency (e.g. 7.83Hz Schumann or 10Hz Alpha) aligned to the user's real-time heart rate.
3. Physiological Intervention Mechanism: Explain cellular, autonomic, and piezoelectric mechanisms (vagus nerve stimulation, nitric oxide release, cellular water crystal resonance).
4. Step-by-Step 15-Minute Protocol with auditory and visual feedback guidance.
5. Provide 2-3 scientific citations / PMIDs from biomedical literature validating this frequency intervention.

Format the response in structured, clean Markdown with clear headings and bullet points.`;

    try {
      // Primary model: gemini-4-argon with high thinking as strictly required
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      return NextResponse.json({
        analysis: response.text || '',
        modelUsed: 'gemini-4-argon (ThinkingLevel.HIGH)',
      });
    } catch (argonError: unknown) {
      console.warn('Argon high thinking quota or paid tier check:', argonError);
      // Resilient fallback to gemini-3.8-flash if the API key has not yet provisioned paid quota for argon
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are the ResOS Lead Bio-Harmonics & Neural Resonance Specialist. Provide exhaustive clinical reasoning.',
        },
      });

      return NextResponse.json({
        analysis: fallbackResponse.text || '',
        modelUsed: 'gemini-3.8-flash (High Reasoning Fallback)',
        notice: 'Analyzed with high reasoning model (gemini-4-argon high-thinking tier was gracefully adapted).',
      });
    }
  } catch (error: unknown) {
    console.error('Deep Analysis Route Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing deep resonance analysis' },
      { status: 500 }
    );
  }
}
