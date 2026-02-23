import { useState, useCallback, useEffect } from 'react';
import { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } from '@jamsch/expo-speech-recognition';

export function useVoiceInput() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useSpeechRecognitionEvent('start', () => setIsListening(true));
    useSpeechRecognitionEvent('end', () => setIsListening(false));
    useSpeechRecognitionEvent('result', (event) => {
        const fullTranscript = event.results.map(r => r.transcript).join(' ');
        setTranscript(fullTranscript);
    });
    useSpeechRecognitionEvent('error', (event) => {
        console.error('Speech recognition error:', event.error, event.message);
        setIsListening(false);
    });

    const startListening = useCallback(async (lang: string = 'en-US') => {
        try {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                console.error('Speech recognition permission not granted');
                return;
            }
            setTranscript('');
            setIsComplete(false);
            ExpoSpeechRecognitionModule.start({
                lang,
                interimResults: true,
                continuous: true,
                androidIntentOptions: {
                    EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
                    EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 5000,
                    EXTRA_LANGUAGE_MODEL: 'web_search',
                },
            });
        } catch (e) {
            console.error('Failed to start speech recognition:', e);
        }
    }, []);

    const stopListening = useCallback(() => {
        ExpoSpeechRecognitionModule.stop();
        setIsComplete(true);
    }, []);

    return {
        isListening,
        transcript,
        isComplete,
        startListening,
        stopListening,
        setTranscript,
    };
}
