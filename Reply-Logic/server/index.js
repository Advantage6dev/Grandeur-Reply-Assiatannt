import express from 'express';
import cors from 'cors';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3001;
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
// Any model that Ollama serves works here. Change it with the MODEL variable.
const MODEL = process.env.MODEL ?? 'gemma3:4b';

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

// Demo mode always uses the sample data. Her real data lives in
// server/data/shop.json, which is ignored by Git and never published.
function loadShop(demo) {
  const real = path.join(__dirname, 'data', 'shop.json');
  const sample = path.join(__dirname, 'data', 'shop.sample.json');
  const file = !demo && existsSync(real) ? real : sample;
  return JSON.parse(readFileSync(file, 'utf8'));
}

// Ask the model for JSON that matches a schema.
async function askModel(system, user, schema) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: schema,
      options: { temperature: 0.2 },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.message.content);
}

// STEP 1 (AI): read the customer's message and pull out what they want.
async function understand(message, shop) {
  const list = shop.items.map((i) => `${i.id} = ${i.name}`).join('\n');
  const system = `You read a customer's message for a small food and beads shop.
Return only JSON.
Choose items ONLY from this list, using the exact id:
${list}
If the customer asks for something not on the list, leave it out.
qty is how many they want (1 if not said).
area is the delivery area or place they name, or an empty string.
language is the language the customer wrote in, for example "English", "Yoruba" or "Pidgin".`;

  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' }, qty: { type: 'integer' } },
          required: ['id', 'qty'],
        },
      },
      area: { type: 'string' },
      language: { type: 'string' },
    },
    required: ['items', 'area', 'language'],
  };
  return askModel(system, message, schema);
}

// STEP 2 (code): match items to the catalog and do all the maths.
function price(parsed, shop) {
  const found = new Map();
  const unavailable = [];

  for (const row of parsed.items ?? []) {
    const item = shop.items.find((i) => i.id === row.id);
    if (!item) continue;
    const qty = Math.min(Math.max(Number(row.qty) || 1, 1), 100);
    if (!item.available) {
      if (!unavailable.includes(item.name)) unavailable.push(item.name);
      continue;
    }
    found.set(item.id, { item, qty: (found.get(item.id)?.qty ?? 0) + qty });
  }

  const lines = [...found.values()].map(({ item, qty }) => ({
    text: `${item.name} x${qty}: ${naira.format(item.price * qty)}`,
    amount: item.price * qty,
  }));

  const areaText = (parsed.area ?? '').trim().toLowerCase();
  const zone = areaText
    ? shop.delivery.find((d) => areaText.includes(d.area.toLowerCase()))
    : undefined;

  let deliveryFee = 0;
  let deliveryNote = '';
  if (lines.length > 0) {
    if (zone) {
      deliveryFee = zone.fee;
      lines.push({
        text: `Delivery to ${zone.area}: ${naira.format(zone.fee)}`,
        amount: zone.fee,
      });
    } else if (areaText) {
      deliveryNote = `I will confirm the delivery fee for ${parsed.area}.`;
    } else {
      deliveryNote =
        'Please send your delivery address so I can confirm the delivery fee.';
    }
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return {
    lines,
    total,
    itemsFound: found.size,
    unavailable,
    deliveryNote,
    deliveryFee,
  };
}

// STEP 3 (AI): write only a short greeting and closing, in the customer's language.
async function writeTone(language, shop) {
  const system = `You write short, warm messages for the owner of ${shop.shopName}, a small food and beads shop in Nigeria.
Write in ${language || 'English'}.
intro: one short friendly greeting that thanks the customer.
closing: one short sentence asking them to send their payment receipt to confirm the order.
Never mention any price, amount, item, address or payment detail.`;
  const schema = {
    type: 'object',
    properties: { intro: { type: 'string' }, closing: { type: 'string' } },
    required: ['intro', 'closing'],
  };
  try {
    return await askModel(system, 'Write the intro and closing.', schema);
  } catch {
    return {
      intro: 'Hello! Thanks for reaching out.',
      closing: 'Please send your receipt to confirm the order.',
    };
  }
}

// Build the final reply. Every number comes from code, never from the model.
function compose(tone, priced, shop) {
  if (priced.itemsFound === 0) {
    const menu = shop.items
      .filter((i) => i.available)
      .map((i) => `${i.name}: ${naira.format(i.price)}`)
      .join('\n');
    const sorry = priced.unavailable.length
      ? `Sorry, ${priced.unavailable.join(', ')} is not available right now.\n\n`
      : '';
    return `${tone.intro}\n\n${sorry}Here is what we have:\n${menu}\n\nTell me what you would like and where to deliver.`;
  }

  const parts = [tone.intro, priced.lines.map((l) => l.text).join('\n')];
  if (priced.unavailable.length) {
    parts.push(
      `Sorry, ${priced.unavailable.join(', ')} is not available right now.`,
    );
  }
  parts.push(`Total: ${naira.format(priced.total)}`);
  if (priced.deliveryNote) parts.push(priced.deliveryNote);
  parts.push(`Payment: ${shop.payment}\nDelivery: ${shop.deliveryNote}`);
  parts.push(tone.closing);
  return parts.join('\n\n');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }));

app.post('/api/reply', async (req, res) => {
  const message =
    typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const demo = req.body?.demo !== false;
  if (!message || message.length > 1500) {
    return res
      .status(400)
      .json({ error: 'Send a customer message under 1500 characters.' });
  }

  try {
    const shop = loadShop(demo);
    const parsed = await understand(message, shop);
    const priced = price(parsed, shop);
    const tone = await writeTone(parsed.language, shop);
    res.json({
      reply: compose(tone, priced, shop),
      itemsFound: priced.itemsFound,
      total: priced.total,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({
      error: 'The AI model did not respond. Check that Ollama is running.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Reply server on http://localhost:${PORT} using model ${MODEL}`);
});
