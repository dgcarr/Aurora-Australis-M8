# Aurora Australis Predictor (React Native / Expo)

A vibrant React Native app that monitors Australian space weather data and predicts Aurora Australis potential 1–3 days in advance.

## Features

- Modern neon/aurora visual style on app launch
- Uses BoM Space Weather Services API (`https://sws-data.sws.bom.gov.au/`)
- Tracks key aurora indicators:
  - **Kp-index** (target 4–7)
  - **Solar wind speed** (target > 450 km/s)
  - **IMF Bz** (target negative)
- Requests location permission to personalize viewing context by latitude
- Alerts user when any Australian aurora **alert/watch/outlook** notice is current
- In-app camera setting tips for photographing aurora

## Quick start

```bash
npm install
npm run start
```

Then open with Expo Go (iOS/Android) or an emulator.

## API endpoint note

`src/services/swsApi.js` is pre-configured with endpoint paths derived from BoM SWS API examples. If endpoint paths change, update the `ENDPOINTS` object there.

## Permissions used

- Location (foreground): estimate visibility by user latitude
- Notifications: deliver aurora notice alerts
