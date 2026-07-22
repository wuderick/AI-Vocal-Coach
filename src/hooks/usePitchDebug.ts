import { useEffect, useRef, useState } from 'react';
import { detectPitch } from '../services/audio/pitchDetectionService';
import { mapFrequencyToPitch } from '../services/audio/pitchMappingService';
import { useAppStateContext } from '../state/AppStateContext';

export interface PitchDebugData {
  frequency: number | null;
  note: string | null;
  midi: number | null;
  cents: number | null;
  confidence: number;
  isVoiced: boolean;
}

const EMPTY_PITCH_DEBUG_DATA: PitchDebugData = {
  frequency: null,
  note: null,
  midi: null,
  cents: null,
  confidence: 0,
  isVoiced: false,
};

const VOICED_HANGOVER_MS = 250;

export function usePitchDebug(): PitchDebugData {
  const { state } = useAppStateContext();
  const [pitchDebugData, setPitchDebugData] = useState<PitchDebugData>(EMPTY_PITCH_DEBUG_DATA);
  const lastVoicedTimestampRef = useRef(0);

  useEffect(() => {
    if (state.audioCaptureStatus !== 'active') {
      setPitchDebugData(EMPTY_PITCH_DEBUG_DATA);
      lastVoicedTimestampRef.current = 0;
      return undefined;
    }

    let frameId = 0;

    const updatePitchDebugData = () => {
      try {
        const timeDomainData = state.audioTimeDomainBufferRuntime?.timeDomainData;
        const sampleRate = state.audioCaptureRuntime.audioContext?.sampleRate;
        const now = performance.now();

        if (!timeDomainData || timeDomainData.length <= 0 || !sampleRate || sampleRate <= 0) {
          if (now - lastVoicedTimestampRef.current >= VOICED_HANGOVER_MS) {
            setPitchDebugData(EMPTY_PITCH_DEBUG_DATA);
          }
        } else {
          const pitchDetection = detectPitch({
            timeDomainData,
            sampleRate,
          });

          if (!pitchDetection.isVoiced || pitchDetection.frequency === null) {
            if (now - lastVoicedTimestampRef.current >= VOICED_HANGOVER_MS) {
              setPitchDebugData(EMPTY_PITCH_DEBUG_DATA);
            }
          } else {
            const pitchMapping = mapFrequencyToPitch(pitchDetection.frequency);
            lastVoicedTimestampRef.current = now;

            setPitchDebugData({
              frequency: pitchDetection.frequency,
              note: pitchMapping.note,
              midi: pitchMapping.midi,
              cents: pitchMapping.cents,
              confidence: pitchDetection.confidence,
              isVoiced: true,
            });
          }
        }
      } catch {
        if (performance.now() - lastVoicedTimestampRef.current >= VOICED_HANGOVER_MS) {
          setPitchDebugData(EMPTY_PITCH_DEBUG_DATA);
        }
      }

      frameId = requestAnimationFrame(updatePitchDebugData);
    };

    frameId = requestAnimationFrame(updatePitchDebugData);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [state]);

  return pitchDebugData;
}
