# NESTGLOW — CLAUDE CODE MASTER FILE

## Core Problem We Solve

People move into empty homes and freeze.
Too many choices. Fear of buying wrong. No idea where to start.
Nestglow removes that fear: upload a photo or answer 5 questions,
get a complete room that matches your personality, buy everything at once.
Every design and UX decision must serve this: make the user feel understood and confident.

-----

## Tech Stack

- Framework: Next.js 14, App Router, TypeScript, Tailwind CSS
- AI: OpenRouter API → model: anthropic/claude-opus-4-5
- Image generation: Replicate API → model: adirik/interior-design
- Email: Resend API
- Data: local JSON file (no database)
- Deploy: Vercel

## Environment Variables

```
OPENROUTER_API_KEY=
REPLICATE_API_TOKEN=
RESEND_API_KEY=
```

-----

## Design System — Do Not Deviate

### Colors

```
--bg:       #FDFAF6   page background (warm white)
--surface:  #F5F0E8   cards, inputs
--border:   #E8E0D5   all borders
--accent:   #C4714A   buttons, highlights, active states
--accent2:  #E8956D   hover state for accent
--text:     #1A1A1A   primary text
--muted:    #7A7065   secondary text, placeholders
--success:  #4A8C6A   confirmation states
```

### Typography

```
Headings: "Cormorant Garamond", Georgia, serif — bold, tight tracking
Body: "Inter", sans-serif — regular weight
Sizes: h1=56px, h2=36px, h3=24px, body=16px, small=13px
Line height: headings=1.1, body=1.6
```

### Components

```
Cards: bg --surface, border 1px --border, radius 16px,
       shadow: 0 4px 24px rgba(0,0,0,0.06)
       on hover: translateY(-4px), shadow stronger
Buttons primary: bg --accent, color white, radius 100px,
                 padding 14px 32px, font-weight 600
                 on hover: bg --accent2, translateY(-2px)
Buttons secondary: border 1px --accent, color --accent,
                   bg transparent, same radius and padding
Inputs: bg white, border 1px --border, radius 12px,
        padding 14px 16px, on focus: border --accent
```

### Motion

```
All transitions: 200ms ease
Page enter: opacity 0->1 + translateY(16px->0), duration 400ms
Cards stagger: each card 120ms delay after previous
Loader dots: bounce animation, 400ms each, staggered
```

### Language Toggle

Top-right corner on every page.
“EN / RU” — clicking switches all text via i18n.
Store preference in localStorage key “nestglow_lang”.
Default: detect browser language, fallback to EN.

-----

## File Structure — Build In This Order

```
nestglow/
  CLAUDE.md
  app/
    layout.tsx          — fonts, metadata, lang provider
    page.tsx            — main screen (step 1)
    results/page.tsx    — 3 bundle cards (step 2)
    api/
      analyze/route.ts  — photo -> room JSON
      quiz/route.ts     — quiz answers -> style profile
      bundle/route.ts   — style + budget -> 3 bundles
      send/route.ts     — send email via Resend
  components/
    UploadZone.tsx      — drag/drop photo upload with preview
    Quiz.tsx            — 5-step quiz, full screen per step
    Loader.tsx          — full screen overlay, rotating messages
    BundleCard.tsx      — one complete room variant
    LangToggle.tsx      — EN/RU switcher
  lib/
    openrouter.ts       — all OpenRouter calls go here
    catalog.ts          — load and filter products.json
    i18n.ts             — all UI strings in EN and RU
  data/
    products.json       — 60 furniture items
```

-----

## OpenRouter — Always Use This Exact Pattern

```typescript
// lib/openrouter.ts
export async function askClaude(messages: {role: string, content: any}[]) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nestglow.vercel.app",
      "X-Title": "Nestglow"
    },
    body: JSON.stringify({
      model: "anthropic/claude-opus-4-5",
      max_tokens: 2000,
      messages
    })
  });
  const data = await res.json();
  return data.choices[0].message.content as string;
}
```

For vision (photo analysis), pass image as:

```typescript
content: [
  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
  { type: "text", text: "your prompt here" }
]
```

-----

## API Routes

### POST /api/analyze

**Input:** `{ image: string }` — base64 encoded photo
**Calls:** askClaude with vision
**Prompt:**

```
Analyze this room photo. Return ONLY valid JSON, no markdown:
{
  "room_type": "living_room|bedroom|studio|other",
  "approx_sqm": number,
  "current_style": "modern|scandinavian|loft|classic|eclectic",
  "lighting": "bright|medium|dark",
  "floor": "parquet|laminate|tile|carpet|other",
  "walls": "white|light|colored|dark",
  "existing_furniture": ["item1", "item2"],
  "potential_styles": ["style1", "style2", "style3"]
}
```

**Output:** parsed JSON object

### POST /api/quiz

**Input:** `{ occasion, budget, feelings[], room, email }`
**Calls:** askClaude text
**Prompt:**

```
User answered a home furnishing quiz:
Occasion: {occasion}
Budget: {budget}
Desired feelings: {feelings}
Room type: {room}

Return ONLY valid JSON, no markdown:
{
  "detected_style": "scandinavian|modern|loft|classic",
  "budget_min": number,
  "budget_max": number,
  "style_keywords": ["word1", "word2", "word3"],
  "secondary_styles": ["style2", "style3"]
}
```

**Output:** parsed JSON object

### POST /api/bundle

**Input:** `{ style, budget, roomData, quizData }`
**Logic:**

1. Load data/products.json
1. Filter: keep products where styles[] includes `style`
1. Filter: price <= budget * 0.45 (no single item over 45% of budget)
1. Take top 50 by relevance
1. Call askClaude 3 times in parallel with Promise.all
   — first call: primary style
   — second call: secondary style 1
   — third call: secondary style 2
   **Prompt for each:**

```
You are Nestglow AI interior designer.
User context: {roomData or quizData summary}
Target style: {style}
Budget: {budget} RUB

Available products:
{JSON.stringify(filteredProducts)}

Create the perfect room bundle. Rules:
- Pick ONLY products from the list above (by id)
- Total must be under {budget} RUB
- Must include: at least 1 sofa/chair + 1 table + 1 lamp + 1 decor
- Each item must genuinely fit the style
- Write reason in the user's detected language (RU or EN)

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
}
```

**Output:** array of 3 bundle objects, each with `monthly = total_price / 12`

### POST /api/send

**Input:** `{ email, bundle, lang }`
**Calls:** Resend API
**Subject EN:** “Your Nestglow room is ready 🏠”
**Subject RU:** “Ваша комната Nestglow готова 🏠”
**Body:** HTML email with bundle_name, style_tip, items table with prices,
total price, “Shop now” link per item to affiliate_url
**Output:** `{ success: true }`

-----

## Products JSON — One Item Structure

```json
{
  "id": "sofa_001",
  "name": "Oslo Sofa",
  "name_ru": "Диван Oslo",
  "category": "sofa",
  "styles": ["scandinavian", "modern"],
  "price": 42900,
  "colors": ["#C8BFB0", "#6B7280"],
  "image_url": "https://placehold.co/400x300/F5F0E8/C4714A?text=Oslo+Sofa",
  "affiliate_url": "https://hoff.ru/product/oslo-sofa",
  "dimensions": { "width": 220, "height": 85, "depth": 90 }
}
```

**Create 60 items. Distribution:**

- sofa/chair: 16 items — price 15000–120000
- table: 12 items — price 8000–45000
- lamp: 10 items — price 3000–25000
- rug: 8 items — price 5000–40000
- shelf: 7 items — price 6000–35000
- decor: 7 items — price 1000–15000

Each style (scandinavian, modern, loft, classic) must have
at least 2 items in every category.

-----

## User Flow — Exact Sequence

```
1. MAIN PAGE loads
   → Show hero: big headline + two entry points side by side
   → Left: UploadZone (drag/drop or click to upload)
   → Right: "No photo?" quiz entry card
   → Below both: budget slider ₽15,000 — ₽500,000
   → CTA button: "Find my perfect room →"

2A. PHOTO PATH
   → User drops photo → preview shows immediately
   → User sets budget → clicks CTA
   → Loader appears full screen
   → POST /api/analyze with base64 photo
   → Response: roomData
   → Continue to step 3

2B. QUIZ PATH
   → User clicks quiz card → Quiz modal opens
   → 5 steps, one per screen with progress bar
   → On final step: email input
   → On submit → Loader appears
   → POST /api/quiz with answers
   → Response: styleProfile
   → Continue to step 3

3. BUNDLE GENERATION
   → POST /api/bundle 3 times in parallel (Promise.all)
   → Loader shows rotating messages (3s each):
     EN: "Analyzing your space..." / "Matching your style..." /
         "Curating perfect pieces..." / "Almost ready..."
     RU: "Анализируем пространство..." / "Подбираем стиль..." /
         "Собираем комплект..." / "Почти готово..."
   → Save result to localStorage "nestglow_bundles"
   → router.push('/results')

4. RESULTS PAGE
   → 3 BundleCards appear with stagger animation
   → Active card: full opacity, slight scale up
   → Inactive cards: 85% opacity
   → Click card to make it active
   → Each card shows:
     - Style label badge
     - Items list with category emoji + name + price
     - Divider
     - Total price (large, accent color)
     - "or ₽X/month" below (muted, small)
     - "Get this room →" button
   → Clicking button:
     - If email known (from quiz): show confirmation modal
     - If no email: show email input modal
     - On submit: POST /api/send
     - Show success: "✓ Check your inbox"

5. BACK BUTTON
   → Always visible: "← Start over"
   → Clears localStorage, goes to main page
```

-----

## Category Emojis (use in item lists)

```
sofa → 🛋️
table → ☕
lamp → 💡
rug → 🪨
shelf → 📚
chair → 🪑
decor → 🌿
```

-----

## i18n Strings (lib/i18n.ts)

Define all UI text here. Never hardcode strings in components.

```typescript
export const t = {
  en: {
    hero_title: "Your room. Your taste. 2 minutes.",
    hero_sub: "Photo or quiz → complete room → buy instantly",
    upload_label: "Drop your room photo here",
    upload_sub: "or click to browse",
    quiz_label: "No photo? Answer 5 questions",
    quiz_sub: "We'll figure out your style",
    budget_label: "Your budget",
    cta: "Find my perfect room →",
    // ... add all strings
  },
  ru: {
    hero_title: "Ваша комната. Ваш стиль. 2 минуты.",
    hero_sub: "Фото или квиз → готовая комната → купить сразу",
    upload_label: "Перетащите фото комнаты сюда",
    upload_sub: "или нажмите для выбора",
    quiz_label: "Нет фото? Ответьте на 5 вопросов",
    quiz_sub: "Подберём стиль под вас",
    budget_label: "Ваш бюджет",
    cta: "Найти мою комнату →",
    // ... add all strings
  }
}
```

-----

## Error Handling — Non-Negotiable Rules

1. Every API route: wrap in try/catch, return `{ error: string }` on failure
1. Frontend: if API returns error → show toast “Something went wrong. Try again.”
   with retry button — never show blank screen
1. If Replicate fails → use placehold.co image, never break the flow
1. If bundle JSON is malformed → retry once, then show fallback message
1. Timeout: abort fetch after 60s, show “Taking longer than usual…”

-----

## Build Order — Follow Exactly

```
Phase 1 — Foundation (do not skip steps)
  1. Create Next.js project, install dependencies
  2. Set up Tailwind with design tokens (colors, fonts)
  3. Create data/products.json (60 items)
  4. Create lib/openrouter.ts
  5. Create lib/catalog.ts (load + filter functions)
  6. Create lib/i18n.ts (all strings EN + RU)
  7. Test: npm run dev shows blank page with correct fonts

Phase 2 — API (test each before moving on)
  8. POST /api/analyze — test with real photo via Postman
  9. POST /api/quiz — test with sample answers
  10. POST /api/bundle — test: confirm 3 bundles returned
  11. POST /api/send — test: email arrives in inbox

Phase 3 — UI
  12. app/layout.tsx — fonts, metadata
  13. components/LangToggle.tsx
  14. components/Loader.tsx
  15. components/UploadZone.tsx
  16. components/Quiz.tsx
  17. app/page.tsx — assemble main screen
  18. components/BundleCard.tsx
  19. app/results/page.tsx

Phase 4 — Connect + Polish
  20. Connect main page to APIs, full flow end to end
  21. Add all animations and transitions
  22. Mobile responsive check (375px, 768px, 1440px)
  23. Fix any bugs from full flow test
  24. Deploy to Vercel
```

-----

## MVP Definition

Done when a real person can:

1. Land on the page and immediately understand what to do
1. Upload a photo OR complete the quiz in under 3 minutes
1. See 3 complete room bundles with real product names and prices
1. Click “Get this room” and receive an email with the shopping list
1. Do all of the above on a mobile phone
