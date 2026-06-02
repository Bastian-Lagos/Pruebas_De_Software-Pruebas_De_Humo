const { validateRequest, validateStudyPlan } = require("../services/validator");
const { generateStudyPlanFromLLM } = require("../services/llmService");
const { generateMockStudyPlan } = require("../services/mockService");

async function generate(req, res) {
  const body = req.body;

  // Fase 2: Validación del request
  const requestValidation = validateRequest(body);
  if (!requestValidation.valid) {
    return res.status(400).json({ error: requestValidation.error });
  }

  const { topics, weeks, hoursPerWeek, startDate } = body;

  let planData;
  const useMock = !process.env.OPENROUTER_API_KEY ||
                  process.env.OPENROUTER_API_KEY === "your_api_key_here" ||
                  process.env.USE_MOCK === "true";

  if (useMock) {
    // Modo mock: sin llamada al LLM
    planData = generateMockStudyPlan(topics, weeks, hoursPerWeek);
    planData.generatedBy = "mock";
  } else {
    // Fase 3: Integración OpenRouter
    try {
      planData = await generateStudyPlanFromLLM(topics, weeks, hoursPerWeek, startDate);
      planData.generatedBy = "llm";
    } catch (err) {
      console.error("LLM error:", err.message);
      return res.status(502).json({
        error: "Failed to generate plan from LLM",
        detail: err.message,
      });
    }
  }

  // Fase 4: Validaciones de coherencia
  const planValidation = validateStudyPlan(planData, { topics, weeks, hoursPerWeek });
  if (!planValidation.valid) {
    console.warn("Plan coherence errors:", planValidation.errors);
    // En modo LLM: retornar error 422. En modo mock nunca debería fallar.
    if (!useMock) {
      return res.status(422).json({
        error: "Generated plan failed coherence validation",
        details: planValidation.errors,
      });
    }
  }

  return res.status(200).json({
    generatedBy: planData.generatedBy,
    generatedAt: new Date().toISOString(),
    weeks: planData.weeks,
  });
}

module.exports = { generate };