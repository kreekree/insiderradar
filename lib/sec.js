export const UA = 'InsiderRadar contact@insiderradar.com';

export const TX_CODE = {
  P: 'BUY', S: 'SELL', A: 'AWARD', D: 'DISPOSE',
  F: 'TAX_WITHHOLD', M: 'OPTION_EXERCISE', G: 'GIFT', I: 'INHERIT'
};

export function xmlVal(xml, tag) {
  const m1 = xml.match(new RegExp(`<${tag}[^>]*>\\s*<value>([^<]+)<\\/value>`, 'i'));
  if (m1) return m1[1].trim();
  const m2 = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`, 'i'));
  return m2 ? m2[1].trim() : null;
}

export function xmlBlocks(xml, tag) {
  const blocks = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[1]);
  return blocks;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function processBatched(items, fn, batchSize = 4, delayMs = 300) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults.flat());
    if (i + batchSize < items.length) await sleep(delayMs);
  }
  return results;
}
