# San Andreas Airport Charts Directory

Place your airport chart images in this folder to have them automatically displayed in the `/me Bank` application.

## Suggested Files

- `lsia.png` - Los Santos International Airport (LSIA) Aerodrome / Taxiway Chart
- `sandy_shores.png` - Sandy Shores Airfield Chart
- `mckenzie.png` - McKenzie Field (Grapeseed) Chart

## Adding More Charts

You can configure additional charts or change file paths in `src/data.js` under `PILOT` > `ATC` > `airport charts`:

```javascript
charts: [
  {
    title: "Your Chart Title",
    imagePath: "/charts/your_file_name.png"
  }
]
```
