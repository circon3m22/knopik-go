"use client";
import { memo, type ReactNode } from "react";

/** The opaque runner covers these siblings. Retain their mounted state/refs,
 * skip reconciliation while covered, and apply the latest snapshot on return.
 */
export const RunnerBackdrop = memo(function RunnerBackdrop({ children }: { children: ReactNode; frozen: boolean }) {
  return children;
}, (previous, next) => previous.frozen && next.frozen);
