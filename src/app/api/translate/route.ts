import { NextResponse } from 'next/server';

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export async function POST(request: Request) {
  try {
    if (!process.env.DEEPL_API_KEY) {
      console.error('DEEPL_API_KEY not found');
      return NextResponse.json(
        { error: 'Translation service not configured' },
        { status: 503 }
      );
    }

    const { text, targetLang } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ translation: "" });
    }

    console.log(`Translating to ${targetLang}: "${text}"`);

    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang || "ES",
      }),
    });

    if (!response.ok) {
      console.error(`DeepL API error: ${response.status}`);
      return NextResponse.json(
        { error: "Translation service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log("Translation received:", data.translations[0].text);
    
    return NextResponse.json({ translation: data.translations[0].text });
  } catch (error) {
    console.error("Translation Error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
} 