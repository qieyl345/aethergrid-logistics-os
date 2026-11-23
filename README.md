# AetherGrid Logistics OS

A self-contained logistics operations dashboard added alongside the existing UiTM e-Marketplace. It uses browser-generated mock telemetry and requires no API keys, backend, package installation, or external services.

## Run

Open `aethergrid/index.html` directly, or serve the repository root with a local static web server and visit `/aethergrid/`. The existing marketplace remains at `/`.

## Operations

- **Command center:** network metrics, global route activity, a live-style throughput chart, activity feed, and Singapore facility snapshot.
- **Global routes:** interactive hub markers, ocean/air/risk lane filters, corridor performance, and hub status.
- **Warehouse twin:** 20 × 14 floor grid, heatmap toggle, AMR pause/resume, fleet monitor, and task-type filters.
- **Risk intelligence:** synthetic risk-signal chart, anomaly feed, regional exposure, and a disruption scenario that updates network exposure, value at risk, and risk telemetry.
- **Shipment manifest:** 524 generated records with search, status/mode/region filters, sorting, pagination, row selection, shipment detail drawer, and CSV export.

Use **Ctrl/⌘ K** for quick navigation and commands, or **/** to focus shipment search. All generated records are local demo data and do not represent live logistics operations.
