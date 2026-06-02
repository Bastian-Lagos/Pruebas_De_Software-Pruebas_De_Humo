/**
 * Genera un plan de estudios mockeado.
 * Útil para desarrollo y para que los tests pasen sin API key de OpenRouter.
 */
function generateMockStudyPlan(topics, weeks, hoursPerWeek) {
  const tolerance = 0.1;
  const generatedWeeks = [];

  // Distribuir tópicos entre las semanas
  const topicsPerWeek = Math.ceil(topics.length / weeks);

  for (let i = 0; i < weeks; i++) {
    const weekTopics = topics.slice(i * topicsPerWeek, (i + 1) * topicsPerWeek);

    // Si la semana queda sin tópicos asignados, repetir el último
    if (weekTopics.length === 0) {
      weekTopics.push(topics[topics.length - 1]);
    }

    const isLastWeek = i === weeks - 1;

    const activities = [
      `Lectura de ${weekTopics.join(" y ")}`,
      `Ejercicios prácticos de ${weekTopics[0]}`,
    ];

    // Agregar repaso en la última semana
    if (isLastWeek) {
      activities.push("Repaso general y evaluación final");
    } else if (i === Math.floor(weeks / 2) - 1) {
      // Repaso intermedio a mitad del curso
      activities.push("Repaso de contenidos vistos");
    }

    generatedWeeks.push({
      week: i + 1,
      topics: weekTopics,
      activities,
      estimatedHours: hoursPerWeek,
    });
  }

  return { weeks: generatedWeeks };
}

module.exports = { generateMockStudyPlan };