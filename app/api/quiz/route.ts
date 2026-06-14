import { NextRequest, NextResponse } from 'next/server';
import { askClaude } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const { occasion, budget, feelings, room, email } = await req.json();

    const messages = [
      {
        role: 'user',
        content: `User answered a home furnishing quiz:
Occasion: ${occasion}
Budget: ${budget}
Desired feelings: ${Array.isArray(feelings) ? feelings.join(', ') : feelings}
Room type: ${room}

Return ONLY valid JSON, no markdown:
{
  "detected_style": "scandinavian|modern|loft|classic",
  "budget_min": number,
  "budget_max": number,
  "style_keywords": ["word1", "word2", "word3"],
  "secondary_styles": ["style2", "style3"]
}`
      }
    ];

    const content = await askClaude(messages);

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 });
    }

    const styleProfile = JSON.parse(jsonMatch[0]);

    // Include email in profile if provided
    if (email) {
      styleProfile.email = email;
    }

    return NextResponse.json(styleProfile);
  } catch (error) {
    console.error('Quiz error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Quiz processing failed' },
      { status: 500 }
    );
  }
}
