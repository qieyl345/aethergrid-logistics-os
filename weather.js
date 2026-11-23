(() => {
  "use strict";

  const hubs = [
    { name: "Singapore", code: "SGP", latitude: 1.2644, longitude: 103.8222 },
    { name: "Rotterdam", code: "RTM", latitude: 51.9225, longitude: 4.4792 },
    { name: "Los Angeles", code: "LAX", latitude: 33.7701, longitude: -118.1937 },
    { name: "Shanghai", code: "SHA", latitude: 31.2304, longitude: 121.4737 },
    { name: "Dubai", code: "DXB", latitude: 25.2048, longitude: 55.2708 },
    { name: "Santos", code: "SSZ", latitude: -23.9608, longitude: -46.3336 },
    { name: "Hamburg", code: "HAM", latitude: 53.5511, longitude: 9.9937 },
    { name: "Tokyo", code: "TYO", latitude: 35.6762, longitude: 139.6503 },
    { name: "New York", code: "NYC", latitude: 40.6892, longitude: -74.0445 },
    { name: "Mumbai", code: "BOM", latitude: 18.9388, longitude: 72.8354 }
  ];
  const endpoint = "https://api.open-meteo.com/v1/forecast";
  const weatherCodes = new Map([
    [0, "Clear"], [1, "Mainly clear"], [2, "Partly cloudy"], [3, "Overcast"],
    [45, "Fog"], [48, "Rime fog"], [51, "Light drizzle"], [53, "Drizzle"], [55, "Dense drizzle"],
    [56, "Freezing drizzle"], [57, "Dense freezing drizzle"], [61, "Light rain"], [63, "Rain"], [65, "Heavy rain"],
    [66, "Freezing rain"], [67, "Heavy freezing rain"], [71, "Light snow"], [73, "Snowfall"], [75, "Heavy snow"],
    [77, "Snow grains"], [80, "Light rain showers"], [81, "Rain showers"], [82, "Heavy rain showers"],
    [85, "Snow showers"], [86, "Heavy snow showers"], [95, "Thunderstorm"], [96, "Thunderstorm, light hail"], [99, "Thunderstorm, heavy hail"]
  ]);
  const weatherSymbols = code => code === 0 ? "☼"
    : [1, 2, 3].includes(code) ? "◐"
      : [45, 48].includes(code) ? "≋"
        : [71, 73, 75, 77, 85, 86].includes(code) ? "❄"
          : [95, 96, 99].includes(code) ? "ϟ" : "☂";
  const windDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const compassDirection = degrees => windDirections[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
  let snapshot = null;
  let fetchedAt = null;
  let attemptedAt = null;
  let errorMessage = "";
  let status = "loading";
  let inFlight = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function parseCurrent(hub, response) {
    const current = response?.current;
    const time = typeof current?.time === "string" ? current.time : "";
    const temperature = Number(current?.temperature_2m);
    const apparentTemperature = Number(current?.apparent_temperature);
    const humidity = Number(current?.relative_humidity_2m);
    const windSpeed = Number(current?.wind_speed_10m);
    const windDegrees = Number(current?.wind_direction_10m);
    const weatherCode = Number(current?.weather_code);
    if (!time || !Number.isFinite(Date.parse(`${time}Z`))
      || !Number.isFinite(temperature) || !Number.isFinite(apparentTemperature)
      || !Number.isFinite(humidity) || !Number.isFinite(windSpeed)
      || !Number.isFinite(windDegrees) || !weatherCodes.has(weatherCode)) {
      return { hub, current: null, error: "Provider response was incomplete." };
    }
    return {
      hub,
      current: {
        time,
        temperature: Math.round(temperature),
        apparentTemperature: Math.round(apparentTemperature),
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed),
        windDirection: compassDirection(windDegrees)
      },
      condition: weatherCodes.get(weatherCode),
      symbol: weatherSymbols(weatherCode)
    };
  }

  async function fetchCurrent({ signal } = {}) {
    const url = new URL(endpoint);
    url.searchParams.set("latitude", hubs.map(hub => hub.latitude).join(","));
    url.searchParams.set("longitude", hubs.map(hub => hub.longitude).join(","));
    url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m");
    url.searchParams.set("timezone", "UTC");

    const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal });
    if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}.`);
    const payload = await response.json();
    const responses = Array.isArray(payload) ? payload : [payload];
    if (responses.length !== hubs.length) throw new Error("Open-Meteo returned an unexpected number of hub locations.");

    const rows = hubs.map((hub, index) => parseCurrent(hub, responses[index]));
    const modelUpdatedAt = rows.filter(row => row.current)
      .map(row => row.current.time)
      .sort()
      .at(-1);
    if (!modelUpdatedAt) throw new Error("Open-Meteo did not return valid current conditions.");
    return { rows, modelUpdatedAt, fetchedAt: new Date().toISOString(), source: endpoint };
  }

  function formatUtcTime(timestamp) {
    if (!timestamp) return "time unavailable";
    const normalized = timestamp.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(timestamp) ? timestamp : `${timestamp}Z`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return "time unavailable";
    return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(date) + " UTC";
  }

  function renderStatus() {
    const hasSnapshot = Boolean(snapshot);
    const liveCount = snapshot?.rows.filter(row => row.current).length || 0;
    const labels = {
      loading: ["WEATHER LOADING", "Weather feed loading"],
      refreshing: ["WEATHER UPDATING", "Weather model updating"],
      live: ["WEATHER MODEL LIVE", "Weather model live"],
      partial: ["WEATHER PARTIAL", "Weather data partial"],
      stale: ["WEATHER STALE", "Weather data stale"],
      error: ["WEATHER UNAVAILABLE", "Weather unavailable"]
    };
    const [label, sidebarLabel] = labels[status];
    const dot = $("#weatherStateDot");
    if (dot) dot.className = `weather-state-dot ${status}`;
    const header = $("#weatherStateLabel");
    if (header) header.textContent = label;
    const footerDot = $("#weatherFooterDot");
    if (footerDot) footerDot.className = `weather-state-dot ${status}`;
    const footerStatus = $("#weatherFooterStatus");
    if (footerStatus) footerStatus.textContent = label;
    const sidebar = $("#weatherStatusSidebar");
    if (sidebar) {
      sidebar.dataset.feedState = status;
      $("#weatherStatusTitle").textContent = sidebarLabel;
    }

    let message;
    if (status === "loading") message = "Loading public current weather-model data for 10 hub locations…";
    else if (status === "refreshing") message = `Refreshing the public weather model; showing prior data from ${formatUtcTime(snapshot.modelUpdatedAt)} until the update succeeds.`;
    else if (status === "live") message = `Latest modeled conditions received for ${liveCount}/10 hubs · model time ${formatUtcTime(snapshot.modelUpdatedAt)} · refreshes every 30 minutes.`;
    else if (status === "partial") message = `Partial provider response: modeled conditions are available for ${liveCount}/10 hubs; other locations are explicitly unavailable.`;
    else if (status === "stale") message = `Showing previously received weather-model data from ${formatUtcTime(snapshot.modelUpdatedAt)}. Latest refresh failed: ${errorMessage}`;
    else message = `Live weather unavailable: ${errorMessage || "No provider response."} No sample data is substituted.`;

    $$(".weather-feed-status").forEach(element => {
      element.dataset.weatherStatus = status;
      element.textContent = message;
    });
    const metadata = hasSnapshot
      ? `Model time ${formatUtcTime(snapshot.modelUpdatedAt)} · fetched ${formatUtcTime(snapshot.fetchedAt)}`
      : attemptedAt ? `Last checked ${formatUtcTime(attemptedAt)}` : "Waiting for provider";
    for (const id of ["overviewWeatherUpdated", "routesWeatherUpdated"]) {
      const element = $(`#${id}`);
      if (element) element.textContent = metadata;
    }
    $$(".weather-refresh").forEach(button => { button.disabled = inFlight; });
  }

  function renderCards() {
    $$(".hub-weather-grid").forEach(grid => {
      if (!snapshot) {
        grid.innerHTML = status === "error"
          ? `<div class="weather-empty"><strong>Weather data is unavailable.</strong><span>Nothing is shown as live until Open-Meteo returns valid data.</span><button class="button button-quiet weather-retry" type="button">Retry weather request</button></div>`
          : hubs.map(hub => `<div class="weather-placeholder" aria-label="Loading weather for ${hub.name}"><span class="weather-placeholder-line"></span><span class="weather-placeholder-line short"></span><span class="weather-placeholder-line"></span></div>`).join("");
        return;
      }
      grid.innerHTML = snapshot.rows.map(row => {
        if (!row.current) return `<article class="hub-weather-card weather-unavailable"><div class="weather-card-top"><span>${row.hub.code}</span><span class="weather-card-state unavailable">UNAVAILABLE</span></div><div class="weather-card-place">${row.hub.name}</div><div class="weather-card-unavailable">No valid provider data for this hub.</div></article>`;
        const stateLabel = status === "stale" ? "STALE" : status === "refreshing" ? "LAST MODEL" : "MODEL NOW";
        const current = row.current;
        return `<article class="hub-weather-card" data-weather-hub="${row.hub.code}"><div class="weather-card-top"><span>${row.hub.code}</span><span class="weather-card-state ${status}">${stateLabel}</span></div><div class="weather-card-place">${row.hub.name}</div><div class="weather-card-main"><span class="weather-glyph" aria-hidden="true">${row.symbol}</span><strong>${current.temperature}°C</strong></div><div class="weather-condition">${row.condition}</div><div class="weather-details"><span>Feels ${current.apparentTemperature}°</span><span>RH ${current.humidity}%</span><span>Wind ${current.windSpeed} km/h ${current.windDirection}</span></div><div class="weather-observed">MODEL TIME ${formatUtcTime(current.time)}</div></article>`;
      }).join("");
    });
  }

  function render() {
    renderStatus();
    renderCards();
  }

  async function refresh() {
    if (inFlight) return;
    inFlight = true;
    attemptedAt = new Date().toISOString();
    status = snapshot ? "refreshing" : "loading";
    errorMessage = "";
    render();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const result = await fetchCurrent({ signal: controller.signal });
      if (!result.rows.some(row => row.current)) throw new Error("The provider returned no valid current conditions.");
      snapshot = result;
      fetchedAt = Date.now();
      const validCount = result.rows.filter(row => row.current).length;
      status = validCount === hubs.length ? "live" : "partial";
    } catch (error) {
      status = snapshot ? "stale" : "error";
      errorMessage = error?.name === "AbortError" ? "The weather request timed out." : (error?.message || "The weather request failed.");
    } finally {
      window.clearTimeout(timeout);
      inFlight = false;
      render();
    }
  }

  function init() {
    $$(".weather-refresh").forEach(button => button.addEventListener("click", refresh));
    document.addEventListener("click", event => {
      if (event.target.closest(".weather-retry, #refreshButton")) refresh();
    });
    render();
    refresh();
    window.setInterval(() => {
      if (fetchedAt && Date.now() - fetchedAt > 45 * 60 * 1000 && ["live", "partial"].includes(status)) {
        status = "stale";
        render();
      }
    }, 60 * 1000);
    window.setInterval(() => { if (!document.hidden) refresh(); }, 30 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && fetchedAt && Date.now() - fetchedAt > 30 * 60 * 1000) refresh();
    });
  }

  window.AetherGridWeather = Object.freeze({ fetchCurrent, refresh, getStatus: () => status });
  document.addEventListener("DOMContentLoaded", init);
})();
