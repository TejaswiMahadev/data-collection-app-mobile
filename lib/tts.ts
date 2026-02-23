import { Audio } from 'expo-av';
import { getApiUrl } from '@/lib/query-client';

// Singleton to track the currently playing sound
let activeSound: Audio.Sound | null = null;

// Cache map for storing generated audio URIs to avoid redundant API hits
const audioCache = new Map<string, string>();

/**
 * Plays a voice instruction after clearing any currently playing audio.
 * Implements simple memoization to prevent excessive API calls.
 */
export async function playVoiceInstruction(text: string, language: string) {
    const cacheKey = `${language}:${text}`;

    try {
        // 1. Stop and cleanup any currently playing sound
        if (activeSound) {
            try {
                await activeSound.stopAsync();
                await activeSound.unloadAsync();
            } catch (cleanupErr) {
                console.warn('Error cleaning up previous sound:', cleanupErr);
            }
            activeSound = null;
        }

        // 2. Resolve target URL (check cache first)
        let soundUri = audioCache.get(cacheKey);

        if (!soundUri) {
            const baseUrl = getApiUrl();
            const url = new URL('/api/tts', baseUrl);
            url.searchParams.append('text', text);
            url.searchParams.append('language', language);
            soundUri = url.toString();

            // For simple GET-based streaming, we just cache the URL.
            // If the audio was truly dynamic/volatile, we wouldn't cache it.
            audioCache.set(cacheKey, soundUri);
        }

        // 3. Create and play the new sound
        const { sound } = await Audio.Sound.createAsync(
            { uri: soundUri },
            { shouldPlay: true }
        );

        activeSound = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync().catch(() => { });
                if (activeSound === sound) {
                    activeSound = null;
                }
            }
        });

        return sound;
    } catch (err) {
        console.error('Error playing TTS:', err);
        return null;
    }
}

/**
 * Explicitly stops any ongoing voice instruction.
 */
export async function stopVoiceInstruction() {
    if (activeSound) {
        try {
            await activeSound.stopAsync();
            await activeSound.unloadAsync();
        } catch (err) {
            console.error('Error stopping voice:', err);
        }
        activeSound = null;
    }
}
