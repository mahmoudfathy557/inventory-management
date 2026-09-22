/**
 * Smart sequential code generator and duplicate naming utilities
 * Automatically increments trailing numeric sequences (e.g. RM-001 -> RM-002, GRP-01 -> GRP-02)
 * while ensuring no collision with existing codes.
 */

export function generateNextSequentialCode(baseCode: string, existingCodes: string[] = []): string {
  if (!baseCode || typeof baseCode !== 'string') {
    return `ITEM-${Math.floor(100 + Math.random() * 900)}`;
  }

  const trimmed = baseCode.trim();
  const existingSet = new Set(existingCodes.map(c => (c || '').trim().toLowerCase()));

  // 1. Check if the code ends with digits, e.g. "RM-001", "FP-05", "WH-RAW-01", "GRP-1"
  const trailingDigitsMatch = trimmed.match(/^(.*?)(\d+)$/);
  if (trailingDigitsMatch) {
    const prefix = trailingDigitsMatch[1];
    const numStr = trailingDigitsMatch[2];
    const padLength = numStr.length;
    let nextNum = parseInt(numStr, 10) + 1;

    let candidate = `${prefix}${String(nextNum).padStart(padLength, '0')}`;
    while (existingSet.has(candidate.toLowerCase())) {
      nextNum++;
      candidate = `${prefix}${String(nextNum).padStart(padLength, '0')}`;
    }
    return candidate;
  }

  // 2. Check if the code has digits inside a dash segment: e.g. "RM-MB-1-RED"
  const middleDigitsMatch = trimmed.match(/^(.*?-)(\d+)(-[A-Za-z0-9_-]+)$/);
  if (middleDigitsMatch) {
    const prefix = middleDigitsMatch[1];
    const numStr = middleDigitsMatch[2];
    const suffix = middleDigitsMatch[3];
    const padLength = numStr.length;
    let nextNum = parseInt(numStr, 10) + 1;

    let candidate = `${prefix}${String(nextNum).padStart(padLength, '0')}${suffix}`;
    while (existingSet.has(candidate.toLowerCase())) {
      nextNum++;
      candidate = `${prefix}${String(nextNum).padStart(padLength, '0')}${suffix}`;
    }
    return candidate;
  }

  // 3. If there are no digits at all, e.g. "RM-MB-RED", "CARRIER", "KG":
  // Append "-02", "-03", etc.
  let suffixNum = 2;
  let candidate = `${trimmed}-${String(suffixNum).padStart(2, '0')}`;
  while (existingSet.has(candidate.toLowerCase())) {
    suffixNum++;
    candidate = `${trimmed}-${String(suffixNum).padStart(2, '0')}`;
  }
  return candidate;
}

export function generateDuplicateName(name: string, isArabic = true): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();

  if (isArabic) {
    const copyMatch = trimmed.match(/^(.*?)\s*\(نسخة(?:\s*(\d+))?\)$/);
    if (copyMatch) {
      const base = copyMatch[1].trim();
      const num = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
      return `${base} (نسخة ${num})`;
    }
    return `${trimmed} (نسخة)`;
  } else {
    const copyMatch = trimmed.match(/^(.*?)\s*\(Copy(?:\s*(\d+))?\)$/i);
    if (copyMatch) {
      const base = copyMatch[1].trim();
      const num = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
      return `${base} (Copy ${num})`;
    }
    return `${trimmed} (Copy)`;
  }
}
