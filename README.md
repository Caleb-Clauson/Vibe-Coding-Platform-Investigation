# SignalSafe (Demo)

SignalSafe is a small-business Wi-Fi survey demonstration. The finished app will plot Wi-Fi measurements on a map, flag likely problems, and produce a fix report. This version lays the foundation: navigation, measurement entry, shared data, and a fictional demo survey.

This is a demonstration. It uses sample, demo, or user-entered measurements only. It has no accounts, no database, no external services, and no live Wi-Fi scanning. Readings are saved in the browser's local storage, so they stay on the device where they were entered.

## Current features

- **Navigation** with four sections: Survey, Map, Findings, and Fix Report.
- **Survey section** (complete):
  - Add, edit, and delete Wi-Fi readings.
  - Each reading has a location name, zone (Indoor or Parking Lot), horizontal and vertical map positions (0-100), network name (SSID), access point ID (BSSID), and signal strength in dBm.
  - Inline validation messages explain what to correct before a reading is saved.
  - Deleting asks for confirmation.
  - **Load Demo Survey** replaces the readings with a fixed set of 10 fictional measurements for Maple Street Bakery (a fictional business). The set covers healthy and weak indoor readings, strong and fair parking-lot readings from the business access point, and readings from an unrecognized access point. Loading the demo again replaces the set rather than adding duplicates. If the current readings differ from the demo set, you are asked to confirm first.
  - An approved access point inventory lists the two access points the fictional business owns.
- **Shared data:** one measurement list is used by every section.
- **Saving:** readings persist across page refreshes using browser local storage. A warning appears if the browser blocks saving.
- **Sample data:** one clearly fictional reading ("SAMPLE: Front lobby (fictional)") is included for first-time testing.

- **Map:** plots each reading on a floor-style map, colored by signal strength (good, fair, or weak). Unrecognized access points appear as diamonds.
- **Findings:** lists weak and fair indoor signal, possible parking-lot leakage, and unrecognized access points, sorted by priority, with affected readings and recommended actions.
- **Fix Report:** a printable summary of findings, recommended fixes, approved access points, and all readings. Use Print to save it as a PDF.
- **Shared data:** one measurement list is used by every section.
- **Saving:** readings persist across page refreshes using browser local storage. A warning appears if the browser blocks saving.
- **Sample data:** one clearly fictional reading ("SAMPLE: Front lobby (fictional)") is included for first-time testing.

## Running the project

```
npm install
npm run dev
```

To build for production, run `npm run build`.

## Project structure

- `src/App.tsx`: navigation and section layout.
- `src/context/MeasurementContext.tsx`: shared measurement data and saving.
- `src/data/demoSurvey.ts`: fictional demo readings, approved access point inventory, and demo detection.
- `src/lib/`: validation rules, Wi-Fi analysis, finding presentation, and local storage helpers.
- `src/sections/`: the Survey, Map, Findings, and Fix Report sections.
- `src/survey/`: the reading form, reading list, and approved access point inventory.
- `src/map/`: the floor map drawing.
- `src/findings/`: the finding card shown in Findings and the Fix Report.
- `src/index.css`: app styling.
