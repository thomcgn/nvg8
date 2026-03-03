// lib/context-store.ts

let currentEinrichtungId: number | null = null;

export function setCurrentEinrichtungId(id: number | null) {
    currentEinrichtungId = id;
}

export function getCurrentEinrichtungId(): number | null {
    return currentEinrichtungId;
}