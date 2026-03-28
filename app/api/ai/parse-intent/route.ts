import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TaskCreateInput, Label } from '@/app/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const { input, labels } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'input is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro"
    });

    const prompt = `
      You are a structured data extractor for a task management app. 
      Convert the following user input into a list of one or more structured Task objects.
      
      User Input: "${input}"
      
      Available Labels (ID and Name):
      ${labels.map((l: Label) => `- ${l.id}: ${l.name} (${l.kind})`).join('\n')}
      
      Current Date: ${new Date().toISOString().split('T')[0]}
      
      IMPORTANT: Return ONLY valid JSON. Do not include markdown formatting or backticks.
      
      JSON Schema:
      { "tasks": [ { "title": string, "priority": "urgent"|"high"|"medium"|"low", "dueDate": string|null, "labelIds": string[] } ] }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean potential markdown backticks
    text = text.replace(/```json|```/g, '').trim();
    
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

  } catch (err: any) {
    console.error('AI Parser Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
