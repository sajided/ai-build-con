"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Video,
  VideoOff,
  ImagePlus,
  Mic,
  MicOff,
  X,
  RotateCcw,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Copy,
  Check,
  AlertTriangle,
  ShoppingBasket,
  Utensils,
  Salad,
  ChevronDown,
  ChevronLeft,
  Layers,
  Loader2,
  ScanLine,
  CircleCheck,
  CircleAlert,
  type LucideIcon,
} from "lucide-react";
import { toBanglaDigits } from "@/lib/assistant/bangla";
import type { MultimodalOutput } from "@/app/api/scanner/multimodal/route";
import { speak, stopSpeaking } from "@/lib/assistant/client";

const SAMPLE_PRESETS = [
  {
    key: "bazaar",
    emoji: "🥕",
    title: "বাজারের ঝুড়ি (নমুনা)",
    subtitle: "করলা, মসুর ডাল, পালং শাক, আলু, কাঁচা মরিচ",
    payload: "mock-preset",
    query: "Are these items diabetic-safe and what can I cook?",
  },
  {
    key: "cooked",
    emoji: "🍽️",
    title: "রান্না করা খাবার (নমুনা)",
    subtitle: "ভাত, মাছ, শাক",
    payload: "mock-cooked-meal",
    query: "How should I sequence eating this meal to avoid a spike?",
  },
  {
    key: "menu",
    emoji: "📋",
    title: "রেস্তোরাঁর মেনু (নমুনা)",
    subtitle: "তন্দুরি চিকেন, ডাল, নান, পনির",
    payload: "mock-restaurant-menu",
    query: "What on this menu won't spike my blood sugar?",
  },
];

type Risk = "green" | "yellow" | "red";

// Same words and colours as the home screen verdicts
const VERDICT: Record<Risk, { label: string; className: string; icon: LucideIcon }> = {
  green: { label: "ভালো", className: "bg-risk-safe text-risk-safeInk", icon: CircleCheck },
  yellow: { label: "অল্প খান", className: "bg-risk-caution text-risk-cautionInk", icon: CircleAlert },
  red: { label: "এড়িয়ে চলুন", className: "bg-risk-danger text-risk-dangerInk", icon: AlertTriangle },
};

const TYPE_META: Record<string, { label: string; badge: string; icon: LucideIcon }> = {
  grocery_bazaar: { label: "বাজার", badge: "bg-pastel-lime text-pastel-lime-ink", icon: ShoppingBasket },
  prepared_food: { label: "রান্না করা খাবার", badge: "bg-pastel-peach text-pastel-peach-ink", icon: Salad },
  restaurant_menu: { label: "রেস্তোরাঁর মেনু", badge: "bg-pastel-blue text-pastel-blue-ink", icon: Utensils },
};

/** Final risk for display: the server already guarded it; GI thresholds are a last safety net. */
function itemRisk(item: { risk_level?: Risk; gi_index: number }): Risk {
  if (item.risk_level === "red" || item.gi_index >= 70) return "red";
  if (item.risk_level === "yellow" || item.gi_index >= 55) return "yellow";
  return "green";
}

export default function GeminiLiveScanner() {
  const router = useRouter();

  // Camera state
  const [cameraActive, setCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Audio / Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Analysis & Results
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MultimodalOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLiveResult, setIsLiveResult] = useState<boolean | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [textPrompt, setTextPrompt] = useState("");
  const [sheetCollapsed, setSheetCollapsed] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  // Blocks overlapping scans (one tap must never send two requests)
  const inFlightRef = useRef(false);
  // Main capsule: short tap = photo scan, press-and-hold = voice question
  const pressRef = useRef<{ down: boolean; holdTimer: ReturnType<typeof setTimeout> | null; voice: boolean }>({
    down: false,
    holdTimer: null,
    voice: false,
  });
  // Set when the press ends (submit) or is aborted (cancel) before the mic finished opening
  const voiceStopRequestedRef = useRef(false);
  const voiceCancelRequestedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start or restart camera stream
  const [isFlashing, setIsFlashing] = useState(false);

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        setCameraActive(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [facingMode, startCamera, stopCamera]);

  // Release the microphone if the screen is left mid-recording
  useEffect(() => {
    return () => {
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleFlipCamera = () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const toggleCameraPower = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera(facingMode);
    }
  };

  // Speech helpers using authentic neural Bangla lady voice
  const speakResponse = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    await speak(text);
    setIsSpeaking(false);
  };

  const releaseMic = () => {
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    mediaRecorderRef.current = null;
  };

  // Push-to-Talk voice capture handlers
  const handleVoiceStart = async () => {
    stopSpeaking();
    voiceStopRequestedRef.current = false;
    voiceCancelRequestedRef.current = false;
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = audioStream;

      if (voiceCancelRequestedRef.current) {
        releaseMic();
        return;
      }

      // Press already ended while the mic permission/open was pending: scan without audio.
      if (voiceStopRequestedRef.current) {
        releaseMic();
        submitScan(null);
        return;
      }

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      releaseMic();
      // Mic unavailable/denied: still scan the photo the user is pointing at.
      if (voiceStopRequestedRef.current) submitScan(null);
      else if (!voiceCancelRequestedRef.current) voiceStopRequestedRef.current = true;
    }
  };

  const handleVoiceStopAndSubmit = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      if (voiceStopRequestedRef.current) {
        // Mic already failed during the hold: scan the photo without audio.
        voiceStopRequestedRef.current = false;
        submitScan(null);
        return;
      }
      // Mic not open yet; handleVoiceStart will submit once it resolves.
      voiceStopRequestedRef.current = true;
      return;
    }

    recorder.onstop = async () => {
      setIsRecording(false);
      releaseMic();
      const audioBlob =
        audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type: "audio/webm" })
          : null;
      await submitScan(audioBlob);
    };

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  // Single input path for the main capsule (pointer events cover touch, pen and mouse,
  // so one tap can no longer fire touch + mouse + click handlers and submit 2-3 scans).
  const HOLD_TO_TALK_MS = 400;

  const handleCapsulePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isProcessing || inFlightRef.current || pressRef.current.down) return;
    pressRef.current.down = true;
    pressRef.current.voice = false;
    // With the mic muted, a long press is just a photo scan.
    if (isMuted) return;
    pressRef.current.holdTimer = setTimeout(() => {
      pressRef.current.voice = true;
      handleVoiceStart();
    }, HOLD_TO_TALK_MS);
  };

  const handleCapsulePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const press = pressRef.current;
    if (!press.down) return;
    press.down = false;
    if (press.holdTimer) clearTimeout(press.holdTimer);
    press.holdTimer = null;
    if (press.voice) {
      handleVoiceStopAndSubmit();
    } else {
      submitScan(null);
    }
  };

  const handleCapsulePointerCancel = () => {
    const press = pressRef.current;
    if (!press.down) return;
    press.down = false;
    if (press.holdTimer) clearTimeout(press.holdTimer);
    press.holdTimer = null;
    if (press.voice) {
      // Gesture aborted (e.g. finger slid off): discard the recording, don't scan.
      voiceStopRequestedRef.current = false;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = () => {
          setIsRecording(false);
          releaseMic();
        };
        recorder.stop();
      } else {
        // Mic still opening (or failed): make handleVoiceStart release it without scanning.
        voiceCancelRequestedRef.current = true;
        releaseMic();
      }
    }
  };

  const showScanError = (message: string) => {
    setErrorMessage(message);
    // Elders may not read the banner, so errors are spoken like results are.
    speak(message).catch(() => {});
  };

  const compressImageForFastScan = async (
    fileOrBlob: Blob,
    maxDim = 800,
    quality = 0.72
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(fileOrBlob);
        img.onload = () => {
          URL.revokeObjectURL(url);
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(fileOrBlob);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((b) => resolve(b || fileOrBlob), "image/jpeg", quality);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(fileOrBlob);
        };
        img.src = url;
      } catch {
        resolve(fileOrBlob);
      }
    });
  };

  const captureFrameSnapshot = async (): Promise<Blob | null> => {
    if (videoRef.current && cameraActive) {
      try {
        const video = videoRef.current;
        const maxDim = 800;
        let w = video.videoWidth || 640;
        let h = video.videoHeight || 480;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          return await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.75)
          );
        }
      } catch {
        return null;
      }
    }
    return null;
  };

  const submitScan = async (
    audioBlob: Blob | null,
    presetOverride?: { payload: string; query: string },
    fileOverride?: File | Blob
  ) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setErrorMessage(null);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
    setIsProcessing(true);
    setSheetCollapsed(false);
    try {
      const formData = new FormData();
      formData.append("scan_mode", "auto");

      const queryToSend = presetOverride ? presetOverride.query : textPrompt;
      if (queryToSend) {
        formData.append("query", queryToSend);
      }

      if (presetOverride) {
        formData.append("preset", presetOverride.payload);
      } else if (fileOverride) {
        const compressed = await compressImageForFastScan(fileOverride, 800, 0.75);
        formData.append("image", compressed, "upload.jpg");
      } else {
        const frame = await captureFrameSnapshot();
        if (frame) {
          formData.append("image", frame, "frame.jpg");
        } else if (capturedImage) {
          // capturedImage is a data URL; send it as a real file, not a string field
          const blob = await (await fetch(capturedImage)).blob();
          formData.append("image", blob, "upload.jpg");
        } else if (!audioBlob && !queryToSend) {
          // No camera frame (demo laptop / permission denied): show the sample basket
          formData.append("preset", "mock-preset");
        }
      }

      if (audioBlob) {
        formData.append("audio", audioBlob, "voice.webm");
      }

      const res = await fetch("/api/scanner/multimodal", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errMessage = "স্ক্যান করা যায়নি। একটু পরে আবার চেষ্টা করুন।";
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch {
          if (res.status === 504) errMessage = "অনেক সময় লাগছে। আবার চেষ্টা করুন।";
        }
        // Clear any previous result so an old answer is never mistaken for this scan.
        setResult(null);
        setIsLiveResult(null);
        showScanError(errMessage);
        return;
      }

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
        setIsLiveResult(json.isLive ?? null);
        if (json.data.voice_assistant_response) {
          speakResponse(json.data.voice_assistant_response);
        }
        if (json.droppedAudio) {
          setErrorMessage("আপনার কথা শোনা যায়নি, শুধু ছবি দেখে উত্তর দেওয়া হয়েছে।");
        }
      } else {
        setResult(null);
        showScanError(json.error || "স্ক্যান করা যায়নি। আবার চেষ্টা করুন।");
      }
    } catch (err: unknown) {
      console.error("Jotno Live scan error:", err);
      setResult(null);
      showScanError("ইন্টারনেট সংযোগ নেই। সংযোগ দেখে আবার চেষ্টা করুন।");
    } finally {
      inFlightRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageForFastScan(file, 800, 0.75);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      submitScan(null, undefined, compressed);
    };
    reader.readAsDataURL(compressed);
  };

  const handleCopyScript = (scriptText: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(scriptText);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const closeLiveSession = () => {
    stopCamera();
    stopSpeaking();
    router.push("/dashboard");
  };

  const riskCounts = result
    ? (result.identified_items || []).reduce(
        (acc, item) => {
          acc[itemRisk(item)] += 1;
          return acc;
        },
        { green: 0, yellow: 0, red: 0 } as Record<Risk, number>
      )
    : null;

  return (
    <div lang="bn" className="relative h-[100dvh] w-full bg-black overflow-hidden select-none flex flex-col justify-between">
      {/* 1. CAMERA VIEWFINDER (stays dark: it is the camera feed) */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : capturedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capturedImage} alt="আপনার ছবি" className="w-full h-full object-cover" />
        ) : (
          <div className="card mx-6 flex max-w-sm flex-col items-center gap-3 p-6 text-center">
            <span className="icon-badge h-14 w-14 bg-pastel-blue text-pastel-blue-ink">
              <VideoOff className="h-7 w-7" />
            </span>
            <p className="text-xl font-bold text-ink">ক্যামেরা বন্ধ আছে</p>
            <p className="text-base text-ink-soft">নিচের ক্যামেরা বোতাম চাপুন, অথবা গ্যালারি থেকে ছবি দিন।</p>
          </div>
        )}

        {/* Framing guide */}
        {cameraActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-64 w-64 rounded-[32px] border-2 border-white/30">
              <div className="absolute left-2 top-2 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-white" />
              <div className="absolute right-2 top-2 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-white" />
              <div className="absolute bottom-2 left-2 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-white" />
              <div className="absolute bottom-2 right-2 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-white" />
            </div>
          </div>
        )}

        {isFlashing && <div className="pointer-events-none absolute inset-0 z-30 bg-white/70 transition-opacity duration-200" />}

        {isProcessing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="card flex flex-col items-center gap-3 px-8 py-6" aria-live="polite">
              <Loader2 className="h-12 w-12 animate-spin text-ink" />
              <p className="text-xl font-bold text-ink">একটু অপেক্ষা করুন…</p>
              <p className="text-base text-ink-soft">খাবার দেখে বুঝে নিচ্ছি</p>
            </div>
          </div>
        )}

        {isRecording && (
          <div className="absolute inset-x-4 top-24 z-30 mx-auto flex max-w-xs items-center justify-center gap-2 rounded-full bg-pastel-coral-strong px-5 py-3 text-lg font-bold text-white shadow-float">
            <span className="h-3 w-3 animate-ping rounded-full bg-white" />
            শুনছি… ছেড়ে দিলে পাঠাবো
          </div>
        )}
      </div>

      {/* 2. TOP BAR */}
      <header className="relative z-20 flex items-center justify-between gap-2 px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button
          type="button"
          onClick={closeLiveSession}
          aria-label="ফিরে যান"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft active:bg-canvas"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-full bg-white px-4 py-2 text-lg font-bold text-ink shadow-soft">লাইভ স্ক্যান</span>
          {isLiveResult === false && (
            <span className="rounded-full bg-risk-caution px-3 py-1.5 text-sm font-bold text-risk-cautionInk shadow-soft">
              ডেমো
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFlipCamera}
            aria-label="ক্যামেরা ঘোরান"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft active:bg-canvas"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowPresets((prev) => !prev)}
            aria-label="আরও"
            aria-expanded={showPresets}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft active:bg-canvas"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Error banner */}
      {errorMessage && (
        <div
          role="alert"
          className="relative z-30 mx-4 mt-3 flex items-start justify-between gap-3 rounded-3xl bg-risk-danger p-4 text-risk-dangerInk shadow-float"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-base font-semibold leading-relaxed">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60"
            aria-label="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* 3. MORE: typed question, samples, restaurant menu page */}
      {showPresets && (
        <div className="card relative z-30 mx-4 mt-3 space-y-4 p-4 shadow-float">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-ink">প্রশ্ন ও নমুনা</p>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              aria-label="বন্ধ করুন"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="প্রশ্ন লিখুন…"
              aria-label="প্রশ্ন লিখুন"
              className="input h-12 flex-1 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowPresets(false);
                  submitScan(null);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                setShowPresets(false);
                submitScan(null);
              }}
              className="flex h-12 shrink-0 items-center rounded-full bg-ink px-5 text-base font-bold text-white active:bg-black"
            >
              পাঠান
            </button>
          </div>

          <div className="space-y-2">
            <p className="section-title">নমুনা দেখুন</p>
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setShowPresets(false);
                  submitScan(null, { payload: p.payload, query: p.query });
                }}
                className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl bg-canvas px-4 py-2 text-left active:bg-line"
              >
                <span className="text-2xl" aria-hidden>{p.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-ink">{p.title}</span>
                  <span className="block truncate text-sm text-ink-muted">{p.subtitle}</span>
                </span>
              </button>
            ))}
          </div>

          <Link href="/menusafe" className="btn-secondary h-14 text-lg">
            <Utensils className="h-5 w-5" />
            রেস্তোরাঁর মেনু আলাদা করে দেখুন
          </Link>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* 4. RESULT SHEET (same cards and verdict pills as the home screen) */}
      {result && (
        <div className="relative z-20 mx-4 mb-3 mt-3 max-h-[58vh] space-y-4 overflow-y-auto rounded-[32px] bg-canvas p-4 shadow-float no-scrollbar">
          <div className="flex items-center gap-3">
            <span className={`icon-badge h-12 w-12 ${TYPE_META[result.detected_type]?.badge ?? TYPE_META.grocery_bazaar.badge}`}>
              {(() => {
                const Icon = TYPE_META[result.detected_type]?.icon ?? ShoppingBasket;
                return <Icon className="h-6 w-6" />;
              })()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-ink-muted">
                {TYPE_META[result.detected_type]?.label ?? TYPE_META.grocery_bazaar.label}
              </p>
              <p className="truncate text-xl font-bold text-ink">{result.detected_title}</p>
            </div>
            <button
              type="button"
              onClick={() => setSheetCollapsed((c) => !c)}
              aria-label={sheetCollapsed ? "বড় করুন" : "ছোট করুন"}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-soft"
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${sheetCollapsed ? "rotate-180" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              aria-label="বন্ধ করুন"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-soft"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Verdict summary */}
          {riskCounts && (
            <div className="flex flex-wrap gap-2">
              {(["green", "yellow", "red"] as const)
                .filter((r) => riskCounts[r] > 0)
                .map((r) => (
                  <span key={r} className={`rounded-full px-4 py-1.5 text-lg font-bold ${VERDICT[r].className}`}>
                    {VERDICT[r].label} · {toBanglaDigits(riskCounts[r])}টি
                  </span>
                ))}
            </div>
          )}

          {!sheetCollapsed && (
            <>
              {/* Spoken answer, same as the home reply card */}
              {result.voice_assistant_response && (
                <div className="card p-5" aria-live="polite">
                  <p className="text-xl font-semibold leading-relaxed text-ink">{result.voice_assistant_response}</p>
                  <button
                    type="button"
                    onClick={() => (isSpeaking ? stopSpeaking() : speakResponse(result.voice_assistant_response))}
                    className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-canvas px-5 text-lg font-semibold text-ink active:bg-line"
                  >
                    {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    {isSpeaking ? "থামান" : "আবার শুনুন"}
                  </button>
                </div>
              )}

              {/* Items with a verdict each */}
              {result.identified_items && result.identified_items.length > 0 && (
                <div className="space-y-2">
                  <p className="section-title">যা দেখা গেছে</p>
                  {result.identified_items.map((item, idx) => {
                    const v = VERDICT[itemRisk(item)];
                    const VIcon = v.icon;
                    return (
                      <div key={idx} className="card flex items-center gap-3 p-4">
                        <span className={`icon-badge ${v.className}`}>
                          <VIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-bold leading-snug text-ink">{item.name}</p>
                          <p className="text-sm text-ink-muted">
                            {item.quantity ? `${item.quantity} · ` : ""}GI {toBanglaDigits(item.gi_index)} · GL{" "}
                            {toBanglaDigits(item.gl_load)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-base font-bold ${v.className}`}>{v.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Alerts */}
              {result.health_risk_alerts && result.health_risk_alerts.length > 0 && (
                <div className="space-y-2">
                  {result.health_risk_alerts.map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-2xl bg-risk-danger p-4 text-base font-semibold text-risk-dangerInk">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cooked plate: eating order */}
              {result.detected_type === "prepared_food" && result.plate_sequencing && result.plate_sequencing.length > 0 && (
                <div className="card space-y-3 p-4">
                  <p className="flex items-center gap-2 text-lg font-bold text-ink">
                    <Layers className="h-5 w-5 text-pastel-peach-strong" /> খাওয়ার ক্রম
                  </p>
                  {result.plate_sequencing.map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pastel-peach text-lg font-bold text-pastel-peach-ink">
                        {toBanglaDigits(s.step)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-ink">{s.phase}</p>
                        <p className="text-base leading-relaxed text-ink-soft">{s.instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Restaurant: waiter script */}
              {result.detected_type === "restaurant_menu" && result.waiter_script && (
                <div className="space-y-3 rounded-3xl bg-pastel-blue/60 p-4 text-pastel-blue-ink">
                  <p className="flex items-center gap-2 text-lg font-bold">
                    <Utensils className="h-5 w-5" /> ওয়েটারকে বলুন
                  </p>
                  <p className="text-base font-semibold italic leading-relaxed">&ldquo;{result.waiter_script}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => handleCopyScript(result.waiter_script!)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-ink active:bg-canvas"
                  >
                    {copiedScript ? <Check className="h-5 w-5 text-risk-safeInk" /> : <Copy className="h-5 w-5" />}
                    {copiedScript ? "কপি হয়েছে" : "কপি করুন"}
                  </button>
                </div>
              )}

              {/* Nutrition */}
              {result.nutritional_summary && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "ক্যালরি", value: toBanglaDigits(result.nutritional_summary.calories || 0) },
                    { label: "শর্করা", value: `${toBanglaDigits(result.nutritional_summary.carbs_g || 0)}g` },
                    { label: "প্রোটিন", value: `${toBanglaDigits(result.nutritional_summary.protein_g || 0)}g` },
                    { label: "আঁশ", value: `${toBanglaDigits(result.nutritional_summary.fiber_g || 0)}g` },
                  ].map((n) => (
                    <div key={n.label} className="card px-1 py-3">
                      <span className="block text-sm font-semibold text-ink-muted">{n.label}</span>
                      <span className="block text-lg font-bold text-ink">{n.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cost in Taka */}
              {result.cost_estimate && (
                <div className="card flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="icon-badge bg-pastel-lime text-lg font-bold text-pastel-lime-ink">৳</span>
                    <span className="text-base text-ink-soft">
                      আনুমানিক খরচ{" "}
                      <strong className="text-lg text-ink">
                        ৳{toBanglaDigits(
                          result.cost_estimate.total_cost_bdt || Math.round((result.cost_estimate.total_cost_usd || 0) * 120)
                        )}
                      </strong>
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-canvas px-3 py-1 text-sm font-bold text-ink-soft">
                    {result.cost_estimate.budget_tier === "budget_friendly"
                      ? "সাশ্রয়ী"
                      : result.cost_estimate.budget_tier === "premium"
                      ? "দামি"
                      : "মাঝারি"}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 5. BOTTOM DOCK: labelled buttons; the centre button works like the home talk button */}
      <footer className="relative z-40 mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2">
        {!result && !isProcessing && !isRecording && (
          <p className="mb-3 text-center text-base font-semibold text-white drop-shadow">
            একবার চাপুন: ছবি দেখুন · চেপে ধরে রাখুন: প্রশ্ন বলুন
          </p>
        )}
        <div className="flex items-end justify-between">
          <DockButton label="গ্যালারি" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="h-6 w-6" />
          </DockButton>
          <DockButton label="ক্যামেরা" active={cameraActive} onClick={toggleCameraPower}>
            {cameraActive ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </DockButton>

          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onPointerDown={handleCapsulePointerDown}
              onPointerUp={handleCapsulePointerUp}
              onPointerCancel={handleCapsulePointerCancel}
              onPointerLeave={handleCapsulePointerCancel}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => {
                // Keyboard activation (Enter/Space) reports detail 0; pointer taps are handled above.
                if (e.detail === 0) submitScan(null);
              }}
              disabled={isProcessing}
              style={{ touchAction: "none" }}
              aria-label="স্ক্যান করুন। প্রশ্ন বলতে চেপে ধরে রাখুন"
              className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-float transition-transform active:scale-95 disabled:opacity-70 ${
                isRecording ? "bg-pastel-coral-strong" : "bg-ink"
              }`}
            >
              {isRecording && <span className="absolute inset-0 animate-ping rounded-full bg-pastel-coral-strong/40" />}
              {isProcessing ? (
                <Loader2 className="h-9 w-9 animate-spin" />
              ) : isRecording ? (
                <Mic className="relative h-9 w-9" />
              ) : (
                <ScanLine className="h-9 w-9" />
              )}
            </button>
            <span className="text-base font-bold text-white drop-shadow">{isRecording ? "শুনছি" : "স্ক্যান"}</span>
          </div>

          <DockButton
            label={isMuted ? "মাইক বন্ধ" : "মাইক"}
            active={!isMuted}
            onClick={() => setIsMuted((m) => !m)}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </DockButton>
          <DockButton label="বন্ধ" onClick={closeLiveSession}>
            <X className="h-6 w-6" />
          </DockButton>
        </div>
      </footer>
    </div>
  );
}

function DockButton({
  label,
  onClick,
  active = true,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-16 flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-soft transition-transform active:scale-95 ${
          active ? "bg-white text-ink" : "bg-white/70 text-ink-muted"
        }`}
      >
        {children}
      </button>
      <span className="text-sm font-bold text-white drop-shadow">{label}</span>
    </div>
  );
}
