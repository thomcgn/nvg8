"use client";

import { Topbar, type TopbarProps } from "@/components/layout/Topbar";
import { useTicketsUIOptional } from "@/components/support/TicketsUIProvider";

type TopbarConnectedProps = Omit<
  TopbarProps,
  "onTickets" | "ticketsCount" | "notificationsCount"
>;

export function TopbarConnected(props: TopbarConnectedProps) {
  const ctx = useTicketsUIOptional();

  return (
    <Topbar
      {...props}
      onNotifications={props.onNotifications ?? ctx?.openMessenger}
      onTickets={ctx?.openTickets}
      notificationsCount={ctx?.notificationsCount ?? 0}
      ticketsCount={ctx?.ticketsCount ?? 0}
    />
  );
}