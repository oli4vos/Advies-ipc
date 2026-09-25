import { useCallback, useEffect, useState } from "react";
import {
  ApiCase,
  confirmCaseStructure,
  getCase,
  hasLocalApi,
  listCaseDetails,
  listJobboardDetails,
  publishCase,
  setDemoRole,
} from "../lib/api";
import { apiCaseToItem } from "../lib/case-mapper";
import type { CaseItem, Role } from "../lib/case-model";

type WorkspaceOptions = {
  role: Role;
  fallbackCases: CaseItem[];
  onNotice: (message: string) => void;
};

type ApiSaver = (backendId: string) => Promise<ApiCase>;

/**
 * Central state boundary between screen components and the case API.
 *
 * The Pages demo can still use browser state, but the local FastAPI mode always
 * reloads authoritative records after a role switch or mutation. Keeping this
 * policy here prevents individual screens from inventing their own persistence
 * and makes a future auth/API migration a single-layer change.
 */
export function useCaseWorkspace({
  role,
  fallbackCases,
  onNotice,
}: WorkspaceOptions) {
  const serverAuthoritative = hasLocalApi();
  const [cases, setCases] = useState<CaseItem[]>(() =>
    serverAuthoritative ? [] : fallbackCases,
  );

  const reload = useCallback(
    async (activeRole: Role = role) => {
      if (!serverAuthoritative) return;
      setDemoRole(activeRole);
      try {
        const items =
          activeRole === "advisor"
            ? await listJobboardDetails()
            : await listCaseDetails();
        setCases(items.map(apiCaseToItem));
      } catch (error) {
        onNotice(
          error instanceof Error
            ? error.message
            : "Casussen konden niet worden geladen.",
        );
      }
    },
    [onNotice, role, serverAuthoritative],
  );

  useEffect(() => {
    if (serverAuthoritative) void reload(role);
  }, [reload, role, serverAuthoritative]);

  const replaceFromApi = useCallback(
    (publicCode: string, item: ApiCase) => {
      const mapped = apiCaseToItem(item);
      setCases((items) =>
        items.some((candidate) => candidate.id === publicCode)
          ? items.map((candidate) =>
              candidate.id === publicCode ? mapped : candidate,
            )
          : [mapped, ...items],
      );
      return mapped;
    },
    [],
  );

  const saveCase = useCallback(
    async (
      publicCode: string,
      saver: ApiSaver,
      successMessage: string,
    ) => {
      const current = cases.find((item) => item.id === publicCode);
      if (!current?.backendId) return false;
      try {
        replaceFromApi(publicCode, await saver(current.backendId));
        onNotice(successMessage);
        return true;
      } catch (error) {
        onNotice(
          error instanceof Error
            ? error.message
            : "De actie kon niet worden opgeslagen.",
        );
        return false;
      }
    },
    [cases, onNotice, replaceFromApi],
  );

  const refreshCase = useCallback(
    async (
      publicCode: string,
      action: (backendId: string) => Promise<unknown>,
    ) => {
      const current = cases.find((item) => item.id === publicCode);
      if (!current?.backendId) return false;
      try {
        await action(current.backendId);
        replaceFromApi(publicCode, await getCase(current.backendId));
        return true;
      } catch (error) {
        onNotice(
          error instanceof Error
            ? error.message
            : "De wijziging kon niet worden opgeslagen.",
        );
        return false;
      }
    },
    [cases, onNotice, replaceFromApi],
  );

  const persistStructure = useCallback(
    (publicCode: string, anonymizedText: string) =>
      saveCase(
        publicCode,
        (backendId) => confirmCaseStructure(backendId, true, anonymizedText),
        "Structuur bevestigd. Casus wacht op beheercontrole.",
      ),
    [saveCase],
  );

  const persistPublication = useCallback(
    (publicCode: string) =>
      saveCase(
        publicCode,
        (backendId) => publishCase(backendId),
        "Casus door beheerder gepubliceerd.",
      ),
    [saveCase],
  );

  return {
    cases,
    setCases,
    serverAuthoritative,
    reload,
    saveCase,
    refreshCase,
    persistStructure,
    persistPublication,
  };
}
