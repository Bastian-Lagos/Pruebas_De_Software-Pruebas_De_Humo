const axios = require("axios");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Llama a OpenRouter y retorna el plan de estudios parseado.
 */
async function generateStudyPlanFromLLM(topics, weeks, hoursPerWeek, startDate) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;

  const topicsList = topics.map((t) => `- ${t}`).join("\n");

  const prompt = `Generate a study plan.

Topics:
${topicsList}

Duration:
${weeks} weeks

Hours per week:
${hoursPerWeek}

Requirements:
- Cover every topic listed above (spread them across the weeks)
- Include at least one review or evaluation session (use the word "repaso" or "evaluación" in the activities)
- Each week must have estimatedHours equal to exactly ${hoursPerWeek}
- Return ONLY a valid JSON object with no markdown, no backticks, no explanation
- The JSON must follow this exact structure:

{
  "weeks": [
    {
      "week": 1,
      "topics": ["Topic name"],
      "activities": ["Activity 1", "Activity 2"],
      "estimatedHours": ${hoursPerWeek}
    }
  ]
}`;

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Study Plan API",
      },
      timeout: 30000,
    }
  );

  const rawContent = response.data.choices[0].message.content;

  // Limpiar posibles backticks o markdown que el modelo agregue
  const cleaned = rawContent
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  return parsed;
}

module.exports = { generateStudyPlanFromLLM };