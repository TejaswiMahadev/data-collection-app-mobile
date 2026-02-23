# VitaInspire - Smart Crop Data App

## Overview
VitaInspire is an offline-first, multilingual agricultural field data collection mobile app built with Expo React Native. Used by field officers in rural India (Jharkhand, Odisha, Chhattisgarh) to collect maize harvest and agronomic data using a structured, guided workflow.

## Current State
- Production-ready MVP with full data collection workflow
- All data stored locally via AsyncStorage (offline-first)
- Multilingual support: English, Hindi, Odia

## Architecture
- **Frontend**: Expo React Native with expo-router (file-based routing)
- **Backend**: Express.js server (port 5000) for future API sync
- **Storage**: AsyncStorage for local data persistence
- **State**: React Context (AppProvider) for language & selfie
- **Styling**: Nunito Google Font, green/yellow agricultural theme

## Key Files
- `lib/types.ts` - FieldRecord, ZoneData, PhotoData interfaces
- `lib/storage.ts` - AsyncStorage CRUD operations
- `lib/i18n.ts` - Translations (en, hi, od)
- `lib/AppContext.tsx` - App-wide state (language, selfie)
- `components/StepInput.tsx` - Reusable input & picker components
- `components/ProgressBar.tsx` - Progress indicator

## Screen Flow
1. `index.tsx` - Splash screen (3s auto-transition)
2. `selfie.tsx` - Farmer selfie capture (front camera)
3. `dashboard.tsx` - Main menu (New Entry, Records, Sync, Settings)
4. `field-entry.tsx` - 8-step field identification
5. `photo-walk.tsx` - Entry & center field photos with GPS
6. `zone-capture.tsx` - Zone A/B/C capture (crop photo, cob photo, data)
7. `agronomic.tsx` - 7 sections of crop/yield/fertilizer/irrigation/pest/soil/stress data
8. `final-photos.tsx` - Harvest, weighment, farmer photos
9. `farmer-info.tsx` - Farmer & collector details
10. `review.tsx` - Summary with save locally
11. `records.tsx` - View all saved records
12. `settings.tsx` - Language switch

## Recent Changes
- 2026-02-13: Initial build of complete app
