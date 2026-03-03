// hooks/useEinrichtung.ts

import { setCurrentEinrichtungId } from "@/lib/context-store";
import { apiSwitchContext } from "@/lib/context";

export function useEinrichtung() {
    async function switchEinrichtung(id: number) {
        await apiSwitchContext(id);
        setCurrentEinrichtungId(id);
    }

    return { switchEinrichtung };
}