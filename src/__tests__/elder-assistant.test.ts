import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  toBanglaDigits,
  fromBanglaDigits,
  classifyGlucose,
  readingFeedbackBn,
} from "@/lib/assistant/bangla";
import {
  BANGLA_CLINICAL_REFUSAL,
  isUnsafeRequest,
  isBanglaDosingQuery,
  containsBanglaDosage,
  scrubReply,
} from "@/lib/assistant/safety";
import { finalizeResult, fallbackResult } from "@/lib/ai/elder-assistant";
import { encodeWav, readPcm16, shrinkSpeechWav } from "@/lib/assistant/wav";
import ConfirmReadingSheet from "@/components/elder/ConfirmReadingSheet";

describe("Elder assistant: Bangla helpers", () => {
  it("converts digits both ways", () => {
    expect(toBanglaDigits(160)).toBe("১৬০");
    expect(fromBanglaDigits("সুগার ১৬০")).toBe("সুগার 160");
  });

  it("classifies glucose into the help-screen bands", () => {
    expect(classifyGlucose(65)).toBe("low");
    expect(classifyGlucose(70)).toBe("good");
    expect(classifyGlucose(140)).toBe("good");
    expect(classifyGlucose(160)).toBe("slightly_high");
    expect(classifyGlucose(250)).toBe("high");
    expect(classifyGlucose(300)).toBe("very_high");
  });

  it("spoken feedback never contains a dosage", () => {
    for (const v of [50, 100, 160, 250, 400]) {
      const text = readingFeedbackBn(v);
      expect(text).toContain(toBanglaDigits(v));
      expect(containsBanglaDosage(text)).toBe(false);
    }
  });
});

describe("Elder assistant: Bangla safety guardrail", () => {
  it.each([
    "ভাত খাওয়ার আগে কত ইউনিট ইনসুলিন নেব?",
    "আমি কি মেটফরমিন বন্ধ করে দেব?",
    "সুগার বেশি, ওষুধ কি দ্বিগুণ খাব?",
    "How many units of insulin should I take?",
  ])("blocks dosing request: %s", (text) => {
    expect(isUnsafeRequest(text)).toBe(true);
  });

  it.each(["আমি কি আম খেতে পারি?", "করলা কি ভালো?", "আমার সুগার ১৬০"])("allows everyday question: %s", (text) => {
    expect(isUnsafeRequest(text)).toBe(false);
    expect(isBanglaDosingQuery(text)).toBe(false);
  });

  it("scrubs replies that recommend a dose", () => {
    expect(scrubReply("খাওয়ার আগে ৪ ইউনিট ইনসুলিন নিন।")).toBe(BANGLA_CLINICAL_REFUSAL);
    expect(scrubReply("Take 4 units before lunch.")).toBe(BANGLA_CLINICAL_REFUSAL);
    expect(scrubReply("আপনার সুগার ১৬০, একটু বেশি।")).toBe("আপনার সুগার ১৬০, একটু বেশি।");
  });
});

describe("Elder assistant: result handling", () => {
  it("replaces the reply when the transcript asks for a dose", () => {
    const out = finalizeResult({
      transcript: "কত ইউনিট ইনসুলিন নেব",
      reply: "৪ ইউনিট নিন",
      action: "none",
    });
    expect(out.reply).toBe(BANGLA_CLINICAL_REFUSAL);
  });

  it("keeps an emergency action even when the request is unsafe", () => {
    const out = finalizeResult({
      transcript: "মাথা ঘুরছে, ইনসুলিন কত নেব?",
      reply: "এখনই কাউকে ডাকুন",
      action: "call_for_help",
    });
    expect(out.action).toBe("call_for_help");
    expect(out.reply).toBe(BANGLA_CLINICAL_REFUSAL);
  });

  it("drops a log action that has no value and defaults missing context", () => {
    expect(finalizeResult({ transcript: "", reply: "ঠিক আছে", action: "log_glucose" }).action).toBe("none");
    const out = finalizeResult({ transcript: "", reply: "১৬০", action: "log_glucose", glucose_value: 160 });
    expect(out.glucose_context).toBe("random");
  });

  it("fallback understands typed Bangla numbers", () => {
    const out = fallbackResult({ mode: "talk", text: "১৬০" });
    expect(out.action).toBe("log_glucose");
    expect(out.glucose_value).toBe(160);
  });
});

describe("Elder assistant: speech payload", () => {
  it("halves 24 kHz speech to 12 kHz", () => {
    const samples = new Int16Array(24000).map((_, i) => Math.round(Math.sin(i / 10) * 8000));
    const wav = encodeWav({ samples, sampleRate: 24000 });
    const small = shrinkSpeechWav(wav, "audio/wav");
    const pcm = readPcm16(small);
    expect(pcm.sampleRate).toBe(12000);
    expect(pcm.samples.length).toBe(12000);
    expect(small.length).toBeLessThan(wav.length / 1.9);
  });

  it("accepts raw PCM with the rate in the mime type", () => {
    const raw = Buffer.alloc(48000); // 1s of 24 kHz 16-bit silence
    const pcm = readPcm16(shrinkSpeechWav(raw, "audio/L16;codec=pcm;rate=24000"));
    expect(pcm.sampleRate).toBe(12000);
  });
});

describe("Elder assistant: confirm-before-save sheet", () => {
  it("shows the reading in Bangla digits and only confirms on tap", () => {
    const onConfirm = vi.fn();
    const onReject = vi.fn();
    const onContextChange = vi.fn();
    render(
      React.createElement(ConfirmReadingSheet, {
        value: 160,
        context: "post_meal",
        onContextChange,
        onConfirm,
        onReject,
      })
    );
    expect(screen.getByText("১৬০")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "খাওয়ার পরে" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "খালি পেটে" }));
    expect(onContextChange).toHaveBeenCalledWith("fasting");
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /ঠিক আছে/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
