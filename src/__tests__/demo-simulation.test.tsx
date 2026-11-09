import type React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock("@/lib/assistant/client", () => ({
  speak: vi.fn(async () => true),
  stopSpeaking: vi.fn(),
  prefetchSpeech: vi.fn(async () => true),
  registerSpeechClip: vi.fn(),
}));

import DemoPage from "@/app/demo/page";

describe("judges' demo simulation", () => {
  it("steps through every scene without crashing and ends on the summary", () => {
    render(<DemoPage />);
    fireEvent.click(screen.getByText("Start without sound"));
    fireEvent.click(screen.getByText("Pause"));
    const next = screen.getByLabelText("Next step");
    for (let i = 0; i < 40 && !(next as HTMLButtonElement).disabled; i++) fireEvent.click(next);
    expect(screen.getByText("Diabetes care that speaks her language")).toBeTruthy();
    expect(screen.getByText("Try the real app")).toBeTruthy();
  });

  it("can jump straight to the doctor report chapter", () => {
    render(<DemoPage />);
    fireEvent.click(screen.getByText(/Doctor & family/));
    expect(screen.getByText("A report the doctor can read in 30 seconds")).toBeTruthy();
    expect(screen.getAllByText(/Glucose report/).length).toBeGreaterThan(0);
  });
});

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
import AppShell from "@/components/app/AppShell";

describe("simulation button beside the real app", () => {
  it("swaps the real app for the simulation and back", () => {
    render(
      <AppShell>
        <p>real app home</p>
      </AppShell>
    );
    expect(screen.getByText("real app home")).toBeTruthy();
    fireEvent.click(screen.getByText("Watch the simulation"));
    expect(screen.queryByText("real app home")).toBeNull();
    expect(screen.getByText("Built for a 68-year-old who has never used an app")).toBeTruthy();
    fireEvent.click(screen.getByText("Back to the real app"));
    expect(screen.getByText("real app home")).toBeTruthy();
  });
});
