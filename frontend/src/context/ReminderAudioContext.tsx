import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReminderEvent } from '../types';

interface ReminderNotificationContextType {
  activeNotification: ReminderEvent | null;
  dismissNotification: () => void;
  triggerAudioAlert: (reminder: ReminderEvent) => void;
  playChime: () => void;
}

const ReminderAudioContext = createContext<ReminderNotificationContextType | undefined>(undefined);

export const ReminderAudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeNotification, setActiveNotification] = useState<ReminderEvent | null>(null);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const startTime = audioCtx.currentTime;

      // Unique 4-note soothing hospital chime melody: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz) -> E6 (1318Hz)
      const notes = [
        { freq: 659.25, time: 0.00, dur: 0.40, vol: 0.22 }, // E5
        { freq: 830.61, time: 0.12, dur: 0.45, vol: 0.25 }, // G#5
        { freq: 987.77, time: 0.24, dur: 0.50, vol: 0.28 }, // B5
        { freq: 1318.51, time: 0.38, dur: 0.85, vol: 0.30 }, // E6 - resonant bell decay
      ];

      notes.forEach(({ freq, time, dur, vol }) => {
        // Fundamental oscillator (gentle sine wave)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // Harmonic shimmer oscillator for warm clinical chime acoustic
        const harmonic = audioCtx.createOscillator();
        const harmonicGain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + time);

        harmonic.type = 'triangle';
        harmonic.frequency.setValueAtTime(freq * 2, startTime + time); // 1st harmonic octave

        // Smooth acoustic envelope: crisp chime attack + smooth bell decay
        gain.gain.setValueAtTime(0.001, startTime + time);
        gain.gain.exponentialRampToValueAtTime(vol, startTime + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + time + dur);

        harmonicGain.gain.setValueAtTime(0.001, startTime + time);
        harmonicGain.gain.exponentialRampToValueAtTime(vol * 0.25, startTime + time + 0.02);
        harmonicGain.gain.exponentialRampToValueAtTime(0.0001, startTime + time + dur * 0.6);

        osc.connect(gain);
        harmonic.connect(harmonicGain);
        gain.connect(audioCtx.destination);
        harmonicGain.connect(audioCtx.destination);

        osc.start(startTime + time);
        harmonic.start(startTime + time);
        osc.stop(startTime + time + dur);
        harmonic.stop(startTime + time + dur);
      });
    } catch (e) {
      // Audio autoplay policy fallback
      console.warn('Audio playback prevented by browser autoplay policy', e);
    }
  };

  const triggerAudioAlert = (reminder: ReminderEvent) => {
    playChime();
    setActiveNotification(reminder);
  };

  const dismissNotification = () => {
    setActiveNotification(null);
  };

  return (
    <ReminderAudioContext.Provider value={{ activeNotification, dismissNotification, triggerAudioAlert, playChime }}>
      {children}
    </ReminderAudioContext.Provider>
  );
};

export const useReminderAudio = () => {
  const context = useContext(ReminderAudioContext);
  if (!context) {
    throw new Error('useReminderAudio must be used within a ReminderAudioProvider');
  }
  return context;
};
