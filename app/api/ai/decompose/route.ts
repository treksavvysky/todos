import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a productivity expert. Your goal is to break down a vague or complex task into small, actionable, bite-sized sub-tasks.
      
      Task Title: "${title}"
      ${description ? `Task Description: "${description}"` : ''}
      
      Format the output as a Markdown checklist. 
      Use the following style:
      ### 📋 Action Plan:
      - [ ] Sub-task 1
      - [ ] Sub-task 2
      ...
      
      Rules:
      1. Provide 5-10 actionable steps.
      2. Each step must be concise and start with a strong verb.
      3. Do not include introductory or concluding text. Just the Markdown checklist.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    return NextResponse.json({ checklist: text });

  } catch (err: any) {
    console.error('AI Decomposition Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
