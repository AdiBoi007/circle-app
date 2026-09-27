import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { authClient, liveRequest } from "./client";
import type { LiveBootstrap } from "./types";
type LiveContextValue = {
  data: LiveBootstrap | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  get: <T>(path: string) => Promise<T>;
  mutate: <T = unknown>(
    path: string,
    body?: unknown,
    method?: "POST" | "PUT" | "DELETE",
  ) => Promise<T>;
  signOut: () => Promise<void>;
};
const Context = createContext<LiveContextValue | null>(null);
export function LiveProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const id = session?.user.id;
  return (
    <SessionProvider
      key={id || "signed-out"}
      id={id}
      sessionPending={isPending}
    >
      {children}
    </SessionProvider>
  );
}
function SessionProvider({
  id,
  sessionPending,
  children,
}: {
  id?: string;
  sessionPending: boolean;
  children: ReactNode;
}) {
  const active = useRef(true);
  const generation = useRef(0);
  const [snapshot, setSnapshot] = useState<LiveBootstrap | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback((): Promise<void> => {
    if (!id) return Promise.resolve();
    const request = ++generation.current;
    return liveRequest<LiveBootstrap>("/bootstrap")
      .then((value) => {
        if (request === generation.current && active.current) {
          setSnapshot(value);
          setError(null);
        }
      })
      .catch((e) => {
        if (request === generation.current && active.current) {
          // Clear stale health data on any denied/offline refresh. The next successful refresh restores it.
          setSnapshot(null);
          setError(
            e instanceof Error ? e.message : "Could not connect to Circle.",
          );
        }
      })
      .finally(() => {
        if (request === generation.current && active.current) setLoading(false);
      });
  }, [id]);
  useEffect(() => {
    active.current = true;
    void refresh();
    return () => {
      active.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!id) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 15000);
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [id, refresh]);
  const get = useCallback(<T,>(path: string) => liveRequest<T>(path), []);
  const mutate = useCallback(
    async <T = unknown,>(
      path: string,
      body: unknown = {},
      method: "POST" | "PUT" | "DELETE" = "POST",
    ) => {
      const result = await liveRequest<T>(path, body, method);
      // A committed action remains successful if the subsequent refresh loses connectivity.
      await refresh();
      return result;
    },
    [refresh],
  );
  const signOut = useCallback(async () => {
    const result = await authClient.signOut();
    if (result.error)
      throw new Error(result.error.message || "Could not sign out.");
    generation.current++;
    setSnapshot(null);
    setError(null);
  }, []);
  return (
    <Context.Provider
      value={{
        data: snapshot,
        loading: loading || sessionPending,
        error,
        refresh,
        get,
        mutate,
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLive() {
  const value = useContext(Context);
  if (!value) throw new Error("LiveProvider is required.");
  return value;
}
