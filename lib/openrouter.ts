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
