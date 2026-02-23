import { StateCreator } from 'zustand';

export interface PrivacySlice {
    tongoPrivKey: string | null;
    isUnlocked: boolean;
    setTongoPrivKey: (key: string | null) => void;
    clearPrivacyStore: () => void;
}

export const createPrivacySlice: StateCreator<PrivacySlice> = (set) => ({
    tongoPrivKey: null,
    isUnlocked: false,
    setTongoPrivKey: (key: string | null) => set({
        tongoPrivKey: key,
        isUnlocked: !!key
    }),
    clearPrivacyStore: () => set({
        tongoPrivKey: null,
        isUnlocked: false
    }),
});
