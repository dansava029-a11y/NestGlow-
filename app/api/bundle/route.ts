import { NextRequest, NextResponse } from 'next/server';
import { askClaude } from '@/lib/openrouter';
import { loadProducts, filterByStyle, filterByBudget, getTop } from '@/lib/catalog';

const STYLE_VARIANTS = [
  { style: 'scandinavian', label: 'Scandinavian', label_ru: 'Скандинавский' },
  { style: 'modern', label: 'Modern', label_ru: 'Современный' },
  { style: 'loft', label: 'Loft', label_ru: 'Лофт' },
  { style: 'classic', label: 'Classic', label_ru: 'Классика' },
];

async function generateBundle(
  style: string,
  budget: number,
  filteredProducts: any[],
  contextSummary: string,
  retries = 1
): Promise<any> {
  const messages = [
    {
      role: 'user',
      content: `You are Nestglow AI interior designer.
User context: ${contextSummary}
Target style: ${style}
Budget: ${budget} RUB

Available products:
${JSON.stringify(filteredProducts, null, 2)}

Create the perfect room bundle. Rules:
- Pick ONLY products from the list above (by id)
- Total must be under ${budget} RUB
- Must include: at least 1 sofa/chair + 1 table + 1 lamp + 1 decor
- Each item must genuinely fit the style
- Write reason in Russian if context suggests Russian user, otherwise English

Return ONLY valid JSON, no markdown:
{
  "bundle_name": "name in detected language",
  "style_label": "style display name",
  "total_price": number,
  "style_tip": "one actionable tip to complete this look",
  "items": [
    {
      "product_id": "id from catalog",
      "name": "product name",
      "price": number,
      "category": "sofa|table|lamp|rug|shelf|chair|decor",
      "reason": "why this fits the user specifically"
    }
  ]
}`
    }
  ];

  try {
    const content = await askClaude(messages);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const bundle = JSON.parse(jsonMatch[0]);
    bundle.monthly = Math.round(bundle.total_price / 12);
    return bundle;
  } catch (err) {
    if (retries > 0) {
      return generateBundle(style, budget, filteredProducts, contextSummary, retries - 1);
    }
    // Fallback bundle
    const items = filteredProducts.slice(0, 5);
    const total = items.reduce((sum: number, p: any) => sum + p.price, 0);
    return {
      bundle_name: `${style.charAt(0).toUpperCase() + style.slice(1)} Room`,
      style_label: style,
      total_price: total,
      monthly: Math.round(total / 12),
      style_tip: 'Mix textures and natural materials for a cohesive look.',
      items: items.map((p: any) => ({
        product_id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        reason: 'A great fit for this style.'
      }))
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { style, budget, roomData, quizData } = await req.json();

    const allProducts = loadProducts();

    // Determine styles to use
    const primaryStyle = style || roomData?.current_style || quizData?.detected_style || 'modern';
    const secondaryStyles = quizData?.secondary_styles || [];

    // Get style variants for 3 bundles
    const styles = [
      primaryStyle,
      secondaryStyles[0] || STYLE_VARIANTS.find(s => s.style !== primaryStyle)?.style || 'scandinavian',
      secondaryStyles[1] || STYLE_VARIANTS.find(s => s.style !== primaryStyle && s.style !== secondaryStyles[0])?.style || 'loft',
    ];

    const effectiveBudget = budget || quizData?.budget_max || 150000;

    const contextSummary = roomData
      ? `Room type: ${roomData.room_type}, current style: ${roomData.current_style}, lighting: ${roomData.lighting}`
      : quizData
      ? `Occasion: ${quizData.occasion || 'general'}, feelings: ${quizData.style_keywords?.join(', ') || 'comfortable'}`
      : 'General home furnishing';

    // Generate 3 bundles in parallel
    const bundles = await Promise.all(
      styles.map(async (s) => {
        const filtered = filterByStyle(allProducts, s);
        const budgeted = filterByBudget(filtered, effectiveBudget);
        const top = getTop(budgeted, 50);
        return generateBundle(s, effectiveBudget, top, contextSummary);
      })
    );

    return NextResponse.json(bundles);
  } catch (error) {
    console.error('Bundle error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bundle generation failed' },
      { status: 500 }
    );
  }
}
