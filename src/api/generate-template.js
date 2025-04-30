import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const profile = await req.json();

    const systemPrompt = `
You are a smart fitness assistant. Generate a 1-week workout plan for a user based on their profile.
Return JSON in this exact format:
{
  "split": "string",
  "workouts": [
    {
      "day": "Monday",
      "type": "string",
      "exercises": [
        { "name": "string", "sets": int, "reps": int, "section": "Warmup|Main|Cooldown" }
      ]
    }
  ]
}
`;

    const userPrompt = `
User Profile:
- Name: ${profile.name}
- Goal: ${profile.goal}
- Experience: ${profile.experience}
- Days per Week: ${profile.days_per_week}
- Equipment: ${profile.equipment}
- Height (cm): ${profile.height_cm}
- Weight (kg): ${profile.weight_kg}
- Units: ${profile.unit_preference}
`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const textResponse = chat.choices[0].message.content;
    const parsed = JSON.parse(textResponse);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI generation failed:", err);
    return new Response("Failed to generate template", { status: 500 });
  }
}
