import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
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
