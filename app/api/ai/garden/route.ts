import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TaskRepository } from '@/app/lib/repositories';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
  }

  try {
    // 1. Fetch current backlog context
    const tasks = TaskRepository.list({ status: 'all' });
    
    if (tasks.length === 0) {
      return NextResponse.json({ insights: "Your garden is empty! Start by adding some tasks." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Productivity Coach and "Backlog Gardener." 
      Your goal is to review the following task list and provide 3-5 high-impact, actionable insights to improve the user's flow and mental clarity.
      
      Tasks:
      ${JSON.stringify(tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        itemType: t.itemType,
        objectiveId: t.objectiveId,
        parentItemId: t.parentItemId,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })), null, 2)}
      
      Current Date: ${new Date().toISOString().split('T')[0]}
      
      Guidelines for your Review:
      1. Reality Check: Are there too many "Urgent" tasks?
      2. Stale Detection: Identify tasks created long ago but never started.
      3. Decomposition: Suggest breaking down titles that look too complex.
      4. Type Balance: Are there unresolved decisions blocking actions? Ideas that should be promoted to actions? Initiatives without supporting actions?
      5. Orphaned Items: Flag items with null objectiveId and null parentItemId — these are unbound and need to be anchored to an objective or parent.
      6. Work-Life Balance: Group insights by "Physical/Personal" vs "Work/Mental" if applicable.
      
      Format the output as a Markdown-formatted report.
      Use clear headings like "### 🚜 The Reality Check" and "### ✂️ Pruning Suggestions".
      Keep the tone supportive but direct.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    return NextResponse.json({ insights: text });

  } catch (err: unknown) {
    console.error('AI Gardener Error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
