# Aurora Australis Predictor (React Native + Expo)

Aurora Australis Predictor is a mobile app that turns live Australian space weather data into a simple **1–3 day aurora viewing outlook**.

It is built with React Native on Expo and is designed for quick, practical decisions:
- Is it worth heading out tonight?
- Are conditions improving?
- Is there an active BoM notice I should know about?

---

## What the app does

The app combines three live indicators from the BoM Space Weather Services API:
- **Kp index** (geomagnetic activity)
- **Solar wind speed**
- **IMF Bz** (southward magnetic component)

Using these thresholds:
- Kp: **4–7**
- Solar wind: **> 450 km/s**
- Bz: **negative**

…the app calculates an easy forecast rating:
- **Excellent**
- **Promising**
- **Low**

It also:
- displays current Australian aurora notices (alert/watch/outlook),
- requests location permission to show latitude context,
- requests notification permission and sends a local notification when a new notice appears,
- caches latest data for faster startup,
- auto-refreshes in the foreground every 15 minutes,
- includes built-in camera tips for aurora photography.

---

## How it works (high-level flow)

1. **Launch animation** is shown briefly.
2. App requests:
   - foreground location permission,
   - notification permission.
3. App loads cached data (if available) from local storage.
4. App fetches live conditions + notices from BoM SWS endpoints.
5. App computes the forecast rating from current thresholds.
6. If a new relevant notice is detected, the app schedules a local notification.
7. Dashboard updates with freshness/state indicators and allows pull-to-refresh.

---

## Clone and run with Expo (Expo Go)

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd Aurora-Australis-M8
```

### 2) Install dependencies

```bash
npm install
```

If you get an error like `npm ERR! enoent Could not read package.json`, you are likely in the wrong folder.

For example, running `npm install` from `C:\Users\<you>\Desktop` will fail because that directory has no `package.json`.
Change into the cloned project directory first, then run install:

```bash
cd Aurora-Australis-M8
npm install
```

### 3) Start the Expo development server

```bash
npx expo start
```

### 4) Run the app

- Install **Expo Go** on your iOS or Android device.
- Scan the QR code shown in the terminal/browser after `expo start`.
- Or press `a` (Android emulator), `i` (iOS simulator on macOS), or `w` (web).

---

## Run/build with EAS (Expo Application Services)

If you want cloud builds (APK/AAB/IPA) instead of only local Expo Go preview:

### 1) Install EAS CLI

```bash
npm install -g eas-cli
```

### 2) Log in to Expo

```bash
eas login
```

### 3) Configure EAS in the project

```bash
eas build:configure
```

### 4) Start a build

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

### 5) Build a development client (recommended for device testing)

This project has an EAS `development` profile in `eas.json`. Use it to build a dev client:

```bash
eas build --platform android --profile development
```

If you see `The `expo` package was not found`, run `npm install` in the project root first so dependencies are installed locally before starting EAS commands.


> Note: iOS production builds require an Apple Developer setup.

---

## Scripts

```bash
npm run start      # expo start
npm run android    # expo run:android
npm run ios        # expo run:ios
npm run web        # expo start --web
```

---

## Data source

- BoM Space Weather Services API base URL: `https://sws-data.sws.bom.gov.au/`
- Endpoint mappings are defined in: `src/services/swsApi.js`

If endpoint paths change upstream, update the `ENDPOINTS` object in that file.

---

## Permissions used

- **Location (foreground):** used to provide latitude-based viewing context.
- **Notifications:** used to alert the user when a new aurora notice is detected.
