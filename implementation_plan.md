# Refined Speech-to-Text Placement & Logic

Refine the voice entry feature to focus on zones and subsequent sections, ensuring that radio/picker options are automatically selected when matched in speech.

## User Review Required

> [!IMPORTANT]
> Voice entry will be REMOVED from the initial Field Registration screen and added to the Zone Capture screen. It will remain in the Agronomic and Farmer Info screens.

## Proposed Changes

### Core Logic & Services

#### [MODIFY] [nlp.ts](file:///c:/Users/d%20jashwanth%20sai/Downloads/Vita-Inspire/Vita-Inspire/lib/nlp.ts)
- Add keywords for zone-specific fields: `plantHeight`, `plantColor`, `standDensity`, `cobSizeObserved`, `plantsSampled`.
- Add mapping for ENUM values (e.g., "high density" -> `high`, "green color" -> `green`, "hybrid seed" -> `hybrid`).
- Support multilingual keywords for these new fields and options.

### UI Integration

#### [DELETE] Voice Entry from [field-entry.tsx](file:///c:/Users/d%20jashwanth%20sai/Downloads/Vita-Inspire/Vita-Inspire/app/field-entry.tsx)
- Remove the microphone FAB, `VoiceEntryOverlay` import, and related state/styles.

#### [NEW] Voice Entry in [zone-capture.tsx](file:///c:/Users/d%20jashwanth%20sai/Downloads/Vita-Inspire/Vita-Inspire/app/zone-capture.tsx)
- Add floating microphone FAB.
- Integrate `VoiceEntryOverlay`.
- Pass an `onApply` callback that calls `updateZone` for each detected field.

#### [MODIFY] [agronomic.tsx](file:///c:/Users/d%20jashwanth%20sai/Downloads/Vita-Inspire/Vita-Inspire/app/agronomic.tsx) & [farmer-info.tsx](file:///c:/Users/d%20jashwanth%20sai/Downloads/Vita-Inspire/Vita-Inspire/app/farmer-info.tsx)
- Ensure that when a field value matches an option key (e.g., `seedType: 'hybrid'`), the application state is updated, which will automatically reflect in the `StepPicker` component.

## Verification Plan

### Manual Verification
1. **Field Entry**: Verify NO microphone icon is visible.
2. **Zones**:
   - Go to "Zone A".
   - Say "Height 150, color green, high density".
   - Verify fields auto-fill and "High" is selected in the picker.
3. **Agronomic**:
   - Say "Seed type hybrid, irrigation type irrigated".
   - Verify both pickers show the correct selected value.
4. **Farmer Info**:
   - Say "Ownership owner".
   - Verify "Owner" is selected.
