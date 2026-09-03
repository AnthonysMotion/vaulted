import { useSyncExternalStore } from "react";

/** True after hydration. Avoids `setMounted(true)` in an effect. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
