# AetherGrid Logistics OS

A standalone logistics operations dashboard. Shipment manifests, route utilization, vessel/freight positions, warehouse robots, activity, risk scores, and financial metrics are **simulated illustrative demo data**. They are not connected to a logistics company, real shipments, cargo, vessels, ports, warehouses, or robots.

## Live public weather feed

The only live operational-context feed is the public, no-key [Open-Meteo Forecast API](https://open-meteo.com/en/docs). It requests modeled current conditions for these ten approximate city/port hub coordinates in one batched request: Singapore, Rotterdam, Los Angeles, Shanghai, Dubai, Santos, Hamburg, Tokyo, New York, and Mumbai. Displayed fields are temperature, apparent temperature, relative humidity, WMO weather description, wind speed, and wind direction.

The API's `current` values come from weather models; they are not necessarily station observations. The data are local hub weather context, **not marine forecasts, port status, route conditions, or shipment/vessel telemetry**. Each card displays the provider model timestamp in UTC; panel status also reports the fetch time and uses explicit loading, live, partial, stale, and unavailable states. Failed requests never fall back to demo weather. After a successful fetch, a later refresh failure preserves the last actual response and marks it stale; a first-load failure shows an unavailable state with a retry control. A single batched request refreshes every 30 minutes while the page is open and visible.

The feed links and attributes [Open-Meteo](https://open-meteo.com/) as its source. Its free/open-access API is for non-commercial use under its [terms](https://open-meteo.com/en/terms) and data [licence](https://open-meteo.com/en/licence); the provider's published limits and terms apply. For commercial products, advertising, or higher-volume use, obtain the appropriate Open-Meteo subscription and comply with its terms. Forecasts are provided without a guarantee of accuracy or uninterrupted availability.

## Run

Serve the repository root with a local static web server and open `/`. For example:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`. The app uses plain HTML, CSS, and JavaScript with no build step, API key, or backend. Serve it over HTTP(S); browser restrictions can prevent API requests from a `file://` page. Network access to `api.open-meteo.com` is required for live weather. If unavailable, the dashboard clearly reports the feed error and does not invent replacement weather.

## Dashboard modules

- **Command center:** illustrative operations KPIs, simulated global route visualization, activity feed, and throughput chart, plus a live public weather-model view for all ten hubs.
- **Global routes:** simulated route network, corridor performance, and hub map with a separate ten-hub live weather model panel.
- **Warehouse twin:** simulated 20 × 14 floor plan, AMR positions, warehouse metrics, heatmap and controls.
- **Risk intelligence:** simulated signal chart, risk metrics, anomaly feed, and disruption scenario.
- **Shipment manifest:** 524 simulated records with search, status/mode/region filters, sorting, pagination, detail drawer, selection, and CSV export.

Use **Ctrl/⌘ K** for quick navigation and commands, or **/** to focus shipment search. All shipment, route, fleet, facility, risk, and financial values remain simulations regardless of the weather-feed status.
