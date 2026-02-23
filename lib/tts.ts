import { Audio } from 'expo-av';
import { getApiUrl } from '@/lib/query-client';

// Singleton to track the currently playing sound
let activeSound: Audio.Sound | null = null;
// Track the latest requested ID to handle race conditions during async fetching
let lastRequestId = 0;

// Cache map for storing generated audio URIs to avoid redundant API hits
const audioCache = new Map<string, string>();

/**
 * Plays a voice instruction after clearing any currently playing audio.
 * Implements strict sequencing and memoization to prevent overlap and excessive calls.
 */
export async function playVoiceInstruction(text: string, language: string) {
    const requestId = ++lastRequestId;
    const cacheKey = `${language}:${text}`;

    try {
        // 1. Immediately stop any currently playing sound
        if (activeSound) {
            try {
                // Ensure we don't block the new request too long
                const soundToCleanup = activeSound;
                activeSound = null;
                await soundToCleanup.stopAsync();
                await soundToCleanup.unloadAsync();
            } catch (cleanupErr) {
                console.warn('Error cleaning up previous sound:', cleanupErr);
            }
        }

        // 2. Resolve target URL (check cache first)
        let soundUri = audioCache.get(cacheKey);

        if (!soundUri) {
            const baseUrl = getApiUrl();
            const url = new URL('/api/tts', baseUrl);
            url.searchParams.append('text', text);
            url.searchParams.append('language', language);
            soundUri = url.toString();
            audioCache.set(cacheKey, soundUri);
        }

        // Check if we've been superseded while generating params
        if (requestId !== lastRequestId) return null;

        // 3. Create the new sound
        // We use { shouldPlay: false } initially to have more control
        const { sound } = await Audio.Sound.createAsync(
            { uri: soundUri },
            { shouldPlay: false }
        );

        // Check again if we were superseded during the slow 'createAsync'
        if (requestId !== lastRequestId) {
            await sound.unloadAsync().catch(() => { });
            return null;
        }

        // 4. Start playback
        activeSound = sound;
        await sound.playAsync();

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
    lastRequestId++; // Invalidate any loading requests
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
