import { useCallback } from "react";

type NavigationOptions = {
  to: string;
  search?: Record<string, string | number>;
};

export function useNavigate() {
  return useCallback(({ to, search }: NavigationOptions) => {
    const url = new URL(to, window.location.origin);

    if (search) {
      for (const [key, value] of Object.entries(search)) {
        url.searchParams.set(key, String(value));
      }
    }

    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
}
