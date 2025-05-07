import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export async function POST(req) {
  try {
    const profile = await req.json();

    const systemPrompt = `
You are a smart fitness assistant. Generate a 1-week workout plan for a user based on their profile.

For each workout:
- Infer and label the \`muscle_group\` using one of these values only: "chest", "back", "legs", "arms", "shoulders", "core", "conditioning". Base this on the exercises included in that day only—not on the weekly split.
- The workout must include 3 sections: \`warmup\`, \`main\`, and \`cooldown\`, each as a separate array under the \`exercises\` key.
  Example:
  {
    "day": "monday",
    "type": "Upper Body (Push)",
    "muscle_group": "chest",
    "exercises": {
      "warmup": [ { name, sets, reps, ... } ],
      "main": [ { name, sets, reps, ... } ],
      "cooldown": [ { name, sets, reps, ... } ]
    }
  }

- Match the number of workouts to the user's selected training days. Use the user's \`preferred_rest_days\` to assign rest days first. If more rest days are needed, choose the remaining ones to balance the split. Fill all rest days with an entry for that day and an empty \`exercises\` object.

Cardio Logic:
- If cardio_preference is "none", avoid any cardio-focused exercises.
- If "light", include light cardio warmups or short finishers (e.g. treadmill walk, assault bike).
- If "moderate", include dedicated cardio on 1–2 days (e.g. HIIT circuits, rowing).
- If "high", include daily conditioning segments or hybrid training styles (e.g. supersets, metabolic finishers, HIIT blocks).
- For time-based interval conditioning exercises (e.g. bike sprints, battle ropes):
  - Include: timed: true, sets, work (seconds), rest (seconds), and duration (total session time, like "6:00").
  - Use rest (int, in seconds) to indicate rest between sets.
  - This enables building future timers that track total time and guide users through work/rest intervals.

General Rules:
- Return all days in lowercase (e.g. "monday").
- Each exercise must include: name, sets, reps, timed (boolean), rest (int, in seconds), weighted (boolean), duration (string), cardio (boolean). If timed and interval-based, also include work (int, seconds) and rest (int, seconds) fields.
- Tailor workouts to the user’s experience and equipment. Use bodyweight for no-equipment. Use machines and free weights for gym access.

Return valid JSON in the structure:
{
  "split": "string",
  "workouts": [ ... ]
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
- Cardio Preference: ${profile.cardio_preference}
- Preferred Rest Days: ${profile.preferred_rest_days.join(", ")}
`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });
    console.dir(chat, { depth: null }); // 👈 Add this line to inspect the full response
    const textResponse = chat.choices[0].message.content;

    // 💥 Strip out triple backticks + optional "json" label
    const cleanText = textResponse.replace(/^```json|```$/g, "").trim();

    const parsed = JSON.parse(cleanText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response("Failed to generate template", { status: 500 });
  }
}
