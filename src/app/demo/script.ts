/**
 * Script and fake data for the judges' demo (/demo). Kept apart from the page so
 * scripts/generate-demo-voice.mjs can pre-record every spoken line.
 */

import { readingFeedbackBn } from "@/lib/assistant/bangla";
import { reminderSpeechBn, type DoseRecord, type Reminder } from "@/lib/care/reminders";
import type { GlucoseLog, MeasurementContext } from "@/lib/validations/telemetry";

// ---------- Demo persona and data ----------

export const PATIENT = "রহিমা";
export const PATIENT_EN = "Rahima Begum";
export const SON = "ছেলে করিম";
export const SON_PHONE = "01700000000";

export const METFORMIN: Reminder = { id: "demo-metformin", kind: "medicine", label: "মেটফরমিন", times: ["08:00", "14:00", "21:00"], enabled: true };

export const VOICE_TEXT = "আমার সুগার সাড়ে নয়, খাওয়ার পরে মেপেছি।";
export const FOOD_REPLY =
  "ভাত অর্ধেক প্লেট খান। মাছ আর সবজি বেশি নিন, ডাল খেতে পারেন। খাওয়ার পরে দশ মিনিট হাঁটুন।";

/** 14 days of believable readings and doses so the doctor report has something to show. */
export function demoHistory(now: Date) {
  const logs: GlucoseLog[] = [];
  const doses: DoseRecord[] = [];
  const slots: { h: number; ctx: MeasurementContext; base: number }[] = [
    { h: 7, ctx: "fasting", base: 6.6 },
    { h: 15, ctx: "post_meal", base: 9.2 },
  ];
  for (let d = 13; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    slots.forEach((s, i) => {
      const at = new Date(day);
      at.setHours(s.h, 10, 0, 0);
      if (at > now) return;
      // Deterministic wobble; one low on day 3 to match the story
      const wobble = ((d * 7 + i * 3) % 9) / 10 - 0.4;
      const mmol = d === 0 && i === 0 ? 3.4 : Number((s.base + wobble * 2 - (13 - d) * 0.05).toFixed(1));
      logs.push({ id: `demo-${d}-${i}`, glucose_value: Math.round(mmol * 18), context: s.ctx, measured_at: at.toISOString(), day_offset: 0 });
    });
    for (const time of METFORMIN.times) {
      const [h, m] = time.split(":").map(Number);
      const at = new Date(day);
      at.setHours(h, m, 0, 0);
      if (at > now) continue;
      // Missed a few evening doses
      if (time === "21:00" && d % 5 === 2) continue;
      const date = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
      doses.push({ reminderId: METFORMIN.id, date, time, status: "taken", at: at.toISOString() });
    }
  }
  return { logs, doses };
}

// ---------- Script ----------

export type ScreenId =
  | "home"
  | "home-recording"
  | "home-thinking"
  | "confirm-voice"
  | "home-reply-voice"
  | "meter-camera"
  | "meter-reading"
  | "confirm-meter"
  | "help-low"
  | "family-sms"
  | "food-camera"
  | "food-reading"
  | "food-verdict"
  | "reminder"
  | "reminder-done"
  | "report"
  | "report-share"
  | "outro";

export interface Beat {
  screen: ScreenId;
  /** What the judge should notice, in plain English */
  caption: string;
  /** Bangla the patient hears or says, with an English translation */
  speech?: { bn: string; en: string; who: "patient" | "app" };
  ms: number;
}

export interface Scene {
  title: string;
  kicker: string;
  how: string[];
  beats: Beat[];
}

export const SCENES: Scene[] = [
  {
    kicker: "Meet the user",
    title: "Built for a 68-year-old who has never used an app",
    how: [
      "Target user: elderly Bangla-speaking people with type 2 diabetes in Bangladesh.",
      "Many can't read small text, type, or use English menus — so Jotno is voice-first and picture-first.",
      "One big talk button, four big picture tiles. Everything is spoken aloud in Bangla.",
    ],
    beats: [
      {
        screen: "home",
        caption: `This is ${PATIENT_EN}, 68, in Dhaka. She has type 2 diabetes, weak eyesight, and doesn't read English.`,
        ms: 5000,
      },
      {
        screen: "home",
        caption: "Her whole app is one screen: a big black talk button and four picture tiles — meter photo, food scan, medicine, report.",
        speech: { bn: `শুভ সকাল, ${PATIENT}। কথা বলতে বড় কালো বোতামটি চেপে ধরে রাখুন।`, en: `Good morning, Rahima. Hold the big black button to talk.`, who: "app" },
        ms: 6500,
      },
    ],
  },
  {
    kicker: "Feature 1 · Voice",
    title: "Log blood sugar just by speaking",
    how: [
      "Push-to-talk records a short Bangla voice clip in the browser.",
      "Gemini turns free speech into structured data: value, unit (mmol/L), and when it was measured.",
      "Safety: nothing is saved until she hears it read back and taps ঠিক আছে (OK).",
      "Feedback is plain Bangla advice, spoken in a natural voice. It never mentions medicine doses.",
    ],
    beats: [
      {
        screen: "home-recording",
        caption: "She holds the big button and talks, the way she'd tell her grandchild.",
        speech: { bn: VOICE_TEXT, en: "My sugar is nine and a half, I measured after eating.", who: "patient" },
        ms: 5000,
      },
      {
        screen: "home-thinking",
        caption: "Gemini understands the Bangla and extracts: 9.5 mmol/L, after a meal.",
        ms: 3000,
      },
      {
        screen: "confirm-voice",
        caption: "Before saving, Jotno reads the number back and asks her to confirm. Speech recognition can be wrong — a wrong number can hurt.",
        speech: { bn: "৯.৫ মিলিমোল, খাওয়ার পরে। ঠিক আছে?", en: "9.5 millimoles, after a meal. Is that right?", who: "app" },
        ms: 6000,
      },
      {
        screen: "home-reply-voice",
        caption: "She taps OK. It's saved, and she hears simple advice: slightly high — drink water, walk a little.",
        speech: { bn: readingFeedbackBn(9.5), en: "Your sugar is 9.5, a little high. Drink water and walk a bit if you can.", who: "app" },
        ms: 7000,
      },
    ],
  },
  {
    kicker: "Feature 2 · Safety",
    title: "Photo of the meter → danger detected → family alerted",
    how: [
      "Gemini Vision reads the digits off any glucose meter photo — no tiny numbers to read or type.",
      "Readings below 3.9 or above 16.7 mmol/L switch the whole screen into a help screen.",
      "The help screen says exactly what to do now (juice or sugar water, re-check in 15 min).",
      "One tap calls or messages her family contact with a prefilled SMS/WhatsApp. 999 emergency is one tap away.",
    ],
    beats: [
      {
        screen: "meter-camera",
        caption: "Next morning she feels shaky. Instead of reading the tiny meter, she taps 'meter photo' and takes a picture.",
        ms: 4500,
      },
      { screen: "meter-reading", caption: "Gemini Vision reads the meter display: 3.4 mmol/L, fasting.", ms: 3000 },
      {
        screen: "confirm-meter",
        caption: "Same safety check: confirm the number first.",
        speech: { bn: "৩.৪ মিলিমোল, খালি পেটে। ঠিক আছে?", en: "3.4 millimoles, fasting. Is that right?", who: "app" },
        ms: 4500,
      },
      {
        screen: "help-low",
        caption: "3.4 is dangerously low (hypoglycaemia). The app becomes a help screen and tells her what to do, out loud.",
        speech: {
          bn: readingFeedbackBn(3.4),
          en: "Your sugar is 3.4, that's low. Drink half a glass of juice or a spoon of sugar in water now. Measure again in 15 minutes.",
          who: "app",
        },
        ms: 9000,
      },
      {
        screen: "family-sms",
        caption: "One tap sends her son a ready-made message — he knows within seconds, even from another city.",
        ms: 6000,
      },
    ],
  },
  {
    kicker: "Feature 3 · Food",
    title: "Point the camera at the plate, get a traffic-light answer",
    how: [
      "Live food scan with Gemini multimodal: recognises Bangladeshi dishes — rice, fish curry, dal, bhorta, biryani, sweets.",
      "Answer is a single colour: ভালো (good) · অল্প খান (eat less) · এড়িয়ে চলুন (avoid).",
      "Plus one practical sentence about portions, not calorie tables.",
      "Also in the app: restaurant menu checker, diabetic recipes, local bazaar shopping list with Taka prices.",
    ],
    beats: [
      { screen: "food-camera", caption: "At lunch she points the phone at her plate: rice, fish curry, dal and vegetables.", ms: 4500 },
      { screen: "food-reading", caption: "Gemini identifies each dish and judges it for a diabetic.", ms: 3000 },
      {
        screen: "food-verdict",
        caption: "Verdict: 'eat less' (yellow). Half a plate of rice, more fish and vegetables, walk after eating.",
        speech: { bn: FOOD_REPLY, en: "Eat half a plate of rice. Take more fish and vegetables; dal is fine. Walk ten minutes after eating.", who: "app" },
        ms: 8000,
      },
    ],
  },
  {
    kicker: "Feature 4 · Medicine",
    title: "Spoken medicine reminders",
    how: [
      "Family sets up medicines once with morning / noon / night presets — no clock pickers.",
      "At the time, the app speaks the reminder and shows two big answers: খেয়েছি (taken) or পরে (later).",
      "Works offline and as a phone notification (PWA).",
      "Every answer feeds the adherence score in the doctor report.",
    ],
    beats: [
      {
        screen: "reminder",
        caption: "At 2 PM the app speaks: time for Metformin. It never says a dose — she follows her doctor's prescription.",
        speech: { bn: reminderSpeechBn(METFORMIN), en: "Time to take Metformin. Take it the way your doctor said. Tap 'taken' when done.", who: "app" },
        ms: 7500,
      },
      { screen: "reminder-done", caption: "She taps 'taken'. One tap, logged.", ms: 3500 },
    ],
  },
  {
    kicker: "Feature 5 · Doctor & family",
    title: "A report the doctor can read in 30 seconds",
    how: [
      "Averages, fasting average, lows, highs, time-in-range (3.9–10.0 mmol/L) and medicine adherence.",
      "Bangla labels for the patient, English for the doctor. Prints to PDF.",
      "Shared as a link: the data lives in the link's #fragment, which browsers never send to a server — no account needed.",
    ],
    beats: [
      {
        screen: "report",
        caption: "At her clinic visit she shows two weeks of sugar and medicine history — collected without her ever typing.",
        ms: 8000,
      },
      { screen: "report-share", caption: "Her son gets the same report on WhatsApp, so the family stays in the loop.", ms: 5500 },
    ],
  },
  {
    kicker: "Summary",
    title: "Diabetes care that speaks her language",
    how: [
      "Voice + photo input in Bangla — no typing, no English.",
      "Safety first: confirm before saving, help screen on dangerous readings, never gives doses.",
      "Family and doctor stay informed with one tap.",
      "Next.js PWA · Gemini (speech, vision, Bangla TTS) · Supabase · works offline.",
    ],
    beats: [{ screen: "outro", caption: "That's Jotno (যত্ন — 'care'). Try the real app with your own voice and camera.", ms: 600000 }],
  },
];

/** Every line Jotno speaks during the demo, in play order (patient lines are shown, not spoken). */
export const DEMO_SPOKEN_LINES: string[] = Array.from(
  new Set(SCENES.flatMap((s) => s.beats.flatMap((b) => (b.speech?.who === "app" ? [b.speech.bn] : []))))
);
