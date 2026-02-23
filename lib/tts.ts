import { Audio } from 'expo-av';
import { getApiUrl } from '@/lib/query-client';

export async function playVoiceInstruction(text: string, language: string) {
    try {
        const baseUrl = getApiUrl();
        const url = new URL('/api/tts', baseUrl);
        url.searchParams.append('text', text);
        url.searchParams.append('language', language);

        const { sound } = await Audio.Sound.createAsync(
            { uri: url.toString() },
            { shouldPlay: true }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
        return sound;
    } catch (err) {
        console.error('Error playing TTS:', err);
        return null;
    }
}
