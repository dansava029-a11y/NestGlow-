import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const CATEGORY_EMOJIS: Record<string, string> = {
  sofa: '🛋️',
  table: '☕',
  lamp: '💡',
  rug: '🪨',
  shelf: '📚',
  chair: '🪑',
  decor: '🌿',
};

function formatPrice(price: number): string {
  return `₽${price.toLocaleString('ru-RU')}`;
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, bundle, lang } = await req.json();

    if (!email || !bundle) {
      return NextResponse.json({ error: 'Email and bundle are required' }, { status: 400 });
    }

    const isRu = lang === 'ru';
    const subject = isRu
      ? 'Ваша комната Nestglow готова 🏠'
      : 'Your Nestglow room is ready 🏠';

    const itemsHtml = bundle.items
      .map((item: any) => {
        const emoji = CATEGORY_EMOJIS[item.category] || '•';
        return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #E8E0D5;">
            ${emoji} ${item.name}
            <br/><small style="color: #7A7065;">${item.reason || ''}</small>
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #E8E0D5; text-align: right; font-weight: 600; color: #C4714A;">
            ${formatPrice(item.price)}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #E8E0D5; text-align: center;">
            <a href="${item.affiliate_url || '#'}" style="background: #C4714A; color: white; padding: 6px 14px; border-radius: 100px; text-decoration: none; font-size: 13px;">
              ${isRu ? 'Купить' : 'Shop'}
            </a>
          </td>
        </tr>
      `;
      })
      .join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FDFAF6; font-family: Inter, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-family: Georgia, serif; font-size: 36px; color: #1A1A1A; margin: 0;">
        NestGlow
      </h1>
      <p style="color: #7A7065; margin: 8px 0 0;">${isRu ? 'Ваша идеальная комната готова' : 'Your perfect room is ready'}</p>
    </div>

    <!-- Bundle Card -->
    <div style="background: #F5F0E8; border: 1px solid #E8E0D5; border-radius: 16px; padding: 32px; margin-bottom: 32px;">
      <div style="display: inline-block; background: #C4714A; color: white; padding: 4px 12px; border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
        ${bundle.style_label || bundle.bundle_name}
      </div>
      <h2 style="font-family: Georgia, serif; font-size: 28px; color: #1A1A1A; margin: 0 0 8px;">
        ${bundle.bundle_name}
      </h2>
      ${bundle.style_tip ? `<p style="color: #7A7065; margin: 0 0 24px; font-style: italic;">💡 ${bundle.style_tip}</p>` : ''}

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #E8E0D5;">
            <th style="padding: 10px 8px; text-align: left; font-size: 13px; color: #7A7065; font-weight: 600;">
              ${isRu ? 'Товар' : 'Item'}
            </th>
            <th style="padding: 10px 8px; text-align: right; font-size: 13px; color: #7A7065; font-weight: 600;">
              ${isRu ? 'Цена' : 'Price'}
            </th>
            <th style="padding: 10px 8px; text-align: center; font-size: 13px; color: #7A7065; font-weight: 600;">
              ${isRu ? 'Магазин' : 'Shop'}
            </th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Total -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #E8E0D5; text-align: right;">
        <div style="font-size: 13px; color: #7A7065; margin-bottom: 4px;">
          ${isRu ? 'Итого' : 'Total'}
        </div>
        <div style="font-size: 32px; font-weight: 700; color: #C4714A; font-family: Georgia, serif;">
          ${formatPrice(bundle.total_price)}
        </div>
        <div style="font-size: 13px; color: #7A7065; margin-top: 4px;">
          ${isRu ? `или ₽${bundle.monthly?.toLocaleString('ru-RU')}/мес` : `or ₽${bundle.monthly?.toLocaleString('ru-RU')}/month`}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #7A7065; font-size: 13px;">
      <p>NestGlow — ${isRu ? 'Ваша комната за 2 минуты' : 'Your room in 2 minutes'}</p>
      <p style="margin-top: 4px;">
        <a href="https://nestglow.vercel.app" style="color: #C4714A; text-decoration: none;">nestglow.vercel.app</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: 'NestGlow <hello@nestglow.vercel.app>',
      to: email,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
