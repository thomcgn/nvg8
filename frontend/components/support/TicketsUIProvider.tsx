"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { TicketsModal } from "@/components/support/TicketsModal";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

type TicketsUIContextValue = {
  openTickets: () => void;
  closeTickets: () => void;
  refreshCounts: () => void;
  notificationsCount: number;
  ticketsCount: number;
};

const TicketsUIContext = createContext<TicketsUIContextValue | null>(null);

export function TicketsUIProvider({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();

  const [ticketsModalOpen, setTicketsModalOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);

  const refreshingRef = useRef(false);

  const canFetch = !loading && !!me && !!me.contextActive;

  const refreshCounts = () => {
    if (!canFetch) return;
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    apiFetch<{ count: number }>("/messages/unread-count")
        .then((r) => setNotificationsCount(r.count ?? 0))
        .catch((e) => {
          // während Übergängen: ignorieren
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return;
        })
        .finally(() => {
          refreshingRef.current = false;
        });

    // solange du keinen Ticket-Count Endpoint hast
    setTicketsCount(0);

    // später:
    // apiFetch<{ count: number }>("/support/tickets/my/count?status=OPEN")
    //   .then((r) => setTicketsCount(r.count ?? 0))
    //   .catch((e) => { if (e instanceof ApiError && (e.status===401 || e.status===403)) return; });
  };

  // ✅ initial einmal laden, sobald Auth+Context bereit sind
  useEffect(() => {
    if (!canFetch) return;
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch]);

  const value = useMemo<TicketsUIContextValue>(() => {
    return {
      openTickets: () => setTicketsModalOpen(true),
      closeTickets: () => {
        setTicketsModalOpen(false);
        refreshCounts();
      },
      refreshCounts,
      notificationsCount,
      ticketsCount,
    };
  }, [notificationsCount, ticketsCount]); // refreshCounts ist stabil genug hier

  return (
      <TicketsUIContext.Provider value={value}>
        {children}
        <TicketsModal open={ticketsModalOpen} onClose={value.closeTickets} />
      </TicketsUIContext.Provider>
  );
}

export function useTicketsUIOptional() {
  return useContext(TicketsUIContext);
}