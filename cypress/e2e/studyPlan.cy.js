// cypress/e2e/studyPlan.cy.js

const BASE_URL = Cypress.env("BASE_URL") || "http://localhost:3000";

// ─────────────────────────────────────────────
// Smoke Test 1: Health
// ─────────────────────────────────────────────
describe("Smoke Test 1 – Health", () => {
  it("should return API status 200", () => {
    cy.request(`${BASE_URL}/health`)
      .its("status")
      .should("eq", 200);
  });

  it("should return status ok and timestamp", () => {
    cy.request(`${BASE_URL}/health`).then((response) => {
      expect(response.body.status).to.eq("ok");
      expect(response.body.timestamp).to.be.a("string");
    });
  });
});

// ─────────────────────────────────────────────
// Smoke Test 2: Solicitud inválida
// ─────────────────────────────────────────────
describe("Smoke Test 2 – Invalid requests", () => {
  it("should reject empty payload with 400", () => {
    cy.request({
      method: "POST",
      url: `${BASE_URL}/study-plan`,
      failOnStatusCode: false,
      body: {},
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.be.a("string");
    });
  });

  it("should reject empty topics array with 400", () => {
    cy.request({
      method: "POST",
      url: `${BASE_URL}/study-plan`,
      failOnStatusCode: false,
      body: { topics: [] },
    }).then((response) => {
      expect(response.status).to.eq(400);
    });
  });

  it("should reject negative weeks with 400", () => {
    cy.request({
      method: "POST",
      url: `${BASE_URL}/study-plan`,
      failOnStatusCode: false,
      body: { topics: ["POO"], weeks: -1, hoursPerWeek: 4 },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.include("weeks");
    });
  });
});

// ─────────────────────────────────────────────
// Smoke Test 3: Solicitud válida → 200
// ─────────────────────────────────────────────
describe("Smoke Test 3 – Valid request returns 200", () => {
  it("should generate plan successfully", () => {
    cy.request({
      method: "POST",
      url: `${BASE_URL}/study-plan`,
      body: {
        topics: ["Variables", "Funciones"],
        weeks: 2,
        hoursPerWeek: 4,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});

// ─────────────────────────────────────────────
// Tests 4–9: sobre el mismo plan generado
// ─────────────────────────────────────────────
describe("Smoke Tests 4–9 – Plan content validation", () => {
  let planResponse;

  before(() => {
    cy.request({
      method: "POST",
      url: `${BASE_URL}/study-plan`,
      body: {
        topics: ["Variables", "Funciones"],
        weeks: 2,
        hoursPerWeek: 4,
      },
    }).then((response) => {
      planResponse = response;
    });
  });

  // Smoke Test 4: cantidad de semanas correcta
  it("Smoke Test 4 – should have the correct number of weeks", () => {
    expect(planResponse.body.weeks.length).to.eq(2);
  });

  // Smoke Test 5: todos los tópicos presentes
  it("Smoke Test 5 – should include all requested topics", () => {
    const allTopics = planResponse.body.weeks.flatMap((w) => w.topics);
    const allTopicsLower = allTopics.map((t) => t.toLowerCase());

    expect(
      allTopicsLower.some((t) => t.includes("variables") || t.includes("variable"))
    ).to.be.true;
    expect(
      allTopicsLower.some((t) => t.includes("funciones") || t.includes("funcion"))
    ).to.be.true;
  });

  // Smoke Test 6: actividades en cada semana
  it("Smoke Test 6 – each week should have at least one activity", () => {
    planResponse.body.weeks.forEach((week) => {
      expect(week.activities.length).to.be.greaterThan(0);
    });
  });

  // Smoke Test 7: horas estimadas presentes
  it("Smoke Test 7 – each week should have estimated hours > 0", () => {
    planResponse.body.weeks.forEach((week) => {
      expect(week.estimatedHours).to.be.greaterThan(0);
    });
  });

  // Smoke Test 8: repaso o evaluación presente
  it("Smoke Test 8 – plan should include a review or evaluation session", () => {
    const activities = planResponse.body.weeks
      .flatMap((w) => w.activities)
      .join(" ")
      .toLowerCase();

    expect(
      activities.includes("repaso") ||
        activities.includes("evaluaci") ||
        activities.includes("evalu") ||
        activities.includes("review") ||
        activities.includes("revision")
    ).to.be.true;
  });

  // Smoke Test 9: carga horaria dentro de ±10% para 4 horas → [3.6, 4.4]
  it("Smoke Test 9 – each week estimatedHours should be within ±10% of 4", () => {
    planResponse.body.weeks.forEach((week) => {
      expect(week.estimatedHours).to.be.within(3.6, 4.4);
    });
  });
});