# Blue Stamp

Android mobile application built with Capacitor + React/TypeScript.

## Overview

Blue Stamp is the Android mobile client for the Blue platform, providing a native Android app experience using web technologies.

## Tech Stack

- **Framework**: Capacitor (Android target)
- **UI**: React + TypeScript
- **Build**: Vite
- **Package Manager**: npm

## Getting Started

```bash
npm install
npm run dev
```

## Requirements

- Android Studio
- JDK 17+
- Android SDK (API 24+)

## Project Structure

```
blue_stamp/
├── src/           # React/TypeScript source
├── public/        # Static assets
├── android/       # Capacitor Android project
├── capacitor.config.ts
├── package.json
└── vite.config.ts
```

## Build

```bash
# Web build
npm run build

# Android app
npx cap add android
npx cap sync
npx cap open android
```
