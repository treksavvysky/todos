import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Label } from '@/app/lib/types';

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
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are a structured data extractor for a task management app. 
      Convert the following user input into a list of one or more structured Task objects.
      
      User Input: "${input}"
      
      Available Labels (ID and Name):
      ${labels.map((l: Label) => `- ${l.id}: ${l.name} (${l.kind})`).join('\n')}
      
      Current Date: ${new Date().toISOString().split('T')[0]}
      
      Rules:
      1. Extract the core action as the "title".
      2. Identify "priority" (urgent, high, medium, low). Default to "medium".
      3. Identify "itemType" — what kind of work this represents:
         - "action": something to execute (buy, call, send, fix, build, write, etc.)
         - "decision": something to resolve (decide, choose, evaluate, whether, should I, etc.)
         - "initiative": a container for coordinated work (project, launch, redesign, migration, etc.)
         - "idea": something to preserve without immediate commitment (idea, maybe, someday, what if, explore, etc.)
         - "maintenance": recurring operational upkeep (maintain, clean, review, backup, update, renew, etc.)
         Default to "action" if unclear.
      4. Extract "dueDate" in YYYY-MM-DD format if mentioned.
      5. Match "labelIds" based on the provided list. If an intent clearly belongs to a scope (like "gym" to "Health"), include that ID even if not explicitly named.
      6. Return a JSON object with a "tasks" array containing objects matching this schema:
         { "title": string, "priority": "urgent"|"high"|"medium"|"low", "itemType": "action"|"decision"|"initiative"|"idea"|"maintenance", "dueDate": string|null, "labelIds": string[] }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean potential markdown backticks
    text = text.replace(/```json|```/g, '').trim();
    
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

  } catch (err: unknown) {
    console.error('AI Parser Error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
