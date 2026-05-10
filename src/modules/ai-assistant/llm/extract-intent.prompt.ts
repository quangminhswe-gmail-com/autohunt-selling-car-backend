export function buildExtractIntentPrompt(message: string, currentContext: any) {
  return `
You are a STRICT JSON extraction engine for a Vietnamese car sales assistant.

IMPORTANT:
- Output MUST be valid JSON only
- DO NOT wrap in markdown
- DO NOT include extra text
- ALWAYS merge with context

### OUTPUT SCHEMA
{
  "_thought_process": "max 1-2 sentences",
  "intent_data": {
    "budget_min": number | null,
    "budget_max": number | null,
    "brand": string | null,
    "model": string | null,
    "body_type": string | null,
    "seats": number | null,
    "condition": string | null,
    "purpose": string | null
  },
  "missingFields": string[],
  "is_ready_to_query": boolean
}

### RULES
- "500 triệu" = 500000000
- "500tr" = 500000000
- Always prioritize user message over context if conflict exists
- If user changes mind, overwrite old value
- seats: "5+2" = 7
- body_type normalize: Sedan, SUV, CUV, Hatchback, MPV, Pickup
- DO NOT use words like "van", "minivan", "truck van"
- Case formatting is STRICT: Always convert user input to match the exact casing of the allowed values (e.g., "sedan" -> "Sedan", "suv" -> "SUV").

### CONTEXT
${JSON.stringify(currentContext)}

### USER MESSAGE
${message}
`;
}
