import { NextRequest, NextResponse } from 'next/server';
import { askClaude } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${image}` }
          },
          {
            type: 'text',
            text: `Analyze this room photo. Return ONLY valid JSON, no markdown:
{
  "room_type": "living_room|bedroom|studio|other",
  "approx_sqm": number,
  "current_style": "modern|scandinavian|loft|classic|eclectic",
  "lighting": "bright|medium|dark",
  "floor": "parquet|laminate|tile|carpet|other",
  "walls": "white|light|colored|dark",
  "existing_furniture": ["item1", "item2"],
  "potential_styles": ["style1", "style2", "style3"]
}`
          }
        ]
      }
    ];

    const content = await askClaude(messages);

    // Extract JSON from response (handle possible markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 });
    }

    const roomData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(roomData);
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
