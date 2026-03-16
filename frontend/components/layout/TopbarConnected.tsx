"use client";

import { Topbar, type TopbarProps } from "@/components/layout/Topbar";
import { useTicketsUIOptional } from "@/components/support/TicketsUIProvider";

type TopbarConnectedProps = Omit<
  TopbarProps,
  "onTicketsAction" | "ticketsCount" | "notificationsCount"
>;

export function TopbarConnected(props: TopbarConnectedProps) {
  const ctx = useTicketsUIOptional();

  return (
    <Topbar
      {...props}
      onNotificationsAction={props.onNotificationsAction ?? ctx?.openMessenger}
      onTicketsAction={ctx?.openTickets}
      notificationsCount={ctx?.notificationsCount ?? 0}
      ticketsCount={ctx?.ticketsCount ?? 0}
    />
  );
}