/**
 * Valida el body del request antes de llamar al LLM.
 * Retorna { valid: true } o { valid: false, error: "mensaje" }
 */
function validateRequest(body) {
  if (!body || Object.keys(body).length === 0) {
    return { valid: false, error: "Request body is required" };
  }

  if (!body.topics) {
    return { valid: false, error: "topics is required" };
  }

  if (!Array.isArray(body.topics) || body.topics.length === 0) {
    return { valid: false, error: "topics must be a non-empty array" };
  }

  if (body.weeks === undefined || body.weeks === null) {
    return { valid: false, error: "weeks is required" };
  }

  if (typeof body.weeks !== "number" || body.weeks <= 0) {
    return { valid: false, error: "weeks must be greater than 0" };
  }

  if (body.hoursPerWeek === undefined || body.hoursPerWeek === null) {
    return { valid: false, error: "hoursPerWeek is required" };
  }

  if (typeof body.hoursPerWeek !== "number" || body.hoursPerWeek <= 0) {
    return { valid: false, error: "hoursPerWeek must be greater than 0" };
  }

  return { valid: true };
}

/**
 * Valida las reglas de coherencia del plan generado por el LLM.
 * Retorna { valid: true } o { valid: false, errors: [...] }
 */
function validateStudyPlan(plan, request) {
  const errors = [];
  const tolerance = 0.1;

  // Regla 1: cantidad de semanas correcta
  if (!plan.weeks || plan.weeks.length !== request.weeks) {
    errors.push(
      `Expected ${request.weeks} weeks, got ${plan.weeks ? plan.weeks.length : 0}`
    );
  }

  // Regla 2: todos los tópicos aparecen
  const allTopicsInPlan = (plan.weeks || []).flatMap((w) => w.topics || []);
  const missingTopics = request.topics.filter(
    (topic) =>
      !allTopicsInPlan.some(
        (t) => t.toLowerCase().includes(topic.toLowerCase()) ||
               topic.toLowerCase().includes(t.toLowerCase())
      )
  );
  if (missingTopics.length > 0) {
    errors.push(`Missing topics: ${missingTopics.join(", ")}`);
  }

  // Regla 3 & 4: cada semana tiene actividades y estimación
  (plan.weeks || []).forEach((week, i) => {
    if (!week.activities || week.activities.length === 0) {
      errors.push(`Week ${i + 1} has no activities`);
    }
    if (!week.estimatedHours || week.estimatedHours <= 0) {
      errors.push(`Week ${i + 1} has no estimated hours`);
    }
  });

  // Regla 5: existe sesión de repaso o evaluación
  const allActivities = (plan.weeks || [])
    .flatMap((w) => w.activities || [])
    .join(" ")
    .toLowerCase();

  const hasReview =
    allActivities.includes("review") ||
    allActivities.includes("revision") ||
    allActivities.includes("repaso") ||
    allActivities.includes("evaluaci") ||
    allActivities.includes("evalu");

  if (!hasReview) {
    errors.push("Plan must include at least one review or evaluation session");
  }

  // Regla 6: carga horaria dentro del ±10%
  const minHours = request.hoursPerWeek * (1 - tolerance);
  const maxHours = request.hoursPerWeek * (1 + tolerance);

  (plan.weeks || []).forEach((week, i) => {
    if (week.estimatedHours < minHours || week.estimatedHours > maxHours) {
      errors.push(
        `Week ${i + 1} hours (${week.estimatedHours}) out of range [${minHours.toFixed(1)}, ${maxHours.toFixed(1)}]`
      );
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

module.exports = { validateRequest, validateStudyPlan };