import { FieldRecord, ZoneData } from './types';
import { Language } from './i18n';

interface FieldMapping {
    keys: string[];
    field: keyof FieldRecord | string; // string for zone fields
    parser?: (val: string) => string;
}

const FIELD_MAPPINGS: Record<Language, FieldMapping[]> = {
    en: [
        { keys: ['field id', 'field identification', 'id'], field: 'fieldId' },
        { keys: ['district', 'in district'], field: 'district' },
        { keys: ['block'], field: 'block' },
        { keys: ['village'], field: 'village' },
        { keys: ['area', 'acres', 'field area'], field: 'fieldAreaAcres' },
        { keys: ['farmer name', 'name'], field: 'farmerName' },
        { keys: ['phone', 'mobile', 'number'], field: 'farmerPhone' },
        { keys: ['collector name'], field: 'collectorName' },
        { keys: ['collector phone'], field: 'collectorPhone' },
        { keys: ['variety', 'seed variety'], field: 'variety' },
        { keys: ['seed company'], field: 'seedCompany' },
        { keys: ['seed type'], field: 'seedType' },
        { keys: ['moisture'], field: 'moisturePercent', parser: (v) => v.replace('%', '') },
        { keys: ['harvest weight', 'total weight'], field: 'totalHarvestWeight' },
        { keys: ['plant height', 'height'], field: 'zone:plantHeight' },
        { keys: ['plant color', 'color'], field: 'zone:plantColor' },
    ],
    hi: [
        { keys: ['जिला', 'जिलें', 'डिसट्रिक्ट'], field: 'district' },
        { keys: ['ब्लॉक', 'प्रखंड'], field: 'block' },
        { keys: ['गांव', 'ग्राम', 'विलेज'], field: 'village' },
        { keys: ['क्षेत्रफल', 'एकड़', 'एरिया', 'क्षेत्र'], field: 'fieldAreaAcres' },
        { keys: ['किसान का नाम', 'नाम', 'किसान', 'नाम है'], field: 'farmerName' },
        { keys: ['फोन नंबर', 'मोबाइल', 'नंबर', 'फोन'], field: 'farmerPhone' },
        { keys: ['वैराइटी', 'किस्म', 'बीज'], field: 'variety' },
        { keys: ['कंपनी', 'सीड कंपनी'], field: 'seedCompany' },
        { keys: ['हाइट', 'ऊंचाई', 'लंबाई'], field: 'zone:plantHeight' },
        { keys: ['रंग', 'कलर'], field: 'zone:plantColor' },
    ],
    od: [
        { keys: ['ଜିଲ୍ଲା', 'ଜିଲ୍ଲାର'], field: 'district' },
        { keys: ['ବ୍ଲକ', 'ପ୍ରଖଣ୍ଡ'], field: 'block' },
        { keys: ['ଗାଁ', 'ଗ୍ରାମ', 'ଭିଲେଜ'], field: 'village' },
        { keys: ['ଏକର', 'ଏରିଆ', 'କ୍ଷେତ୍ରଫଳ'], field: 'fieldAreaAcres' },
        { keys: ['ଚାଷୀଙ୍କ ନାମ', 'ନାମ', 'ଚାଷୀ'], field: 'farmerName' },
        { keys: ['ଫୋନ', 'ମୋବାଇଲ', 'ନମ୍ବର'], field: 'farmerPhone' },
        { keys: ['କିସମ', 'ବ୍ରାଇଟି', 'ବିହନ'], field: 'variety' },
        { keys: ['ଉଚ୍ଚତା', 'ହାଇଟ'], field: 'zone:plantHeight' },
        { keys: ['ରଙ୍ଗ', 'କଲର'], field: 'zone:plantColor' },
    ],
};

export function parseSpeechToFields(transcript: string, lang: Language): Partial<FieldRecord> & { zoneUpdates?: Partial<ZoneData> } {
    const result: any = {};
    const zoneResult: any = {};
    const mappings = FIELD_MAPPINGS[lang] || FIELD_MAPPINGS.en;

    const lowerTranscript = transcript.toLowerCase();

    mappings.forEach(mapping => {
        for (const key of mapping.keys) {
            const regex = new RegExp(`${key}\\s*(?:is|है|ଅଛି|:)?\\s*([^,.\\n]+)`, 'i');
            const match = lowerTranscript.match(regex);

            if (match && match[1]) {
                let value = match[1].trim();
                if (mapping.parser) {
                    value = mapping.parser(value);
                }

                if (mapping.field.toString().startsWith('zone:')) {
                    const zoneKey = mapping.field.toString().split(':')[1];
                    zoneResult[zoneKey] = value;
                } else {
                    result[mapping.field as string] = value;
                }
            }
        }
    });

    return { ...result, zoneUpdates: Object.keys(zoneResult).length > 0 ? zoneResult : undefined };
}
