// For the PDT canvases page: which of Harvest Commons' canvases shows each PDT canvas, and one
// element of the example that fills it. Checked by tests/canvas-examples.test.ts.

/** Per canvas: which of Harvest Commons' canvases to show, and one element that fills it. */
export const EXAMPLES: Record<string, { view?: string; element: string }> = {
  "arena-scan": { view: "cv-arena-scan", element: "ar-selling" },
  "ecosystem-scan": { view: "cv-ecosystem-scan", element: "e-wholesaler" },
  vrio: { view: "cv-vrio", element: "as-trust" },
  "wardley-map": { view: "cv-value-chain", element: "c-ordering" },
  "platform-plays": { view: "cv-plays", element: "pl-aggregate" },
  "pattern-cards": { element: "sc-hub-hosts" },
  "brief-consolidation": { view: "cv-brief", element: "br-main" },
  ecosystem: { view: "cv-ecosystem", element: "e-couriers" },
  "entity-portrait": { view: "cv-portrait-farmers", element: "e-farmers" },
  "motivations-matrix": { view: "cv-matrix", element: "m-farmers-restaurants" },
  "transactions-board": { view: "cv-board-restaurant", element: "t-preorder" },
  "learning-engine": { view: "cv-learning", element: "le-farmers" },
  "platform-experience": { view: "cv-xp-chefs", element: "x-chefs-table" },
  mvp: { view: "cv-mvp-chefs", element: "mvp-chefs-circle" },
  "platform-design": { element: "platform-harvest" },
  "platform-strategy-model": { view: "cv-psm", element: "vp-kitchen-market" },
  "network-properties": { view: "cv-network-kitchen", element: "n-kitchen" },
  "flywheel-sketching": { view: "cv-flywheels", element: "fw-core" },
  liquidity: { view: "cv-liquidity-kitchen", element: "lq-kitchen" },
  "growth-model": { view: "cv-growth", element: "gl-recipes" },
};
