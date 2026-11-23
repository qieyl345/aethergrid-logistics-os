(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const names = {
    overview: "COMMAND CENTER",
    routes: "GLOBAL ROUTES",
    warehouse: "WAREHOUSE TWIN",
    risk: "RISK INTELLIGENCE",
    shipments: "SHIPMENT MANIFEST"
  };
  const state = {
    view: "overview",
    shipmentTab: "all",
    page: 1,
    pageSize: 12,
    search: "",
    sort: "eta",
    status: "all",
    mode: "all",
    region: "all",
    simulation: false,
    streamTick: 0,
    robotsPaused: false,
    taskType: "all",
    mapFilter: "all",
    selectedCommand: 0,
    activeIndex: 0
  };

  const hubs = [
    { name: "Singapore", code: "SGP", x: 0.79, y: 0.57, region: "APAC" },
    { name: "Rotterdam", code: "RTM", x: 0.49, y: 0.33, region: "EMEA" },
    { name: "Los Angeles", code: "LAX", x: 0.17, y: 0.39, region: "AMER" },
    { name: "Shanghai", code: "SHA", x: 0.79, y: 0.43, region: "APAC" },
    { name: "Dubai", code: "DXB", x: 0.59, y: 0.47, region: "EMEA" },
    { name: "Santos", code: "SSZ", x: 0.32, y: 0.75, region: "AMER" },
    { name: "Hamburg", code: "HAM", x: 0.51, y: 0.29, region: "EMEA" },
    { name: "Tokyo", code: "TYO", x: 0.87, y: 0.39, region: "APAC" },
    { name: "New York", code: "NYC", x: 0.26, y: 0.38, region: "AMER" },
    { name: "Mumbai", code: "BOM", x: 0.68, y: 0.5, region: "APAC" }
  ];
  const corridors = [
    { from: 0, to: 1, type: "ocean", risk: false },
    { from: 0, to: 2, type: "ocean", risk: true },
    { from: 3, to: 0, type: "ocean", risk: false },
    { from: 1, to: 2, type: "ocean", risk: false },
    { from: 4, to: 1, type: "ocean", risk: true },
    { from: 8, to: 1, type: "ocean", risk: false },
    { from: 5, to: 2, type: "ocean", risk: false },
    { from: 7, to: 0, type: "air", risk: false },
    { from: 9, to: 0, type: "air", risk: false },
    { from: 3, to: 7, type: "air", risk: false },
    { from: 4, to: 0, type: "air", risk: false }
  ];
  const activities = [
    { type: "warn", icon: "△", title: "Port congestion alert", detail: "Port of Los Angeles · Berth delay +18h", time: "2 min ago", tag: "ELEVATED" },
    { type: "ok", icon: "↗", title: "Shipment delivered", detail: "AG-284912 · Rotterdam → Hamburg", time: "8 min ago", tag: "ON TIME" },
    { type: "info", icon: "⌖", title: "Fleet reroute initiated", detail: "Lane SG-DXB · 12 units redirected", time: "14 min ago", tag: "AUTO" },
    { type: "warn", icon: "◷", title: "Simulated weather watch", detail: "South China Sea · 6 active shipments", time: "21 min ago", tag: "MONITORING" },
    { type: "ok", icon: "✓", title: "Customs cleared", detail: "AG-284771 · Singapore gateway", time: "27 min ago", tag: "CLEARED" }
  ];
  const anomalies = [
    { icon: "△", level: "critical", title: "Port congestion · Los Angeles", detail: "Berth wait time 18h above baseline · 42 shipments exposed", score: "0.91", label: "HIGH" },
    { icon: "◷", level: "", title: "Weather disruption · South China Sea", detail: "Typhoon watch issued · 6 shipments may be delayed", score: "0.76", label: "ELEVATED" },
    { icon: "⌁", level: "", title: "Capacity imbalance · Rotterdam → Dubai", detail: "Lane utilization at 94% · surge expected within 12h", score: "0.68", label: "ELEVATED" }
  ];
  const laneData = [
    { name: "Singapore → Rotterdam", code: "SGP–RTM", use: 82, reliability: "97.8%", risk: "LOW" },
    { name: "Shanghai → Los Angeles", code: "SHA–LAX", use: 74, reliability: "92.4%", risk: "ELEVATED" },
    { name: "Dubai → Hamburg", code: "DXB–HAM", use: 68, reliability: "96.1%", risk: "LOW" },
    { name: "New York → Rotterdam", code: "NYC–RTM", use: 57, reliability: "98.2%", risk: "LOW" }
  ];
  const regions = [
    { name: "APAC", value: 32, risk: "low" },
    { name: "EMEA", value: 24, risk: "low" },
    { name: "AMER", value: 61, risk: "high" },
    { name: "LATAM", value: 18, risk: "low" },
    { name: "MEA", value: 39, risk: "high" }
  ];
  const carriers = ["Maersk", "DHL Global", "FedEx", "CMA CGM", "DB Schenker", "Kuehne+Nagel"];
  const cities = [
    ["Singapore", "Rotterdam", "APAC", "EMEA"],
    ["Shanghai", "Los Angeles", "APAC", "AMER"],
    ["Dubai", "Hamburg", "EMEA", "EMEA"],
    ["New York", "Singapore", "AMER", "APAC"],
    ["Tokyo", "Rotterdam", "APAC", "EMEA"],
    ["Mumbai", "Dubai", "APAC", "EMEA"],
    ["Santos", "Los Angeles", "AMER", "AMER"],
    ["Hamburg", "New York", "EMEA", "AMER"],
    ["Singapore", "Tokyo", "APAC", "APAC"],
    ["Rotterdam", "Dubai", "EMEA", "EMEA"]
  ];
  const commandItems = [
    { icon: "◫", title: "Open command center", sub: "Overview", view: "overview" },
    { icon: "⌁", title: "Open global routes", sub: "Network intelligence", view: "routes" },
    { icon: "▦", title: "Open warehouse twin", sub: "Singapore · SG-04", view: "warehouse" },
    { icon: "△", title: "Open risk intelligence", sub: "Predictive operations", view: "risk" },
    { icon: "▤", title: "Open shipment manifest", sub: "Fulfillment operations", view: "shipments" },
    { icon: "⌁", title: "Simulate network disruption", sub: "Scenario controls", action: "simulate" },
    { icon: "↓", title: "Export shipment manifest", sub: "CSV download", action: "export" }
  ];

  const shipments = Array.from({ length: 524 }, (_, index) => {
    const serial = 284930 - index;
    const pair = cities[index % cities.length];
    const mode = ["Ocean", "Ocean", "Air", "Rail", "Road"][index % 5];
    const status = index < 318 ? "In transit"
      : index < 342 ? "At risk"
        : index < 428 ? "Delivered"
          : index < 436 ? "Customs hold" : "Scheduled";
    const risk = status === "At risk" || status === "Customs hold" ? (index % 4 === 0 ? "High" : "Medium")
      : (index % 9 === 0 ? "Medium" : "Low");
    const day = status === "Delivered"
      ? Math.floor(seeded(index, 3) * 23) + 1
      : 23 + Math.floor(seeded(index, 3) * 15);
    const hour = Math.floor(seeded(index, 5) * 24);
    return {
      id: `AG-${serial}`,
      origin: pair[0],
      destination: pair[1],
      region: pair[2],
      destinationRegion: pair[3],
      carrier: carriers[index % carriers.length],
      mode,
      status,
      risk,
      value: 12800 + ((index * 7643) % 288000),
      eta: new Date(Date.UTC(2026, 10, day, hour, Math.floor(seeded(index, 7) * 60))),
      progress: status === "Delivered" ? 100 : Math.min(93, 18 + ((index * 17) % 76)),
      units: 24 + ((index * 19) % 540),
      weight: 180 + ((index * 31) % 8200),
      tracking: `AGX${String((index * 10973) % 99999999).padStart(8, "0")}`
    };
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function navigate(view) {
    if (!names[view]) return;
    state.view = view;
    $$(".view-panel").forEach(panel => panel.classList.toggle("active", panel.id === `view-${view}`));
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    $("#breadcrumbTitle").textContent = names[view];
    $("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view === "overview" || view === "routes") drawMaps();
    if (view === "risk") drawRiskChart();
    if (view === "shipments") renderShipments();
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast${type === "warning" ? " warning" : ""}`;
    toast.innerHTML = `<span>${type === "warning" ? "△" : "✓"}</span><div>${escapeHtml(message)}</div>`;
    $("#toastRegion").append(toast);
    window.setTimeout(() => toast.remove(), 3600);
  }

  function updateClock() {
    const now = new Date();
    const value = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
    $("#clock").textContent = `${value} UTC`;
    $("#footerTime").textContent = value;
  }

  function seeded(index, salt = 1) {
    const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function makeMapSvg(svg, viewName) {
    if (!svg) return;
    const wide = viewName === "routes";
    const width = wide ? 1000 : 760;
    const height = wide ? 440 : 330;
    const p = (hub) => [Math.round(hub.x * width), Math.round(hub.y * height)];
    const land = wide ? [
      "M58 103 L77 74 119 59 159 62 190 77 219 84 235 104 217 121 213 143 191 152 183 171 163 174 152 195 131 203 116 189 101 165 82 153 65 134Z",
      "M196 184 L221 187 239 203 245 228 238 257 227 286 215 322 203 342 194 316 186 292 182 266 175 243 179 221Z",
      "M433 93 L456 81 477 87 491 104 510 104 524 118 516 133 499 138 491 154 472 156 457 143 442 134 427 115Z",
      "M450 153 L474 144 496 151 512 172 520 200 510 226 499 251 486 269 472 264 465 242 452 222 447 198 435 179Z",
      "M490 93 L532 68 579 61 629 67 674 62 719 79 750 94 780 95 817 111 856 118 885 137 874 156 846 163 827 184 793 179 769 196 745 188 729 211 700 208 681 188 662 180 646 159 618 158 599 141 578 148 556 132 533 131 513 114Z",
      "M720 209 L742 203 763 213 778 232 771 251 750 252 736 237Z",
      "M819 269 L838 256 862 263 875 278 862 292 841 289Z"
    ] : [
      "M39 81 L58 60 93 48 129 51 155 63 174 69 190 84 179 100 163 106 156 122 139 126 130 140 113 144 100 132 88 114 70 106 55 96Z",
      "M153 145 L172 147 187 161 191 184 183 209 174 233 165 258 157 248 151 228 146 207 140 187Z",
      "M320 75 L337 66 356 70 367 83 383 84 393 95 386 107 373 110 365 123 350 124 337 113 326 107 315 91Z",
      "M333 122 L352 115 369 121 382 139 389 163 381 184 373 204 363 219 352 215 347 198 337 183 334 164 324 146Z",
      "M361 72 L395 52 432 47 470 52 503 47 538 60 561 71 585 72 613 84 643 89 665 105 657 119 635 124 621 140 595 136 577 149 559 143 546 159 524 157 510 143 496 138 484 122 462 121 447 109 432 115 416 103 400 103 384 91Z",
      "M541 161 L557 155 574 163 585 179 579 194 563 193 551 181Z"
    ];
    const graticules = Array.from({ length: 7 }, (_, i) => {
      const y = Math.round(height * (0.13 + i * 0.12));
      return `<path class="map-graticule" d="M12 ${y} Q ${width / 2} ${y - 9} ${width - 12} ${y}"/>`;
    }).join("");
    const continents = land.map(path => `<path class="map-land" d="${path}"/>`).join("");
    const routes = corridors.map((route, index) => {
      const [x1, y1] = p(hubs[route.from]);
      const [x2, y2] = p(hubs[route.to]);
      const mx = (x1 + x2) / 2;
      const curve = Math.max(12, Math.abs(x2 - x1) * 0.1);
      const d = `M${x1} ${y1} Q${mx} ${Math.min(y1, y2) - curve} ${x2} ${y2}`;
      const visible = state.mapFilter === "all" || state.mapFilter === route.type || (state.mapFilter === "risk" && route.risk);
      const simulationRoute = state.simulation && [1, 4, 5, 6, 9].includes(index);
      return `<g class="corridor" data-route="${index}" style="${visible ? "" : "display:none"}"><path class="route-path ${route.type}${route.risk || simulationRoute ? " risk" : ""}" d="${d}"/><path class="route-flow ${route.type}" d="${d}"/></g>`;
    }).join("");
    const points = hubs.map((hub, index) => {
      const [x, y] = p(hub);
      return `<g class="hub-marker" data-hub="${index}" tabindex="0" role="button" aria-label="${hub.name} logistics hub"><circle class="hub-halo" cx="${x}" cy="${y}" r="12"/><circle class="hub-point" cx="${x}" cy="${y}" r="3.3"/><circle class="hub-hit" cx="${x}" cy="${y}" r="13"/></g>`;
    }).join("");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = `${graticules}${continents}${routes}${points}`;
    svg.querySelectorAll(".hub-marker").forEach(marker => {
      const show = () => showMapTooltip(marker, hubs[Number(marker.dataset.hub)]);
      marker.addEventListener("mouseenter", show);
      marker.addEventListener("focus", show);
      marker.addEventListener("mouseleave", hideMapTooltip);
      marker.addEventListener("blur", hideMapTooltip);
      marker.addEventListener("click", show);
    });
  }

  function showMapTooltip(marker, hub) {
    const wrap = marker.closest(".map-wrap, .full-map-wrap");
    const tooltip = $(".map-tooltip", wrap);
    if (!tooltip) return;
    tooltip.textContent = `${hub.name} · ${hub.code}  |  ${hub.region} hub`;
    tooltip.classList.add("visible");
    const rect = marker.getBoundingClientRect();
    const parent = wrap.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(rect.left - parent.left + 12, parent.width - 190))}px`;
    tooltip.style.top = `${Math.max(8, rect.top - parent.top - 10)}px`;
  }
  function hideMapTooltip(event) {
    const tip = $(".map-tooltip", event.currentTarget.closest(".map-wrap, .full-map-wrap"));
    if (tip) tip.classList.remove("visible");
  }
  function drawMaps() {
    makeMapSvg($("#view-overview .world-map"), "overview");
    makeMapSvg($("#view-routes .world-map"), "routes");
  }

  function renderActivity() {
    $("#activityList").innerHTML = activities.map(item => `<div class="activity-item"><span class="activity-icon ${item.type === "ok" ? "" : item.type}">${item.icon}</span><div><div class="activity-copy"><strong>${item.title}</strong><br>${item.detail}</div><div class="activity-meta"><span>${item.time}</span><span>·</span><span>${item.tag}</span></div></div></div>`).join("");
  }

  function renderLaneRows() {
    $("#laneList").innerHTML = laneData.map(lane => `<div class="lane-row"><div class="lane-route">${lane.name}<small>${lane.code}</small></div><div class="lane-bar"><i style="width:${lane.use}%"></i></div><span class="lane-reliability">${lane.reliability}</span><span class="lane-risk ${lane.risk === "ELEVATED" ? "warn" : ""}">${lane.risk}</span></div>`).join("");
    $("#hubList").innerHTML = hubs.slice(0, 5).map((hub, index) => `<div class="hub-row"><span class="hub-index">0${index + 1}</span><div><strong>${hub.name}</strong><small>${hub.code} · ${hub.region} region</small></div><span class="hub-state ${index === 2 ? "warn" : ""}">${index === 2 ? "WATCH" : "ACTIVE"}</span></div>`).join("");
  }

  function renderAnomalies() {
    const activeAnomalies = state.simulation
      ? [...anomalies,
        { icon: "△", level: "critical", title: "Inventory shortfall · Newark DC", detail: "Inbound buffer below threshold · 18 distribution orders exposed", score: "0.82", label: "HIGH" },
        { icon: "⌁", level: "", title: "Capacity surge · Shanghai → Los Angeles", detail: "Rerouted cargo competing for air capacity · 12 shipments exposed", score: "0.73", label: "ELEVATED" }]
      : anomalies;
    $("#anomalyList").innerHTML = activeAnomalies.map(item => `<div class="anomaly-row"><span class="anomaly-mark ${item.level}">${item.icon}</span><div><strong>${item.title}</strong><small>${item.detail}</small></div><span class="anomaly-score">${item.score}<small> · ${item.label}</small></span></div>`).join("");
    $("#exposureList").innerHTML = regions.map(region => {
      const value = state.simulation && region.name === "AMER" ? 82 : region.value;
      return `<div class="exposure-row ${region.risk}"><span>${region.name}</span><span class="exposure-bar"><i style="width:${value}%"></i></span><strong>${value}%</strong></div>`;
    }).join("");
    $("#anomalyList").closest(".panel").querySelector(".heading-count").textContent = String(activeAnomalies.length).padStart(2, "0");
    $("#combinedExposure").textContent = state.simulation ? "31.6%" : "18.2%";
  }

  function drawMiniWarehouse() {
    const stage = $("#miniWarehouse");
    for (let i = 0; i < 7; i++) {
      const robot = document.createElement("i");
      robot.className = "mini-robot";
      robot.style.left = `${12 + seeded(i, 2) * 75}%`;
      robot.style.top = `${14 + seeded(i, 3) * 72}%`;
      robot.style.animationDelay = `${seeded(i, 4) * -4}s`;
      stage.append(robot);
    }
  }

  function drawThroughput() {
    const canvas = $("#throughputChart");
    if (!canvas || !canvas.offsetWidth) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const context = canvas.getContext("2d");
    context.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;
    const day = $("#throughputRange").value === "24";
    const values = Array.from({ length: day ? 24 : 28 }, (_, i) =>
      (day ? 46 : 52) + Math.sin(i * 0.59) * 14 + Math.cos(i * 0.17) * 9 + seeded(i, (day ? 7 : 9) + state.streamTick) * 16);
    const pad = { left: 22, right: 7, top: 8, bottom: 19 };
    const plotH = height - pad.top - pad.bottom;
    const plotW = width - pad.left - pad.right;
    context.font = "9px DM Mono, monospace";
    context.textBaseline = "middle";
    for (let line = 0; line < 4; line++) {
      const y = pad.top + (plotH * line) / 3;
      context.strokeStyle = "#2a332e";
      context.lineWidth = 1;
      context.beginPath(); context.moveTo(pad.left, y); context.lineTo(width - pad.right, y); context.stroke();
      context.fillStyle = "#758078";
      context.fillText(String(120 - line * 35), 0, y);
    }
    const points = values.map((value, i) => ({
      x: pad.left + (plotW * i) / (values.length - 1),
      y: pad.top + plotH * (1 - (value - 10) / 130)
    }));
    const gradient = context.createLinearGradient(0, pad.top, 0, height - pad.bottom);
    gradient.addColorStop(0, "rgba(164,240,110,.25)");
    gradient.addColorStop(1, "rgba(164,240,110,0)");
    context.beginPath();
    context.moveTo(points[0].x, height - pad.bottom);
    points.forEach(point => context.lineTo(point.x, point.y));
    context.lineTo(points.at(-1).x, height - pad.bottom);
    context.closePath();
    context.fillStyle = gradient; context.fill();
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.strokeStyle = "#a4f06e"; context.lineWidth = 1.7; context.stroke();
    points.forEach((point, i) => {
      if (i % 5 !== 0 && i !== points.length - 1) return;
      context.beginPath(); context.arc(point.x, point.y, 2, 0, Math.PI * 2);
      context.fillStyle = "#c6f39c"; context.fill();
    });
    const ticks = day ? ["00", "04", "08", "12", "16", "20", "24"] : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    ticks.forEach((label, i) => {
      context.fillStyle = "#758078";
      context.textAlign = i === 0 ? "left" : i === ticks.length - 1 ? "right" : "center";
      context.fillText(label, pad.left + (plotW * i) / (ticks.length - 1), height - 7);
    });
    context.textAlign = "left";
  }

  function drawRiskChart() {
    const canvas = $("#riskChart");
    if (!canvas || !canvas.offsetWidth) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const context = canvas.getContext("2d");
    context.scale(dpr, dpr);
    const { width, height } = rect;
    const pad = { left: 31, right: 9, top: 10, bottom: 6 };
    const plotH = height - pad.top - pad.bottom;
    const plotW = width - pad.left - pad.right;
    context.font = "8px DM Mono, monospace";
    for (let i = 0; i < 5; i++) {
      const y = pad.top + (plotH * i) / 4;
      context.strokeStyle = i === 1 ? "#866c3c" : "#2b342f";
      context.setLineDash(i === 1 ? [4, 4] : []);
      context.beginPath(); context.moveTo(pad.left, y); context.lineTo(width - pad.right, y); context.stroke();
      context.setLineDash([]);
      context.fillStyle = "#758078"; context.textAlign = "left";
      context.fillText(String(100 - i * 25), 2, y + 3);
    }
    const predicted = [];
    const observed = [];
    for (let i = 0; i < 48; i++) {
      const base = 41 + Math.sin(i * .22) * 13 + Math.cos(i * .51) * 9 + seeded(i, 11 + state.streamTick) * 13;
      predicted.push(Math.min(95, Math.max(10, base + (i > 38 ? (i - 38) * 1.15 : 0))));
      observed.push(Math.min(91, Math.max(8, base - 4 + Math.sin(i * .8) * 8 + seeded(i, 17) * 9)));
    }
    if (state.simulation) {
      for (let i = 33; i < predicted.length; i++) predicted[i] = Math.min(96, predicted[i] + Math.min(26, (i - 32) * 2.8));
      for (let i = 39; i < observed.length; i++) observed[i] = Math.min(94, observed[i] + (i - 38) * 2.4);
    }
    const drawLine = (values, color, dashed = false) => {
      context.beginPath();
      values.forEach((value, i) => {
        const x = pad.left + (plotW * i) / (values.length - 1);
        const y = pad.top + plotH * (1 - value / 100);
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.strokeStyle = color; context.lineWidth = dashed ? 1.4 : 1.8;
      context.setLineDash(dashed ? [3, 3] : []); context.stroke(); context.setLineDash([]);
    };
    drawLine(predicted, "#a4f06e", true);
    drawLine(observed, "#77b6c4");
    const lastX = pad.left + plotW;
    const lastY = pad.top + plotH * (1 - observed.at(-1) / 100);
    context.beginPath(); context.arc(lastX, lastY, 3, 0, Math.PI * 2);
    context.fillStyle = "#9ddce8"; context.fill();
  }

  function renderWarehouse() {
    const grid = $("#warehouseGrid");
    const robotCells = new Set([27, 68, 109, 153, 196, 238]);
    const docks = new Set([0, 1, 2, 3, 4, 15, 16, 17, 18, 19, 260, 261, 262, 263, 264, 275, 276, 277, 278, 279]);
    grid.innerHTML = Array.from({ length: 280 }, (_, index) => {
      const row = Math.floor(index / 20);
      const col = index % 20;
      let cls = "warehouse-cell";
      if (row === 0 || row === 13 || col === 0 || col === 19 || col % 5 === 0) cls += " aisle";
      else cls += " storage";
      if (docks.has(index)) cls = "warehouse-cell dock";
      if (index === 117 || index === 118) cls = "warehouse-cell blocked";
      if (robotCells.has(index)) cls += ` robot-cell${index === 196 ? " warn" : ""}`;
      return `<span class="${cls}" title="Zone ${String.fromCharCode(65 + Math.floor(col / 5))}${String(row + 1).padStart(2, "0")}"></span>`;
    }).join("");
    const robotData = [
      ["AMR-07", "Picking · A-14", "ACTIVE"], ["AMR-12", "Transfer · C-08", "ACTIVE"],
      ["AMR-18", "Charging · B-21", "CHARGING"], ["AMR-23", "Transfer · D-03", "ACTIVE"],
      ["AMR-26", "Picking · A-06", "IDLE"]
    ];
    $("#robotList").innerHTML = robotData.map(([id, task, status]) => `<div class="robot-row"><span class="robot-icon">⌖</span><div><strong>${id}</strong><small>${task}</small></div><span class="robot-state ${status === "CHARGING" ? "charge" : status === "IDLE" ? "idle" : ""}">${status}</span></div>`).join("");
    const tasks = Array.from({ length: 8 }, (_, i) => ({
      id: `TK-${String(4091 + i).padStart(5, "0")}`,
      type: i % 3 === 0 ? "Picking" : "Transfer",
      location: `Zone ${String.fromCharCode(65 + i % 4)}-${String(1 + ((i * 3) % 14)).padStart(2, "0")}`,
      unit: `AMR-${String(7 + i * 3).padStart(2, "0")}`,
      progress: 18 + ((i * 13) % 79),
      status: i === 3 ? "QUEUED" : "IN PROGRESS"
    }));
    $("#taskTable").innerHTML = tasks.filter(task => state.taskType === "all" || task.type.toLowerCase().startsWith(state.taskType)).map(task => `<tr><td class="task-table-id">${task.id}</td><td class="task-type">${task.type}</td><td>${task.location}</td><td>${task.unit}</td><td><span class="progress-cell"><i><b style="width:${task.progress}%"></b></i>${task.progress}%</span></td><td class="task-status ${task.status === "QUEUED" ? "waiting" : ""}">${task.status}</td></tr>`).join("");
  }

  const money = value => `$${Math.round(value).toLocaleString("en-US")}`;
  const formatEta = date => new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(date);
  function filteredShipments() {
    const query = state.search.trim().toLowerCase();
    return shipments.filter(shipment => {
      const matchesTab = state.shipmentTab === "all" ||
        (state.shipmentTab === "transit" && shipment.status === "In transit") ||
        (state.shipmentTab === "risk" && shipment.status === "At risk") ||
        (state.shipmentTab === "delivered" && shipment.status === "Delivered");
      const matchesSearch = !query || [shipment.id, shipment.origin, shipment.destination, shipment.carrier, shipment.mode, shipment.tracking].some(value => value.toLowerCase().includes(query));
      const matchesStatus = state.status === "all" || shipment.status === state.status;
      const matchesMode = state.mode === "all" || shipment.mode === state.mode;
      const matchesRegion = state.region === "all" || shipment.region === state.region || shipment.destinationRegion === state.region;
      return matchesTab && matchesSearch && matchesStatus && matchesMode && matchesRegion;
    }).sort((a, b) => {
      if (state.sort === "risk") return ({ High: 0, Medium: 1, Low: 2 }[a.risk] - { High: 0, Medium: 1, Low: 2 }[b.risk]) || a.eta - b.eta;
      if (state.sort === "value") return b.value - a.value;
      return a.eta - b.eta;
    });
  }

  function renderShipments() {
    const list = filteredShipments();
    const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    const visible = list.slice(start, start + state.pageSize);
    $("#manifestTotal").textContent = shipments.length.toLocaleString();
    $("#allCount").textContent = shipments.length.toLocaleString();
    $("#shipmentRows").innerHTML = visible.map(shipment => {
      const badge = shipment.status.toLowerCase().replaceAll(" ", "-");
      const riskClass = shipment.risk.toLowerCase();
      return `<tr data-shipment-id="${shipment.id}"><td><input type="checkbox" class="row-select" aria-label="Select ${shipment.id}"></td><td><span class="shipment-id" data-open-shipment="${shipment.id}">${shipment.id}</span></td><td><span class="shipment-destination">${shipment.origin} <span style="color:#76847a">→</span> ${shipment.destination}</span><small>${shipment.region} <span style="color:#607068">·</span> ${shipment.destinationRegion}</small></td><td><span class="carrier-cell"><i class="carrier-mark">${shipment.carrier.slice(0, 1)}</i><span><strong>${shipment.carrier}</strong><small>${shipment.mode}</small></span></span></td><td><span class="eta-cell"><strong>${formatEta(shipment.eta)}</strong><small>UTC · ${shipment.progress}% complete</small></span></td><td><span class="status-badge ${badge}">${shipment.status}</span></td><td><span class="risk-badge ${riskClass}">${shipment.risk.toUpperCase()}</span></td><td><span class="value-cell">${money(shipment.value)}</span></td><td><button class="row-more" data-open-shipment="${shipment.id}" aria-label="More about ${shipment.id}">···</button></td></tr>`;
    }).join("");
    $("#emptyState").hidden = list.length > 0;
    $("#shipmentRows").closest("table").hidden = list.length === 0;
    $("#resultCount").textContent = list.length
      ? `Showing ${start + 1}–${Math.min(start + state.pageSize, list.length)} of ${list.length.toLocaleString()} shipments`
      : "Showing 0 shipments";
    const pageNumbers = [];
    const low = Math.max(1, Math.min(state.page - 2, totalPages - 4));
    for (let page = low; page <= Math.min(totalPages, low + 4); page++) pageNumbers.push(page);
    $("#pageNumbers").innerHTML = pageNumbers.map(page => `<button class="page-number ${page === state.page ? "active" : ""}" data-page="${page}">${page}</button>`).join("");
    $("#prevPage").disabled = state.page <= 1;
    $("#nextPage").disabled = state.page >= totalPages;
    const activeFilters = Number(state.status !== "all") + Number(state.mode !== "all") + Number(state.region !== "all");
    $("#filterBadge").style.display = activeFilters ? "inline-block" : "none";
  }

  function openShipment(id) {
    const shipment = shipments.find(item => item.id === id);
    if (!shipment) return;
    $("#drawerTitle").textContent = shipment.id;
    $("#drawerContent").innerHTML = `
      <div class="drawer-section"><h3>SHIPMENT OVERVIEW</h3><div class="drawer-kpis"><div><span>CARGO VALUE</span><strong>${money(shipment.value)}</strong></div><div><span>UNITS</span><strong>${shipment.units.toLocaleString()}</strong></div><div><span>STATUS</span><strong>${shipment.status}</strong></div><div><span>RISK LEVEL</span><strong>${shipment.risk}</strong></div></div></div>
      <div class="drawer-section"><h3>ROUTE & CARRIER</h3><div class="drawer-route"><span></span><span></span></div><div class="drawer-row"><span>ORIGIN</span><strong>${shipment.origin} · ${shipment.region}</strong></div><div class="drawer-row"><span>DESTINATION</span><strong>${shipment.destination} · ${shipment.destinationRegion}</strong></div><div class="drawer-row"><span>CARRIER / MODE</span><strong>${shipment.carrier} · ${shipment.mode}</strong></div><div class="drawer-row"><span>ETA (UTC)</span><strong>${formatEta(shipment.eta)}</strong></div><div class="drawer-row"><span>TRACKING NUMBER</span><strong>${shipment.tracking}</strong></div></div>
      <div class="drawer-section"><h3>FULFILLMENT PROGRESS</h3><div class="drawer-row"><span>DELIVERY COMPLETION</span><strong>${shipment.progress}%</strong></div><span class="kpi-track" style="display:block;max-width:none"><i style="width:${shipment.progress}%"></i></span><div class="drawer-row" style="margin-top:8px"><span>CARGO WEIGHT</span><strong>${shipment.weight.toLocaleString()} kg</strong></div></div>
      <div class="drawer-actions"><button class="button button-quiet" id="drawerTrack">⌖ Track shipment</button><button class="button button-primary" id="drawerReroute">↗ Reroute</button></div>`;
    $("#detailDrawer").classList.add("open");
    $("#detailDrawer").setAttribute("aria-hidden", "false");
    $("#drawerTrack").addEventListener("click", () => showToast(`Live tracking opened for ${shipment.id}.`));
    $("#drawerReroute").addEventListener("click", () => {
      showToast(`${shipment.id} reroute recommendation queued for review.`, "warning");
      $("#detailDrawer").classList.remove("open");
      $("#detailDrawer").setAttribute("aria-hidden", "true");
    });
  }

  function exportCsv() {
    const rows = filteredShipments();
    const columns = ["Shipment ID", "Origin", "Destination", "Region", "Carrier", "Mode", "ETA UTC", "Status", "Risk", "Value USD", "Units", "Tracking"];
    const quote = value => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [columns.map(quote).join(","), ...rows.map(shipment => [
      shipment.id, shipment.origin, shipment.destination, `${shipment.region} → ${shipment.destinationRegion}`,
      shipment.carrier, shipment.mode, shipment.eta.toISOString(), shipment.status, shipment.risk,
      shipment.value, shipment.units, shipment.tracking
    ].map(quote).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `aethergrid-manifest-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length.toLocaleString()} shipments to CSV.`);
  }

  function runSimulation() {
    state.simulation = !state.simulation;
    const exposure = $("#exposureScore");
    const risk = $("#riskIndex");
    exposure.innerHTML = state.simulation ? '31.6<span class="metric-unit">%</span>' : '18.2<span class="metric-unit">%</span>';
    $("#exposureDelta").textContent = state.simulation ? "↑ 17.7%" : "↑ 4.3%";
    risk.textContent = state.simulation ? "31.6" : "18.2";
    $("#valueAtRisk").innerHTML = state.simulation ? '$4.8<span>M</span>' : '$2.4<span>M</span>';
    $("#anomalyCount").textContent = state.simulation ? "05" : "03";
    $("#riskIndex").closest(".risk-score-main").querySelector(".risk-level").textContent = state.simulation ? "ELEVATED" : "MODERATE";
    $("#riskScoreChange").textContent = state.simulation ? "↑ 17.7%" : "↑ 4.3%";
    $("#riskScoreFoot").innerHTML = state.simulation
      ? 'Scenario impact extends to <strong>5 connected lanes</strong> and 42 shipments.'
      : 'Network exposure is <strong>4.3% higher</strong> than the 7-day baseline.';
    $("#anomalySummary").textContent = state.simulation ? "5 lanes affected" : "2 require action";
    $("#valueAtRiskChange").textContent = state.simulation ? "↑ 100%" : "↑ 8.2%";
    $("#valueAtRiskSummary").textContent = state.simulation ? "Across 5 flagged lanes" : "Across 3 flagged lanes";
    $("#riskScenario").textContent = state.simulation ? "↻ Reset scenario" : "⌁ Simulate disruption";
    $("#simulateButton").textContent = state.simulation ? "↻ Reset scenario" : "⌁ Run scenario";
    drawMaps();
    renderAnomalies();
    drawRiskChart();
    showToast(state.simulation
      ? "Scenario active: Los Angeles port congestion cascades to 5 lanes. Exposure +13.4%."
      : "Scenario reset. Network indicators restored to baseline.");
  }

  function openCommand() {
    $("#modalBackdrop").hidden = false;
    $("#commandInput").value = "";
    state.selectedCommand = 0;
    renderCommands("");
    window.setTimeout(() => $("#commandInput").focus(), 0);
  }
  function closeCommand() {
    $("#modalBackdrop").hidden = true;
    $("#commandTrigger").focus();
  }
  function renderCommands(query) {
    const items = commandItems.filter(item => `${item.title} ${item.sub}`.toLowerCase().includes(query.toLowerCase()));
    if (!items.length) {
      $("#commandResults").innerHTML = '<div class="command-result">No matching commands</div>';
      return;
    }
    state.activeCommands = items;
    state.selectedCommand = Math.min(state.selectedCommand, items.length - 1);
    $("#commandResults").innerHTML = items.map((item, index) => `<button class="command-result ${index === state.selectedCommand ? "selected" : ""}" data-command-index="${index}"><span>${item.icon}</span>${item.title}<small>${item.sub}</small></button>`).join("");
  }
  function executeCommand(item) {
    closeCommand();
    if (item.view) navigate(item.view);
    if (item.action === "simulate") runSimulation();
    if (item.action === "export") exportCsv();
  }

  function bindEvents() {
    $$(".nav-item").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
    $$("[data-navigate]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.navigate)));
    $("#commandTrigger").addEventListener("click", openCommand);
    $("#modalBackdrop").addEventListener("click", event => { if (event.target === $("#modalBackdrop")) closeCommand(); });
    $("#commandInput").addEventListener("input", event => { state.selectedCommand = 0; renderCommands(event.target.value); });
    $("#commandResults").addEventListener("click", event => {
      const button = event.target.closest("[data-command-index]");
      if (button) executeCommand(state.activeCommands[Number(button.dataset.commandIndex)]);
    });
    $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    $("#refreshButton").addEventListener("click", () => {
      updateClock();
      showToast("Illustrative operations data refreshed; current weather refresh requested.");
    });
    $("#manifestRefresh").addEventListener("click", () => { $("#manifestSync").textContent = "On-device"; renderShipments(); showToast("Simulated shipment data refreshed."); });
    $("#simulateButton").addEventListener("click", runSimulation);
    $("#riskScenario").addEventListener("click", runSimulation);
    $("#exportButton").addEventListener("click", exportCsv);
    $("#throughputRange").addEventListener("change", drawThroughput);
    $("#routeRecenter").addEventListener("click", () => { state.mapFilter = "all"; $$(".map-filter").forEach(button => button.classList.toggle("active", button.dataset.mapFilter === "all")); drawMaps(); showToast("Global network map recentered."); });
    $("#routeLayers").addEventListener("click", () => showToast("Map layers: ocean freight, air freight, elevated risk, and distribution hubs."));
    $("#allLanes").addEventListener("click", () => showToast("Showing all 248 active corridors across 14 regions."));
    $("#allAnomalies").addEventListener("click", () => showToast("Anomaly history is current. No previously detected signals require action."));
    $("#alertsButton").addEventListener("click", () => { navigate("risk"); showToast("3 active signals · 2 require attention.", "warning"); });
    $("#allRobots").addEventListener("click", () => showToast("Fleet monitor: 24 active, 3 charging, 1 idle."));
    $("#warehouseReset").addEventListener("click", () => { $("#warehouseGrid").classList.remove("heatmap"); $("#heatToggle").classList.remove("active"); $("#gridToggle").classList.add("active"); showToast("Warehouse twin view reset."); });
    $("#gridToggle").addEventListener("click", () => { $("#warehouseGrid").classList.remove("heatmap"); $("#gridToggle").classList.add("active"); $("#heatToggle").classList.remove("active"); });
    $("#heatToggle").addEventListener("click", () => { $("#warehouseGrid").classList.add("heatmap"); $("#heatToggle").classList.add("active"); $("#gridToggle").classList.remove("active"); });
    $("#twinZoom").addEventListener("click", () => { const grid = $("#warehouseGrid"); const zoomed = grid.dataset.zoomed === "true"; grid.dataset.zoomed = String(!zoomed); grid.style.transform = zoomed ? "" : "scale(1.035)"; showToast(zoomed ? "Floor plan zoom reset." : "Floor plan zoom increased."); });
    $("#pauseRobots").addEventListener("click", event => {
      state.robotsPaused = !state.robotsPaused;
      $("#warehouseGrid").classList.toggle("paused", state.robotsPaused);
      event.currentTarget.textContent = state.robotsPaused ? "▶ Resume AMRs" : "Ⅱ Pause AMRs";
      showToast(state.robotsPaused ? "AMRs paused. Warehouse movements are on hold." : "AMR fleet resumed. Units are moving.");
    });
    $$(".task-filters button").forEach(button => button.addEventListener("click", () => {
      state.taskType = button.dataset.taskFilter;
      $$(".task-filters button").forEach(item => item.classList.toggle("active", item === button));
      renderWarehouse();
    }));
    $$(".map-filter").forEach(button => button.addEventListener("click", () => {
      state.mapFilter = button.dataset.mapFilter;
      $$(".map-filter").forEach(item => item.classList.toggle("active", item === button));
      makeMapSvg($("#view-routes .world-map"), "routes");
    }));
    $("#shipmentSearch").addEventListener("input", event => { state.search = event.target.value; state.page = 1; renderShipments(); });
    $("#shipmentSort").addEventListener("change", event => { state.sort = event.target.value; renderShipments(); });
    $("#statusFilter").addEventListener("change", event => { state.status = event.target.value; state.page = 1; renderShipments(); });
    $("#modeFilter").addEventListener("change", event => { state.mode = event.target.value; state.page = 1; renderShipments(); });
    $("#regionFilter").addEventListener("change", event => { state.region = event.target.value; state.page = 1; renderShipments(); });
    $("#pageSize").addEventListener("change", event => { state.pageSize = Number(event.target.value); state.page = 1; renderShipments(); });
    $("#filterButton").addEventListener("click", () => $("#filterRow").classList.toggle("visible"));
    $("#clearFilters").addEventListener("click", resetFilters);
    $("#emptyClear").addEventListener("click", resetFilters);
    $("#prevPage").addEventListener("click", () => { state.page--; renderShipments(); });
    $("#nextPage").addEventListener("click", () => { state.page++; renderShipments(); });
    $("#pageNumbers").addEventListener("click", event => {
      const button = event.target.closest("[data-page]");
      if (button) { state.page = Number(button.dataset.page); renderShipments(); }
    });
    $$(".manifest-tabs button").forEach(button => button.addEventListener("click", () => {
      state.shipmentTab = button.dataset.shipmentFilter;
      state.page = 1;
      $$(".manifest-tabs button").forEach(tab => tab.classList.toggle("active", tab === button));
      renderShipments();
    }));
    $("#shipmentRows").addEventListener("click", event => {
      const trigger = event.target.closest("[data-open-shipment]");
      if (trigger) openShipment(trigger.dataset.openShipment);
    });
    $("#selectAll").addEventListener("change", event => $$(".row-select").forEach(input => { input.checked = event.target.checked; }));
    $("#closeDrawer").addEventListener("click", () => { $("#detailDrawer").classList.remove("open"); $("#detailDrawer").setAttribute("aria-hidden", "true"); });
    $("#commandInput").addEventListener("keydown", event => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const length = state.activeCommands?.length || 0;
        if (!length) return;
        state.selectedCommand = (state.selectedCommand + (event.key === "ArrowDown" ? 1 : length - 1)) % length;
        renderCommands(event.target.value);
      }
      if (event.key === "Enter" && state.activeCommands?.[state.selectedCommand]) executeCommand(state.activeCommands[state.selectedCommand]);
    });
    window.addEventListener("keydown", event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openCommand(); }
      if (event.key === "Escape") {
        if (!$("#modalBackdrop").hidden) closeCommand();
        if ($("#detailDrawer").classList.contains("open")) { $("#detailDrawer").classList.remove("open"); $("#detailDrawer").setAttribute("aria-hidden", "true"); }
      }
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        event.preventDefault(); navigate("shipments"); $("#shipmentSearch").focus();
      }
    });
    window.addEventListener("resize", () => { drawThroughput(); if (state.view === "risk") drawRiskChart(); });
  }

  function resetFilters() {
    state.search = "";
    state.status = "all";
    state.mode = "all";
    state.region = "all";
    state.page = 1;
    $("#shipmentSearch").value = "";
    $("#statusFilter").value = "all";
    $("#modeFilter").value = "all";
    $("#regionFilter").value = "all";
    renderShipments();
  }

  function init() {
    $$(".mini-bars").forEach(container => {
      container.innerHTML = container.dataset.bars.split(",").map(height => `<i style="height:${height}px"></i>`).join("");
    });
    renderActivity();
    renderLaneRows();
    renderAnomalies();
    drawMiniWarehouse();
    renderWarehouse();
    renderShipments();
    drawMaps();
    bindEvents();
    updateClock();
    drawThroughput();
    window.setInterval(updateClock, 1000);
    window.setInterval(() => {
      state.streamTick++;
      if (state.view === "overview") drawThroughput();
      if (state.view === "risk") drawRiskChart();
    }, 5000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
