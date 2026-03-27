import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

// ═══════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════

// ─── 3-COLOR SYSTEM: near-black · warm-white · gold ───────
const C = {
  // Base
  ink: "#0C0C0E",
  inkSoft: "#161618",
  inkMid: "#1E1E22",
  // Text
  cream: "#F0EEE9",
  muted: "#888880",
  faint: "#444440",
  // Accent — single gold
  gold: "#C8A96E",
  goldDim: "rgba(200,169,110,0.15)",
  goldLine: "rgba(200,169,110,0.3)",
  // Glass layers
  g1: "rgba(240,238,233,0.04)",
  g2: "rgba(240,238,233,0.07)",
  g3: "rgba(240,238,233,0.11)",
  gb: "rgba(12,12,14,0.55)",
  // Semantic (data-only, not decorative)
  up: "#4CAF7D",
  down: "#E05252",
  warn: "#E8A838",
};

// Legacy alias so old COLORS refs still resolve
const COLORS = {
  bg: C.ink, bgSurface: C.inkSoft, bgCard: C.inkMid,
  red: C.down, blue: C.gold, gold: C.gold,
  green: C.up, orange: C.warn, purple: C.gold,
  brightBlue: C.gold, textPrimary: C.cream, textMuted: C.muted,
  border: C.faint, bgHover: C.inkMid,
};

const GLASS = {
  card: {
    background: C.g1,
    backdropFilter: "blur(20px) saturate(160%)",
    WebkitBackdropFilter: "blur(20px) saturate(160%)",
    border: `1px solid rgba(240,238,233,0.08)`,
    boxShadow: "0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(240,238,233,0.06)",
    borderRadius: "clamp(12px,1.5vw,18px)",
    padding: "clamp(14px,1.8vw,24px)",
    marginBottom: 16,
  },
  cardSm: {
    background: "rgba(240,238,233,0.03)",
    backdropFilter: "blur(16px) saturate(140%)",
    WebkitBackdropFilter: "blur(16px) saturate(140%)",
    border: "1px solid rgba(240,238,233,0.06)",
    boxShadow: "0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(240,238,233,0.05)",
    borderRadius: "clamp(8px,1vw,12px)",
    padding: "clamp(10px,1.4vw,16px)",
  },
  modal: {
    background: "rgba(12,12,14,0.82)",
    backdropFilter: "blur(32px) saturate(180%)",
    WebkitBackdropFilter: "blur(32px) saturate(180%)",
    border: `1px solid ${C.goldLine}`,
    boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,169,110,0.12)`,
    borderRadius: "clamp(14px,2vw,22px)",
  },
};

const SUBTES = [
  { id: "PU", name: "Penalaran Umum", short: "PU", color: C.gold, target: 100, baseline: 75 },
  { id: "PPU", name: "Pengetahuan & Pemahaman Umum", short: "PPU", color: C.gold, target: 85, baseline: 60 },
  { id: "PBM", name: "Pemahaman Bacaan & Menulis", short: "PBM", color: C.gold, target: 80, baseline: 60 },
  { id: "LBI", name: "Literasi Bahasa Indonesia", short: "LBI", color: C.up, target: 105, baseline: 80 },
  { id: "LBE", name: "Literasi Bahasa Inggris", short: "LBE", color: C.warn, target: 75, baseline: 55 },
  { id: "PK", name: "Penalaran Kuantitatif", short: "PK", color: C.gold, target: 125, baseline: 110 },
  { id: "PM", name: "Pengetahuan Matematika", short: "PM", color: C.cream, target: 135, baseline: 120 },
];

const PHASES = [
  { name: "FOUNDATION", days: [1, 2, 3, 4, 5, 6, 7], color: C.muted, label: "Foundation" },
  { name: "INTENSIVE I", days: [8, 9, 10, 11, 12, 13, 14], color: C.gold, label: "Intensive I" },
  { name: "INTENSIVE II", days: [15, 16, 17, 18], color: C.warn, label: "Intensive II" },
  { name: "SIMULATION", days: [19, 20, 21, 22, 23, 24], color: C.up, label: "Simulation" },
  { name: "EXECUTION", days: [25, 26], color: C.down, label: "Execution" },
];

const TO_DAYS = [1, 10, 14, 18, 19, 21, 23];

// ─── PROFESSIONAL COPY — clean, precise, no filler ───────
const QUOTES = [
  "Baseline established. Data-driven iteration begins.",
  "Metrics don't lie. Your data is your compass.",
  "Quantitative reasoning is the highest-leverage subtest. Prioritize accordingly.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Compound effort. Small daily gains create exponential results.",
  "Practice problems reveal gaps faster than passive review.",
  "Every completed problem is a data point in your model.",
  "Scores are coordinates, not verdicts. Adjust and proceed.",
  "Target: 700+. Systematic execution, not aspiration.",
  "Daily iteration. Compound results.",
  "26 days of structured execution. Consistent output over inspiration.",
  "One plan, fully executed, outperforms ten plans considered.",
  "The map is not the territory — but you still need the map.",
  "Reading speed × comprehension accuracy = total score impact.",
  "Language proficiency compounds across multiple subtests.",
  "Professionals practice until they can't get it wrong.",
  "Error analysis today directly improves tomorrow's accuracy.",
  "Deliberate practice, not passive study. Active recall only.",
  "Simulations under test conditions yield the most accurate predictions.",
  "No practice is wasted. Feedback loops require input.",
  "Direction matters more than speed. Verify your approach.",
  "The differentiator: systems, not talent.",
  "Final phase. Execute the plan as designed.",
  "Review is not a weakness — it's the highest-ROI activity.",
  "Recovery is part of the system. Rest to consolidate.",
  "Program complete. Execution day ahead.",
];

// ═══════════════════════════════════════════════════════════
// 26-DAY CURRICULUM DATA
// ═══════════════════════════════════════════════════════════

const CURRICULUM = [
  {
    day: 1, date: "2026-03-25", phase: "FOUNDATION", title: "DIAGNOSTIC — TO Full Pertama", focus: ["ALL"], focusSubtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], isTO: true, toNum: 1,
    tasks: [
      { id: "d1t1", label: "Ikut TO Diagnostic Full di SainsIn", tag: "TO", link: "https://sainsin.com" },
      { id: "d1t2", label: "Backup: SNPMB Official Simulasi", tag: "BACKUP", link: "https://snpmb.id/simulasi" },
      { id: "d1t3", label: "Screenshot/catat skor tiap subtes (7 nilai)", tag: "MANUAL" },
      { id: "d1t4", label: "Upload hasil ke UploadAnalyzer", tag: "UPLOAD" },
      { id: "d1t5", label: "Tulis 3 subtes terlemah berdasarkan hasil", tag: "NOTES" },
      { id: "d1t6", label: "Baca roadmap hari 2–7, pahami schedule", tag: "PLAN" },
    ],
    sideQuests: [{ id: "d1sq1", label: "TO penuh tanpa skip", xp: 25 }, { id: "d1sq2", label: "Upload sebelum jam 14:00", xp: 15 }],
    quote: "Baseline established. Data-driven iteration begins."
  },
  {
    day: 2, date: "2026-03-26", phase: "FOUNDATION", title: "PK/PM Blitz — Mantappu P5–P7", focus: ["PK", "PM"], focusSubtes: ["PK", "PM"], isTO: false,
    tasks: [
      { id: "d2t1", label: "Mantappu AmbiSNBT P5 (1.5x) + catat", tag: "VIDEO", link: "https://docs.google.com/document/d/1fh5kvGtURv2OduN_B5RovCsWLAMESuGXz2de5ppx0mU/edit" },
      { id: "d2t2", label: "Mantappu AmbiSNBT P6 (1.5x) + catat", tag: "VIDEO" },
      { id: "d2t3", label: "Mantappu AmbiSNBT P7 (1.5x) + catat", tag: "VIDEO" },
      { id: "d2t4", label: "30 soal PK di aimasukptn.com", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d2t5", label: "20 soal PM di aimasukptn.com", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d2t6", label: "Error analysis: 5 pola kesalahan", tag: "ANALYSIS" },
      { id: "d2t7", label: "Update understanding slider PK & PM", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d2sq1", label: "3 sesi Mantappu 1 hari", xp: 20 }, { id: "d2sq2", label: "Total soal ≥ 60", xp: 15 }],
    quote: "Metrics don't lie. Your data is your compass."
  },
  {
    day: 3, date: "2026-03-27", phase: "FOUNDATION", title: "PK/PM Finish — Mantappu P8–P10", focus: ["PK", "PM"], focusSubtes: ["PK", "PM"], isTO: false,
    tasks: [
      { id: "d3t1", label: "Mantappu AmbiSNBT P8 (1.5x) + catat", tag: "VIDEO", link: "https://docs.google.com/document/d/1fh5kvGtURv2OduN_B5RovCsWLAMESuGXz2de5ppx0mU/edit" },
      { id: "d3t2", label: "Mantappu AmbiSNBT P9 (1.5x) + catat", tag: "VIDEO" },
      { id: "d3t3", label: "Mantappu AmbiSNBT P10 (1.5x) + catat", tag: "VIDEO" },
      { id: "d3t4", label: "30 soal PK", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d3t5", label: "30 soal PM", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d3t6", label: "Z Academy PK/PM topik bingung", tag: "BONUS", link: "https://docs.google.com/spreadsheets/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=581220731" },
      { id: "d3t7", label: "Recap formula PK/PM wajib hafal", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d3sq1", label: "Total soal ≥ 80", xp: 30 }, { id: "d3sq2", label: "3 sesi Mantappu selesai", xp: 20 }],
    quote: "Quantitative reasoning: highest-leverage subtest."
  },
  {
    day: 4, date: "2026-03-28", phase: "FOUNDATION", title: "PU Full Attack", focus: ["PU"], focusSubtes: ["PU"], isTO: false,
    tasks: [
      { id: "d4t1", label: "Z Academy PU: Penalaran Deduktif", tag: "VIDEO", link: "https://docs.google.com/spreadsheets/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=1212141722" },
      { id: "d4t2", label: "Zenius: PU Penalaran Induktif", tag: "VIDEO", link: "https://www.youtube.com/@ZeniusEducation" },
      { id: "d4t3", label: "Zenius: PU Penalaran Kuantitatif", tag: "VIDEO" },
      { id: "d4t4", label: "30 soal PU Deduktif", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d4t5", label: "20 soal PU Induktif", tag: "DRILL" },
      { id: "d4t6", label: "20 soal PU Kuantitatif", tag: "DRILL" },
      { id: "d4t7", label: "Catat pola soal tiap tipe PU", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d4sq1", label: "3 tipe PU ter-drill", xp: 20 }, { id: "d4sq2", label: "Catatan pola ≥ 1/tipe", xp: 15 }],
    quote: "Pattern recognition drives score improvement."
  },
  {
    day: 5, date: "2026-03-29", phase: "FOUNDATION", title: "PPU From Zero", focus: ["PPU"], focusSubtes: ["PPU"], isTO: false,
    tasks: [
      { id: "d5t1", label: "Zenius: PPU series ep 1–3", tag: "VIDEO", link: "https://www.youtube.com/@ZeniusEducation" },
      { id: "d5t2", label: "Trik PPU (Pak Franzz)", tag: "VIDEO", link: "https://www.youtube.com/watch?v=drYws1LCkjc" },
      { id: "d5t3", label: "Strategi PPU aimasukptn", tag: "READ", link: "https://aimasukptn.com/blog/strategi-saat-ujian-snbt-2026" },
      { id: "d5t4", label: "40 soal PPU", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d5t5", label: "10 soal PPU di SainsIn", tag: "DRILL", link: "https://sainsin.com" },
      { id: "d5t6", label: "Catat topik PPU paling sering keluar", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d5sq1", label: "50+ soal PPU", xp: 25 }, { id: "d5sq2", label: "Notes topik selesai", xp: 15 }],
    quote: "Knowledge gaps identified early are gaps closed."
  },
  {
    day: 6, date: "2026-03-30", phase: "FOUNDATION", title: "PBM From Zero", focus: ["PBM"], focusSubtes: ["PBM"], isTO: false,
    tasks: [
      { id: "d6t1", label: "Trik PPU & PBM (Pak Franzz)", tag: "VIDEO", link: "https://www.youtube.com/watch?v=drYws1LCkjc" },
      { id: "d6t2", label: "Latsoal UTBK PPU PBM Part 1", tag: "VIDEO", link: "https://www.youtube.com/watch?v=olDMv7a-vAg" },
      { id: "d6t3", label: "Zenius: PBM Membaca Teks", tag: "VIDEO", link: "https://www.youtube.com/watch?v=qOVHa2doPrs" },
      { id: "d6t4", label: "Teknik SRAS: Scan → Read → Answer", tag: "READ", link: "https://aimasukptn.com/blog/subtes-snbt-paling-cepat-naik-skornya" },
      { id: "d6t5", label: "40 soal PBM", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d6t6", label: "2 teks PBM penuh + analisis", tag: "LATIHAN" },
      { id: "d6t7", label: "Catat pola pertanyaan PBM", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d6sq1", label: "2 teks analisis penuh", xp: 20 }, { id: "d6sq2", label: "50+ soal PBM", xp: 15 }],
    quote: "Speed plus accuracy equals score impact."
  },
  {
    day: 7, date: "2026-03-31", phase: "FOUNDATION", title: "LBE Attack — Z Academy Full", focus: ["LBE"], focusSubtes: ["LBE"], isTO: false,
    tasks: [
      { id: "d7t1", label: "Z Academy LBE Modul 1: Reading Strategies", tag: "VIDEO", link: "https://docs.google.com/spreadsheets/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=656432209" },
      { id: "d7t2", label: "Z Academy LBE Modul 2: Vocabulary", tag: "VIDEO" },
      { id: "d7t3", label: "Z Academy LBE Modul 3: Main Ideas", tag: "VIDEO" },
      { id: "d7t4", label: "Z Academy LBE Modul 4: Inference", tag: "VIDEO" },
      { id: "d7t5", label: "Z Academy LBE Modul 5: Complex Text", tag: "VIDEO" },
      { id: "d7t6", label: "40 soal LBE", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d7t7", label: "20 vocab baru dari soal LBE", tag: "VOCAB" },
    ],
    sideQuests: [{ id: "d7sq1", label: "5 modul + 40 soal", xp: 30 }, { id: "d7sq2", label: "20 vocab tercatat", xp: 20 }],
    quote: "Language proficiency compounds across subtests."
  },
  {
    day: 8, date: "2026-04-01", phase: "INTENSIVE I", title: "LBE Deep Drill", focus: ["LBE", "LBI"], focusSubtes: ["LBE", "LBI"], isTO: false,
    tasks: [
      { id: "d8t1", label: "Z Academy LBE review modul 1–3", tag: "REVIEW", link: "https://docs.google.com/spreadsheets/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=656432209" },
      { id: "d8t2", label: "50 soal LBE", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d8t3", label: "30 soal LBI", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d8t4", label: "Cek Mantappu Fase 3", tag: "BONUS", link: "https://docs.google.com/document/d/1fh5kvGtURv2OduN_B5RovCsWLAMESuGXz2de5ppx0mU/edit" },
      { id: "d8t5", label: "Error analysis LBE: 5 patterns", tag: "ANALYSIS" },
      { id: "d8t6", label: "+15 vocab baru LBE", tag: "VOCAB" },
      { id: "d8t7", label: "Update slider LBE + LBI", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d8sq1", label: "80+ soal total", xp: 25 }, { id: "d8sq2", label: "Mantappu Fase 3", xp: 20 }],
    quote: "Every problem solved is a data point in your model."
  },
  {
    day: 9, date: "2026-04-02", phase: "INTENSIVE I", title: "LBE + PU Kombinasi", focus: ["LBE", "PU"], focusSubtes: ["LBE", "PU"], isTO: false,
    tasks: [
      { id: "d9t1", label: "40 soal LBE", tag: "DRILL", link: "https://aimasukptn.com/latsol-snbt-gratis" },
      { id: "d9t2", label: "40 soal PU", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d9t3", label: "Review catatan error PU Day 4", tag: "REVIEW" },
      { id: "d9t4", label: "20 soal PU bonus (tipe lemah)", tag: "DRILL" },
      { id: "d9t5", label: "Bandingkan progress vs baseline", tag: "ANALYSIS" },
      { id: "d9t6", label: "Update error notes", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d9sq1", label: "100+ soal total", xp: 20 }, { id: "d9sq2", label: "Review error selesai", xp: 15 }],
    quote: "Daily iteration. Compound results."
  },
  {
    day: 10, date: "2026-04-03", phase: "INTENSIVE I", title: "TO #2 — Full SNBT", focus: ["ALL"], focusSubtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], isTO: true, toNum: 2,
    tasks: [
      { id: "d10t1", label: "Full TO #2 di Ruangguru", tag: "TO", link: "https://www.ruangguru.com/ruanguji" },
      { id: "d10t2", label: "Backup: SIAPPTN", tag: "BACKUP", link: "https://siapptn.com" },
      { id: "d10t3", label: "Upload hasil ke UploadAnalyzer", tag: "UPLOAD" },
      { id: "d10t4", label: "Bahas soal salah PU + PPU", tag: "ANALYSIS" },
      { id: "d10t5", label: "Bandingkan TO-2 vs TO-1", tag: "ANALYSIS" },
      { id: "d10t6", label: "Identifikasi 3 topik masih lemah", tag: "NOTES" },
      { id: "d10t7", label: "Sesuaikan prioritas hari 11–14", tag: "PLAN" },
    ],
    sideQuests: [{ id: "d10sq1", label: "TO selesai penuh", xp: 50 }, { id: "d10sq2", label: "Analisis delta selesai", xp: 25 }],
    quote: "Simulations under test conditions yield accurate predictions."
  },
  {
    day: 11, date: "2026-04-04", phase: "INTENSIVE I", title: "PPU Deep Drill", focus: ["PPU", "PBM"], focusSubtes: ["PPU", "PBM"], isTO: false,
    tasks: [
      { id: "d11t1", label: "Zenius: PPU lanjutan", tag: "VIDEO", link: "https://www.youtube.com/@ZeniusEducation" },
      { id: "d11t2", label: "60 soal PPU", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d11t3", label: "30 soal PBM", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d11t4", label: "Error PPU: pola kesalahan", tag: "ANALYSIS" },
      { id: "d11t5", label: "Catat topik PPU sering salah", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d11sq1", label: "90+ soal total", xp: 25 }, { id: "d11sq2", label: "Error pattern identified", xp: 20 }],
    quote: "Identify gaps early. Close them systematically."
  },
  {
    day: 12, date: "2026-04-05", phase: "INTENSIVE I", title: "PBM Deep Drill", focus: ["PBM", "LBI"], focusSubtes: ["PBM", "LBI"], isTO: false,
    tasks: [
      { id: "d12t1", label: "Ulangi teknik SRAS", tag: "REVIEW", link: "https://aimasukptn.com/blog/subtes-snbt-paling-cepat-naik-skornya" },
      { id: "d12t2", label: "50 soal PBM", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d12t3", label: "3 teks PBM panjang + analisis", tag: "LATIHAN" },
      { id: "d12t4", label: "30 soal LBI", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d12t5", label: "Error analysis PBM + LBI", tag: "ANALYSIS" },
      { id: "d12t6", label: "Update pola pertanyaan PBM", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d12sq1", label: "80+ soal total", xp: 25 }, { id: "d12sq2", label: "3 teks analisis", xp: 20 }],
    quote: "Reading comprehension: fastest subtest to improve."
  },
  {
    day: 13, date: "2026-04-06", phase: "INTENSIVE I", title: "LBI Deep Drill", focus: ["LBI"], focusSubtes: ["LBI"], isTO: false,
    tasks: [
      { id: "d13t1", label: "Z Academy LBI: review 8 topik", tag: "VIDEO", link: "https://docs.google.com/spreadsheets/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=1573664648" },
      { id: "d13t2", label: "60 soal LBI", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d13t3", label: "Mini TO LBI di SainsIn", tag: "DRILL", link: "https://sainsin.com" },
      { id: "d13t4", label: "Error analysis LBI", tag: "ANALYSIS" },
      { id: "d13t5", label: "Aturan bahasa menjebak", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d13sq1", label: "70+ soal LBI", xp: 25 }, { id: "d13sq2", label: "8 topik tercatat", xp: 20 }],
    quote: "Language mastery is a force multiplier."
  },
  {
    day: 14, date: "2026-04-07", phase: "INTENSIVE I", title: "TO #3 — Mid-Point", focus: ["ALL"], focusSubtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], isTO: true, toNum: 3,
    tasks: [
      { id: "d14t1", label: "Full TO #3 di SIAPPTN", tag: "TO", link: "https://siapptn.com" },
      { id: "d14t2", label: "Upload hasil ke UploadAnalyzer", tag: "UPLOAD" },
      { id: "d14t3", label: "Bahas LBI + LBE", tag: "ANALYSIS" },
      { id: "d14t4", label: "Delta TO-3 vs TO-2", tag: "ANALYSIS" },
      { id: "d14t5", label: "Radar chart — subtes terlemah?", tag: "REVIEW" },
      { id: "d14t6", label: "Update error notes + rencana", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d14sq1", label: "TO selesai penuh", xp: 50 }, { id: "d14sq2", label: "Delta analysis done", xp: 25 }],
    quote: "Midpoint checkpoint. Trajectory confirmed."
  },
  {
    day: 15, date: "2026-04-08", phase: "INTENSIVE II", title: "PK + PM Maintenance", focus: ["PK", "PM"], focusSubtes: ["PK", "PM"], isTO: false,
    tasks: [
      { id: "d15t1", label: "50 soal PK", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d15t2", label: "40 soal PM", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d15t3", label: "Cek Mantappu Fase 3", tag: "BONUS", link: "https://docs.google.com/document/d/1fh5kvGtURv2OduN_B5RovCsWLAMESuGXz2de5ppx0mU/edit" },
      { id: "d15t4", label: "Z Academy PK/PM error topics", tag: "REVIEW", link: "https://docs.google.com/spreadsheets/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=581220731" },
      { id: "d15t5", label: "Formula PK/PM hari ujian", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d15sq1", label: "90+ soal total", xp: 20 }, { id: "d15sq2", label: "Mantappu Fase 3", xp: 15 }],
    quote: "Positive trend detected. Maintain intensity."
  },
  {
    day: 16, date: "2026-04-09", phase: "INTENSIVE II", title: "LBE Full Intensive", focus: ["LBE"], focusSubtes: ["LBE"], isTO: false,
    tasks: [
      { id: "d16t1", label: "60 soal LBE berbagai tipe", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d16t2", label: "Vocab intensive: 25 kata baru", tag: "VOCAB" },
      { id: "d16t3", label: "20 soal LBE inference", tag: "DRILL", link: "https://aimasukptn.com/latsol-snbt-gratis" },
      { id: "d16t4", label: "Error analysis LBE", tag: "ANALYSIS" },
      { id: "d16t5", label: "Strategi LBE per tipe soal", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d16sq1", label: "80+ soal LBE", xp: 30 }, { id: "d16sq2", label: "25 vocab tercatat", xp: 20 }],
    quote: "Deep focus. Complete coverage on weakest area."
  },
  {
    day: 17, date: "2026-04-10", phase: "INTENSIVE II", title: "PU + PPU Mix Drill", focus: ["PU", "PPU"], focusSubtes: ["PU", "PPU"], isTO: false,
    tasks: [
      { id: "d17t1", label: "50 soal PU mix", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d17t2", label: "50 soal PPU", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d17t3", label: "Zenius: PPU topik spesifik", tag: "REVIEW", link: "https://www.youtube.com/@ZeniusEducation" },
      { id: "d17t4", label: "Error analysis PU + PPU", tag: "ANALYSIS" },
      { id: "d17t5", label: "Update notes kedua subtes", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d17sq1", label: "100+ soal total", xp: 25 }, { id: "d17sq2", label: "Error analysis selesai", xp: 20 }],
    quote: "Logic + Knowledge = optimal exam performance."
  },
  {
    day: 18, date: "2026-04-11", phase: "INTENSIVE II", title: "TO #4 — Phase 2 Final", focus: ["ALL"], focusSubtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], isTO: true, toNum: 4,
    tasks: [
      { id: "d18t1", label: "Full TO #4 di tryout.id", tag: "TO", link: "https://tryout.id" },
      { id: "d18t2", label: "Backup: snbt.id", tag: "BACKUP", link: "https://snbt.id" },
      { id: "d18t3", label: "Upload hasil ke UploadAnalyzer", tag: "UPLOAD" },
      { id: "d18t4", label: "Bahas semua soal salah", tag: "ANALYSIS" },
      { id: "d18t5", label: "Score progression TO-1→TO-4", tag: "ANALYSIS" },
      { id: "d18t6", label: "UNLOCK Phase 3 & 4", tag: "MILESTONE" },
      { id: "d18t7", label: "Final plan Phase Simulasi", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d18sq1", label: "TO + semua salah dibahas", xp: 50 }],
    quote: "Phase 2 complete. Entering simulation protocol."
  },
  {
    day: 19, date: "2026-04-12", phase: "SIMULATION", title: "TO #5 + Intensive Analysis", focus: ["ALL"], focusSubtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], isTO: true, toNum: 5, locked: true,
    tasks: [
      { id: "d19t1", label: "Full TO #5 di aimasukptn", tag: "TO", link: "https://aimasukptn.com/latihan-soal-snbt" },
      { id: "d19t2", label: "Upload hasil", tag: "UPLOAD" },
      { id: "d19t3", label: "Bahas semua soal salah", tag: "ANALYSIS" },
      { id: "d19t4", label: "Drill 30 soal subtes terendah", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d19t5", label: "Update error notes", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d19sq1", label: "TO + analysis done", xp: 40 }],
    quote: "Test simulation is exam-day rehearsal. Nothing more."
  },
  {
    day: 20, date: "2026-04-13", phase: "SIMULATION", title: "Attack Subtes Terlemah", focus: ["WEAKEST"], focusSubtes: ["LBE", "PPU"], isTO: false, locked: true,
    tasks: [
      { id: "d20t1", label: "Identifikasi 2 subtes terlemah", tag: "ANALYSIS" },
      { id: "d20t2", label: "60 soal subtes terlemah #1", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d20t3", label: "40 soal subtes terlemah #2", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d20t4", label: "Review materi spesifik", tag: "REVIEW", link: "https://www.youtube.com/@ZeniusEducation" },
      { id: "d20t5", label: "Update understanding semua", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d20sq1", label: "100+ soal attack", xp: 30 }],
    quote: "Target weakest subtests. Maximum improvement ROI."
  },
  {
    day: 21, date: "2026-04-14", phase: "SIMULATION", title: "TO #6 — Simulasi Hari H", focus: ["ALL"], focusSubtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], isTO: true, toNum: 6, locked: true,
    tasks: [
      { id: "d21t1", label: "Mulai TO jam 07:30 WIB", tag: "PREP" },
      { id: "d21t2", label: "Full TO #6 Ruangguru", tag: "TO", link: "https://www.ruangguru.com/ruanguji" },
      { id: "d21t3", label: "Kondisi ketat: timer, no HP", tag: "KONDISI" },
      { id: "d21t4", label: "Upload hasil segera", tag: "UPLOAD" },
      { id: "d21t5", label: "Bahas LBE + PPU", tag: "ANALYSIS" },
      { id: "d21t6", label: "Catat perasaan saat mengerjakan", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d21sq1", label: "Mulai tepat 07:30", xp: 30 }],
    quote: "System ready. Execution protocol active."
  },
  {
    day: 22, date: "2026-04-15", phase: "SIMULATION", title: "LBE + PPU Final Attack", focus: ["LBE", "PPU"], focusSubtes: ["LBE", "PPU"], isTO: false, locked: true,
    tasks: [
      { id: "d22t1", label: "60 soal LBE", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d22t2", label: "40 soal PPU", tag: "DRILL", link: "https://aimasukptn.com/practice" },
      { id: "d22t3", label: "Review vocab LBE semua", tag: "VOCAB" },
      { id: "d22t4", label: "Pattern error LBE terakhir", tag: "ANALYSIS" },
      { id: "d22t5", label: "Cheat sheet mental LBE", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d22sq1", label: "100+ soal", xp: 25 }],
    quote: "Final optimization pass. Close remaining gaps."
  },
  {
    day: 23, date: "2026-04-16", phase: "SIMULATION", title: "TO #7 — Final Diagnostic", focus: ["ALL"], focusSubtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], isTO: true, toNum: 7, locked: true,
    tasks: [
      { id: "d23t1", label: "Full TO #7 di SainsIn", tag: "TO", link: "https://sainsin.com" },
      { id: "d23t2", label: "Backup: SIAPPTN", tag: "BACKUP", link: "https://siapptn.com" },
      { id: "d23t3", label: "Upload hasil → final radar", tag: "UPLOAD" },
      { id: "d23t4", label: "Final error analysis", tag: "ANALYSIS" },
      { id: "d23t5", label: "TO progression TO-1→TO-7", tag: "ANALYSIS" },
      { id: "d23t6", label: "Cek total ≥ 685?", tag: "CHECK" },
    ],
    sideQuests: [{ id: "d23sq1", label: "Final Diagnostic ≥ 685", xp: 50 }],
    quote: "Final diagnostic complete. Data analysis finalized."
  },
  {
    day: 24, date: "2026-04-17", phase: "SIMULATION", title: "Review Total Error Notes", focus: ["ALL"], focusSubtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], isTO: false, locked: true,
    tasks: [
      { id: "d24t1", label: "Baca ulang SEMUA error notes", tag: "REVIEW" },
      { id: "d24t2", label: "Buat Master Mistake Sheet", tag: "NOTES" },
      { id: "d24t3", label: "20 soal/subtes (light drill)", tag: "DRILL", link: "https://aimasukptn.com/latsol-snbt-gratis" },
      { id: "d24t4", label: "Rangkuman strategi per subtes", tag: "NOTES" },
    ],
    sideQuests: [{ id: "d24sq1", label: "Master sheet selesai", xp: 30 }],
    quote: "Review is not weakness. It is the highest-ROI activity."
  },
  {
    day: 25, date: "2026-04-18", phase: "EXECUTION", title: "Light Review + Mental Prep", focus: ["REVIEW"], focusSubtes: ["PM", "PK", "LBE"], isTO: false, locked: true,
    tasks: [
      { id: "d25t1", label: "Review formula PM/PK", tag: "REVIEW" },
      { id: "d25t2", label: "Review key patterns LBE", tag: "REVIEW" },
      { id: "d25t3", label: "Review tricks PU + PPU", tag: "REVIEW" },
      { id: "d25t4", label: "TIDAK ADA materi baru", tag: "REST" },
      { id: "d25t5", label: "Max 30 soal ringan saja", tag: "DRILL", link: "https://aimasukptn.com/latsol-snbt-gratis" },
      { id: "d25t6", label: "Siapkan dokumen UTBK", tag: "PREP" },
      { id: "d25t7", label: "Tidur sebelum 22:00", tag: "REST" },
    ],
    sideQuests: [{ id: "d25sq1", label: "Tidur jam 22:00", xp: 20 }],
    quote: "Recovery is part of the system. Rest to consolidate."
  },
  {
    day: 26, date: "2026-04-19", phase: "EXECUTION", title: "Standby Mode — H-2", focus: ["REST"], focusSubtes: [], isTO: false, locked: true,
    tasks: [
      { id: "d26t1", label: "Baca ulang cheat sheet mental", tag: "REVIEW" },
      { id: "d26t2", label: "Tidak ada drill hari ini", tag: "REST" },
      { id: "d26t3", label: "Cek lokasi ujian (Maps)", tag: "PREP" },
      { id: "d26t4", label: "Cek kondisi fisik", tag: "PREP" },
      { id: "d26t5", label: "Baca motivasi dari /method", tag: "MINDSET" },
      { id: "d26t6", label: "Tidur jam 21:30 WIB", tag: "REST" },
    ],
    sideQuests: [],
    quote: "Program complete. 26 days executed. Results ahead."
  },
];

// ═══════════════════════════════════════════════════════════
// LOCALSTORAGE HELPERS
// ═══════════════════════════════════════════════════════════

const LS = {
  get: (key, def) => { try { const v = localStorage.getItem("utbk26_" + key); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (key, val) => { try { localStorage.setItem("utbk26_" + key, JSON.stringify(val)); } catch { } },
};

// ═══════════════════════════════════════════════════════════
// CLOD AI — FALLBACK CHAIN (Groq → Gemini → xAI)
// ═══════════════════════════════════════════════════════════

// ─── DOWNLOAD UTILITIES ──────────────────────────────────
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(rows, headers, filename) {
  const lines = [headers.join(","), ...rows.map(r => r.map(c => JSON.stringify(c)).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportProgressReport(progress, toHistory) {
  const curDay = getCurrentDay();
  const lines = [`UTBK_26 — Progress Report`, `Generated: ${new Date().toLocaleString("id-ID")}`, `Day ${curDay}/26`, ``, `═══ TASK PROGRESS ═══`];
  CURRICULUM.forEach(d => {
    const p = progress[d.day];
    if (!p) return;
    const done = Object.values(p.tasks || {}).filter(Boolean).length;
    const total = d.tasks.length;
    if (done === 0) return;
    lines.push(`Day ${d.day}: ${d.title} — ${done}/${total} (${Math.round(done / total * 100)}%)`);
    if (p.notes) lines.push(`  Notes: ${p.notes}`);
  });
  lines.push(``, `═══ TO HISTORY ═══`);
  toHistory.forEach((t, i) => {
    lines.push(`${t.id} (${t.date}): Total=${t.total}`);
    SUBTES.forEach(s => lines.push(`  ${s.short}: ${t.scores[s.id] || 0}/${s.target}`));
  });
  lines.push(``, `═══ UNDERSTANDING ═══`);
  let sums = {}; let cnts = {};
  SUBTES.forEach(s => { sums[s.id] = 0; cnts[s.id] = 0; });
  for (let d = 1; d <= curDay; d++) {
    SUBTES.forEach(s => { const v = progress[d]?.understanding?.[s.id]; if (v > 0) { sums[s.id] += v; cnts[s.id]++; } });
  }
  SUBTES.forEach(s => {
    const avg = cnts[s.id] > 0 ? Math.round(sums[s.id] / cnts[s.id]) : 0;
    lines.push(`${s.short}: ${avg}% avg pemahaman`);
  });
  downloadText(lines.join("\n"), `utbk26-report-day${curDay}-${new Date().toISOString().slice(0, 10)}.txt`);
}

function exportTOCSV(toHistory) {
  const headers = ["TO", "Tanggal", "Day", ...SUBTES.map(s => s.short), "TOTAL"];
  const rows = toHistory.map(t => [t.id, t.date, t.day, ...SUBTES.map(s => t.scores[s.id] || 0), t.total]);
  downloadCSV(rows, headers, `utbk26-to-history-${new Date().toISOString().slice(0, 10)}.csv`);
}

const API_PROVIDERS = [
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: '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',
    model: 'llama-3.3-70b-versatile'
  },
  {
    name: 'Google',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    key: 'AIzaSyCYkQrMGZVoxoaiQ7pO0cqUyXsqCJjTZdI',
    model: 'gemini-2.0-flash'
  },
  {
    name: 'xAI',
    url: 'https://api.x.ai/v1/chat/completions',
    key: 'xai-kaU66pr7sTsdHbHcvS0XUuIW2waq9pEIuisLbeSsSlzIxZHBzQ0c9Ca6BRoDzbdUYAYbbr39D2906Izx',
    model: 'grok-3-mini'
  }
];

async function callClodAI(messages) {
  for (const provider of API_PROVIDERS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);
      const res = await fetch(provider.url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.key}`,
        },
        body: JSON.stringify({ model: provider.model, messages, max_tokens: 1024, temperature: 0.7 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`${provider.name} HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error(`${provider.name}: empty response`);
      console.log(`[Clod] ✓ Provider: ${provider.name}`);
      return text;
    } catch (err) {
      console.warn(`[Clod] ✗ ${provider.name}: ${err.message}`);
      if (err.name === 'AbortError') console.warn(`[Clod] ${provider.name} timed out`);
      continue;
    }
  }
  return "Koneksi ke AI tidak tersedia saat ini. Periksa koneksi internet dan coba lagi.";
}

// Build system prompt per mode
function buildClodSystemPrompt(mode, curDay, cur, done, totalTasks) {
  const base = `Kamu adalah Clod — AI tutor personal untuk program UTBK SNBT 26-hari. Karakter: presisi, singkat, tidak ada basa-basi. Bahasa Indonesia. Tidak ada emoji berlebihan. Tidak ada kalimat penyemangat generik.

Konteks hari ini:
- Day ${curDay}/26
- Judul: ${cur.title}
- Fase: ${cur.phase}
- Fokus subtes: ${cur.focusSubtes.join(", ")}
- Progress: ${done}/${totalTasks} tasks selesai
- Hari TO: ${cur.isTO ? "YA — TO #" + cur.toNum : "Tidak"}
`;

  const modes = {
    TUTOR: base + `\nMode: TUTOR. Jelaskan konsep subtes hari ini dengan detail. Gunakan contoh soal SNBT nyata jika relevan. Fokus pada strategi pengerjaan, bukan teori.`,
    REVIEW: base + `\nMode: REVIEW. Buat 3–5 pertanyaan quiz untuk menguji pemahaman subtes hari ini. Setelah user jawab, evaluasi dan jelaskan jawaban benar.`,
    DEBUG: base + `\nMode: DEBUG. Bantu user mengidentifikasi pola kesalahan dari soal yang salah. Tanyakan tipe soal dan konsep yang salah, lalu analisis root cause-nya.`,
    BRIEF: base + `\nMode: BRIEF. Beri ringkasan 3–5 poin materi kritis hari ini dalam format bullet. Maksimal 150 kata. Padat, tidak berulang.`,
    WRAPUP: base + `\nMode: WRAPUP. Buat recap hari ${curDay}: progress task, subtes yang dilatih, identifikasi gap, dan 1 rekomendasi konkret untuk besok.`,
  };
  return modes[mode] || base;
}

function getCurrentDay() {
  const start = new Date("2026-03-25");
  const now = new Date();
  const diff = Math.floor((now - start) / 86400000) + 1;
  return Math.max(1, Math.min(26, diff));
}

function getDaysRemaining() {
  const exam = new Date("2026-04-21");
  const now = new Date();
  return Math.max(0, Math.ceil((exam - now) / 86400000));
}

function getPhaseForDay(day) {
  return PHASES.find(p => p.days.includes(day)) || PHASES[0];
}

function getSubtesColor(id) {
  return SUBTES.find(s => s.id === id)?.color || C.muted;
}

function initProgress() {
  let prog = LS.get("progress", null);
  if (!prog) {
    prog = {};
    CURRICULUM.forEach(d => {
      prog[d.day] = { tasks: {}, sideQuests: {}, understanding: {}, notes: "", soalCount: 0, started: false, startTime: "" };
      d.tasks.forEach(t => prog[d.day].tasks[t.id] = false);
      d.sideQuests.forEach(sq => prog[d.day].sideQuests[sq.id] = false);
      SUBTES.forEach(s => prog[d.day].understanding[s.id] = 0);
    });
    LS.set("progress", prog);
  }
  return prog;
}

// ─── TYPOGRAPHY & STYLES ──────────────────────────────────
const F = {
  display: "'Cormorant Garamond', 'Georgia', serif",
  body: "'Outfit', 'Helvetica Neue', sans-serif",
};

const S = {
  app: { background: C.ink, color: C.cream, minHeight: "100vh", width: "100%", fontFamily: F.body, position: "relative", overflowX: "hidden" },
  page: { padding: "clamp(14px,2vw,28px) clamp(12px,2.5vw,36px) clamp(32px,4vw,56px)", width: "100%", maxWidth: "100%", boxSizing: "border-box" },
  card: { ...GLASS.card },
  cardSm: { ...GLASS.cardSm },
  // Typography
  h1: { fontFamily: F.display, fontWeight: 600, fontSize: "clamp(20px,2.8vw,32px)", margin: "0 0 4px", letterSpacing: "-0.3px", lineHeight: 1.1, color: C.cream },
  h2: { fontFamily: F.display, fontWeight: 600, fontSize: "clamp(17px,2vw,22px)", margin: "0 0 16px", letterSpacing: "-0.2px", color: C.cream },
  h3: { fontFamily: F.body, fontWeight: 600, fontSize: "clamp(12px,1.2vw,14px)", margin: "0 0 12px", letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted },
  label: { fontFamily: F.body, fontWeight: 500, fontSize: "clamp(9px,0.9vw,11px)", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted },
  muted: { color: C.muted, fontSize: "clamp(11px,1.1vw,13px)", fontFamily: F.body },
  // Buttons
  btn: (accent = C.gold) => ({
    background: accent === C.gold ? `linear-gradient(135deg, ${C.gold}, #E8C98A)` : accent,
    color: C.ink, border: "none", borderRadius: "clamp(8px,1vw,10px)", padding: "clamp(9px,1vw,11px) clamp(18px,2vw,24px)",
    fontSize: "clamp(12px,1.1vw,13px)", fontWeight: 600, cursor: "pointer", fontFamily: F.body,
    transition: "all .2s", letterSpacing: "0.04em",
    boxShadow: `0 4px 20px rgba(200,169,110,0.3)`,
  }),
  btnGhost: {
    background: C.g1, color: C.cream,
    border: "1px solid rgba(240,238,233,0.12)",
    borderRadius: "clamp(8px,1vw,10px)", padding: "clamp(7px,0.8vw,10px) clamp(12px,1.4vw,18px)", fontSize: "clamp(11px,1.1vw,13px)",
    cursor: "pointer", fontFamily: F.body, transition: "all .2s",
    backdropFilter: "blur(12px)",
  },
  btnGold: {
    background: "transparent", color: C.gold,
    border: `1px solid ${C.goldLine}`,
    borderRadius: "clamp(8px,1vw,10px)", padding: "clamp(6px,0.7vw,8px) clamp(10px,1.2vw,16px)", fontSize: "clamp(10px,1vw,12px)",
    cursor: "pointer", fontFamily: F.body, transition: "all .2s",
    backdropFilter: "blur(8px)",
  },
  input: {
    background: "rgba(240,238,233,0.04)",
    border: "1px solid rgba(240,238,233,0.1)",
    borderRadius: "clamp(8px,1vw,10px)", padding: "clamp(8px,0.9vw,10px) clamp(10px,1.2vw,14px)",
    color: C.cream, fontSize: "clamp(12px,1.1vw,14px)", fontFamily: F.body,
    outline: "none", width: "100%",
    backdropFilter: "blur(8px)",
    transition: "border-color .2s",
    boxSizing: "border-box",
  },
  badge: (color = C.gold) => ({
    display: "inline-block", padding: "clamp(2px,0.3vw,3px) clamp(7px,0.9vw,10px)", borderRadius: 20,
    fontSize: "clamp(9px,0.9vw,11px)", fontWeight: 600, fontFamily: F.body, letterSpacing: "0.04em",
    background: color + "18", color: color,
    border: `1px solid ${color}35`,
  }),
  tag: (color = C.gold) => ({
    display: "inline-block", padding: "2px 7px", borderRadius: 5,
    fontSize: "clamp(8px,0.8vw,10px)", fontWeight: 600, fontFamily: F.body, letterSpacing: "0.05em",
    background: color + "22", color: color, marginRight: 5,
  }),
  // Layout — fluid gaps
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(10px,1.5vw,20px)" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "clamp(8px,1.2vw,16px)" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "clamp(8px,1.2vw,16px)" },
  flex: { display: "flex", alignItems: "center", gap: 10 },
  flexBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
};

const TAG_COLORS = {
  TO: C.down, DRILL: C.warn, VIDEO: C.gold, ANALYSIS: C.gold,
  NOTES: C.up, REVIEW: C.up, BONUS: C.gold, BACKUP: C.muted,
  UPLOAD: C.gold, MANUAL: C.muted, PLAN: C.gold, READ: C.up,
  VOCAB: C.up, LATIHAN: C.warn, PREP: C.gold, REST: C.up,
  MINDSET: C.muted, MILESTONE: C.gold, KONDISI: C.down, CHECK: C.warn,
};

// ─── BACKGROUND STORE ────────────────────────────────────
const BG = {
  get: () => LS.get("bg_url", null),
  set: (url) => LS.set("bg_url", url),
};

// ─── NETWORK CANVAS — animated gold nodes background ─────
function NetworkCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    let W, H, particles = [], animId;
    function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
    function init() {
      particles = [];
      for (let i = 0; i < 40; i++) particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      });
    }
    function draw() {
      c.clearRect(0, 0, W, H);
      particles.forEach(n => {
        n.vx *= 0.995; n.vy *= 0.995; n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = W; if (n.x > W) n.x = 0;
        if (n.y < 0) n.y = H; if (n.y > H) n.y = 0;
      });
      particles.forEach((a, i) => particles.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 150) {
          c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y);
          c.strokeStyle = `rgba(200,169,110,${(1 - d / 150) * 0.06})`;
          c.lineWidth = 0.5; c.stroke();
        }
      }));
      particles.forEach(n => {
        c.beginPath(); c.arc(n.x, n.y, 1, 0, Math.PI * 2);
        c.fillStyle = "rgba(200,169,110,0.12)"; c.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    window.addEventListener("resize", () => { resize(); init(); });
    return () => { cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.16 }} />;
}

// ─── CUSTOM CURSOR — dot + lagging ring ──────────────────
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    const onOver = (e) => {
      const t = e.target;
      if (t.closest && (t.closest("button") || t.closest("a") || t.closest("[data-clickable]") || t.closest("input") || t.closest("textarea") || t.closest("select"))) {
        if (ringRef.current) { ringRef.current.style.width = "36px"; ringRef.current.style.height = "36px"; ringRef.current.style.borderColor = C.gold; }
      }
    };
    const onOut = () => {
      if (ringRef.current) { ringRef.current.style.width = "26px"; ringRef.current.style.height = "26px"; ringRef.current.style.borderColor = "rgba(240,238,233,0.35)"; }
    };
    function tick() {
      if (dotRef.current) { dotRef.current.style.transform = `translate(${mx - 3}px, ${my - 3}px)`; }
      rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
      if (ringRef.current) { ringRef.current.style.transform = `translate(${rx - 13}px, ${ry - 13}px)`; }
      requestAnimationFrame(tick);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    tick();
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseover", onOver); document.removeEventListener("mouseout", onOut); };
  }, []);
  // Hide on touch devices
  if (typeof window !== "undefined" && "ontouchstart" in window) return null;
  return (
    <>
      <div ref={dotRef} style={{
        position: "fixed", top: 0, left: 0, width: 6, height: 6, borderRadius: "50%",
        background: "rgba(240,238,233,0.9)", pointerEvents: "none", zIndex: 9999,
        mixBlendMode: "difference", transition: "width 0.1s, height 0.1s",
      }} />
      <div ref={ringRef} style={{
        position: "fixed", top: 0, left: 0, width: 26, height: 26, borderRadius: "50%",
        border: "1.5px solid rgba(240,238,233,0.35)", pointerEvents: "none", zIndex: 9998,
        transition: "width 0.2s, height 0.2s, border-color 0.2s",
      }} />
    </>
  );
}

// ─── GLOBAL BACKGROUND LAYER ─────────────────────────────
function BackgroundLayer({ bg }) {
  if (!bg) return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      background: `radial-gradient(ellipse at 15% 60%, rgba(200,169,110,0.09) 0%, transparent 55%),
                   radial-gradient(ellipse at 85% 15%, rgba(200,169,110,0.06) 0%, transparent 50%),
                   radial-gradient(ellipse at 50% 100%, rgba(200,169,110,0.04) 0%, transparent 40%),
                   ${C.ink}`,
    }}>
      {/* Subtle grain overlay */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.025, pointerEvents: "none" }}>
        <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: `url(${bg})`, backgroundSize: "cover",
      backgroundPosition: "center", backgroundAttachment: "fixed",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(12,12,14,0.78)", backdropFilter: "brightness(0.7) saturate(0.4)" }} />
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────
function Navbar({ page, setPage, onBgUpload, progress }) {
  const nav = [
    { id: "dashboard", label: "Dashboard" },
    { id: "focus", label: "Focus" },
    { id: "path", label: "26 Hari" },
    { id: "report", label: "Report" },
    { id: "schedule", label: "Jadwal" },
    { id: "method", label: "Metode" },
  ];
  const fileRef = useRef(null);
  const [showSources, setShowSources] = useState(false);
  const curDay = getCurrentDay();
  const totalDone = progress ? Object.values(progress).reduce((a, p) => a + Object.values(p.tasks || {}).filter(Boolean).length, 0) : 0;
  const totalAll = CURRICULUM.reduce((a, c) => a + c.tasks.length, 0);
  const pct = Math.round((totalDone / totalAll) * 100);
  const userName = LS.get("profile_name", "Pex");

  const handleBg = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { BG.set(ev.target.result); onBgUpload(ev.target.result); };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {showSources && <SourceLinksModal onClose={() => setShowSources(false)} />}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(12,12,14,0.82)",
        backdropFilter: "blur(28px) saturate(170%)",
        WebkitBackdropFilter: "blur(28px) saturate(170%)",
        borderBottom: "1px solid rgba(240,238,233,0.07)",
      }}>
        <div className="resp-nav" style={{
          width: "100%", margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          height: "clamp(52px,6vw,60px)", padding: "0 clamp(12px,2.5vw,36px)",
          minWidth: 0,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flexShrink: 0 }}
            onClick={() => setPage("landing")}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: `linear-gradient(135deg,${C.gold} 0%,#E8CA84 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px rgba(200,169,110,0.4)`
            }}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: C.ink }}>U</span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 17, color: C.cream, lineHeight: 1.1, letterSpacing: "0.01em" }}>UTBK_26</div>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>IPB 2026</div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 1, minWidth: 0, overflow: "hidden" }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                background: page === n.id ? C.goldDim : "transparent",
                color: page === n.id ? C.gold : C.muted,
                border: `1px solid ${page === n.id ? C.goldLine : "transparent"}`,
                padding: "6px 16px", borderRadius: 10, cursor: "pointer",
                fontSize: 13, fontWeight: page === n.id ? 600 : 400,
                fontFamily: F.body, transition: "all .15s",
                letterSpacing: "0.01em",
              }}
                onMouseEnter={e => { if (page !== n.id) { e.currentTarget.style.color = C.cream; e.currentTarget.style.background = "rgba(240,238,233,0.05)"; } }}
                onMouseLeave={e => { if (page !== n.id) { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "transparent"; } }}>
                {n.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0 }}>
            {/* Sources */}
            <button onClick={() => setShowSources(true)}
              style={{ ...S.btnGold, fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke={C.gold} strokeWidth="1.2" />
                <line x1="6" y1="3" x2="6" y2="9" stroke={C.gold} strokeWidth="1.2" />
                <line x1="3" y1="6" x2="9" y2="6" stroke={C.gold} strokeWidth="1.2" />
              </svg>
              <span className="nav-label">Sumber</span>
            </button>

            {/* BG Upload */}
            <button onClick={() => fileRef.current?.click()}
              style={{ ...S.btnGhost, fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 5, color: C.muted }}
              title="Upload background">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="3" width="10" height="7" rx="1.5" stroke={C.muted} strokeWidth="1.2" />
                <path d="M6 1v5M4 3l2-2 2 2" stroke={C.muted} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="nav-label">BG</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBg} />

            {/* Profile pill */}
            <div onClick={() => setPage("profile")} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "6px 14px 6px 8px",
              borderRadius: 30, background: "rgba(240,238,233,0.04)",
              border: "1px solid rgba(240,238,233,0.1)",
              cursor: "pointer", transition: "all .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.goldDim; e.currentTarget.style.borderColor = C.goldLine; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(240,238,233,0.04)"; e.currentTarget.style.borderColor = "rgba(240,238,233,0.1)"; }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: `linear-gradient(135deg,${C.gold},#E8CA84)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 2px 8px rgba(200,169,110,0.4)`, flexShrink: 0
              }}>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: C.ink }}>{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ lineHeight: 1.2 }} className="nav-label">
                <div style={{ fontSize: 13, fontWeight: 600, color: C.cream, fontFamily: F.body }}>{userName}</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.04em" }}>D{curDay} · {pct}%</div>
              </div>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: C.up,
                boxShadow: `0 0 8px ${C.up}`, marginLeft: 2
              }} />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

function StatCard({ label, value, color = C.gold, sub, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...S.cardSm, textAlign: "center", position: "relative", overflow: "hidden",
        transition: "transform .25s cubic-bezier(0.34,1.56,0.64,1), box-shadow .25s",
        transform: hov ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hov ? `0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px ${color}35` : GLASS.cardSm.boxShadow,
        cursor: onClick ? "pointer" : "default",
      }}>
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 1,
        background: `linear-gradient(90deg,transparent,${color},transparent)`
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: hov ? 40 : 0, overflow: "hidden", transition: "height .3s",
        background: `radial-gradient(ellipse at bottom, ${color}12, transparent)`, pointerEvents: "none"
      }} />
      <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 600, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 5, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct, color = C.gold, height = 5, showLabel = false }) {
  const safe = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ position: "relative" }}>
      <div style={{ height, background: "rgba(240,238,233,0.06)", borderRadius: height, overflow: "hidden", position: "relative" }}>
        <div style={{
          width: `${safe}%`, height: "100%", background: `linear-gradient(90deg,${color}88,${color})`,
          borderRadius: height, transition: "width .55s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: safe > 0 ? `0 0 10px ${color}44` : "none"
        }} />
        {/* Track line at current position */}
        {safe > 0 && safe < 100 && (
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: `${safe}%`, width: 2,
            background: color, opacity: 0.9, boxShadow: `0 0 6px ${color}`, transform: "translateX(-1px)"
          }} />
        )}
      </div>
      {showLabel && <span style={{ fontSize: 10, color: C.muted, position: "absolute", right: 0, top: -18 }}>{Math.round(safe)}%</span>}
    </div>
  );
}

// Slider with animated track line
function SliderWithTrack({ value, onChange, min = 0, max = 100, color = C.gold, label, showValue = true }) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  return (
    <div style={{ position: "relative" }}>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          {label && <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>}
          {showValue && <span style={{ fontSize: 12, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{value}{max === 100 ? "%" : ""}</span>}
        </div>
      )}
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        {/* Track background */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: "rgba(240,238,233,0.08)", borderRadius: 4 }}>
          {/* Filled track */}
          <div style={{
            width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${color}66,${color})`, borderRadius: 4,
            transition: "width .1s ease", boxShadow: `0 0 8px ${color}44`
          }} />
          {/* Thumb line */}
          {pct > 0 && pct < 100 && (
            <div style={{
              position: "absolute", top: -4, bottom: -4, left: `${pct}%`, width: 2, background: color,
              boxShadow: `0 0 8px ${color}`, transform: "translateX(-1px)", borderRadius: 2
            }} />
          )}
        </div>
        <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseInt(e.target.value))}
          style={{ position: "absolute", left: 0, right: 0, width: "100%", margin: 0, opacity: 0, cursor: "pointer", height: 20, zIndex: 2 }} />
      </div>
    </div>
  );
}

function SubtesBadge({ id, small }) {
  const s = SUBTES.find(x => x.id === id);
  if (!s) return null;
  return <span style={small ? S.tag(C.gold) : S.badge(C.gold)}>{s.short}</span>;
}

function PhaseBar() {
  const cur = getCurrentDay();
  return (
    <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", height: 32, marginBottom: 20, border: "1px solid rgba(240,238,233,0.06)" }}>
      {PHASES.map(p => {
        const w = (p.days.length / 26) * 100;
        const active = p.days.includes(cur);
        return (
          <div key={p.name} style={{
            width: `${w}%`,
            background: active ? `${p.color}28` : `${p.color}0a`,
            borderRight: "1px solid rgba(240,238,233,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", transition: "background .3s",
          }}>
            <span style={{ fontSize: 9, fontWeight: 600, fontFamily: F.body, letterSpacing: "0.07em", color: active ? p.color : C.faint, textTransform: "uppercase" }}>{p.label.toUpperCase()}</span>
            {active && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${p.color}, transparent)` }} />}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [UPGRADE] — Task 3A: COUNTDOWN WIDGET
// ═══════════════════════════════════════════════════════════

function CountdownWidget() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const update = () => {
      const diff = new Date("2026-04-21T07:00:00+07:00") - new Date();
      if (diff <= 0) return;
      setT({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
    };
    update(); const id = setInterval(update, 1000); return () => clearInterval(id);
  }, []);
  const urgency = t.days <= 7 ? C.down : t.days <= 14 ? C.warn : C.up;
  return (
    <div style={{
      ...S.cardSm, marginBottom: 16, borderColor: `${urgency}30`,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      boxShadow: `0 6px 20px rgba(0,0,0,0.4), 0 0 20px ${urgency}08, inset 0 1px 0 rgba(240,238,233,0.05)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", paddingRight: 16, marginRight: 8, borderRight: "1px solid rgba(240,238,233,0.08)" }}>UTBK SNBT 2026</div>
        {[["days", "H", 28], ["hours", "J", 20], ["minutes", "M", 18], ["seconds", "D", 16]].map(([k, l, sz], i) => (
          <div key={k} style={{ textAlign: "center", padding: "0 10px", borderLeft: i > 0 ? "1px solid rgba(240,238,233,0.07)" : "none" }}>
            <div style={{ fontFamily: F.display, fontSize: sz, fontWeight: 600, color: k === "days" ? urgency : C.cream, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {String(t[k]).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 8, color: C.faint, marginTop: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: F.display, fontSize: 11, color: urgency, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {t.days <= 7 ? "⚠ Final Push" : t.days <= 14 ? "Intensifikasi" : "On Track"}
        </div>
        <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>Target 700+ · IPB</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [UPGRADE] — Task 3B: SUBTEST WEAKNESS DETECTOR
// ═══════════════════════════════════════════════════════════

function WeaknessDetector() {
  const toHistory = LS.get("to_history", []);
  if (toHistory.length === 0) return null;
  const avgs = {};
  SUBTES.forEach(s => {
    const vals = toHistory.map(t => t.scores[s.id] || 0).filter(v => v > 0);
    avgs[s.id] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  });
  const sorted = [...SUBTES].sort((a, b) => (avgs[a.id] / a.target) - (avgs[b.id] / b.target));
  const weakest = sorted.slice(0, 2);
  const strongest = sorted[sorted.length - 1];
  return (
    <div style={S.card}>
      <div style={{ ...S.flexBetween, marginBottom: 16 }}>
        <div style={S.h2}>Analisis Subtes</div>
        <span style={{ fontSize: 11, color: C.muted }}>{toHistory.length} TO</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {weakest.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: `${C.down}0a`, border: `1px solid ${C.down}25` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.down, width: 36 }}>{s.short}</span>
            <div style={{ flex: 1 }}><ProgressBar pct={Math.min(100, (avgs[s.id] / s.target) * 100)} color={C.down} height={4} /></div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.cream, width: 32, textAlign: "right" }}>{avgs[s.id]}</span>
            <span style={{ fontSize: 9, color: C.down, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", width: 54 }}>Prioritas</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: `${C.gold}0a`, border: `1px solid ${C.gold}25` }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.gold, width: 36 }}>{strongest.short}</span>
          <div style={{ flex: 1 }}><ProgressBar pct={Math.min(100, (avgs[strongest.id] / strongest.target) * 100)} color={C.gold} height={4} /></div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.cream, width: 32, textAlign: "right" }}>{avgs[strongest.id]}</span>
          <span style={{ fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", width: 54 }}>Andalan</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [UPGRADE] — Task 3E: TO TREND LINE (pure SVG sparkline)
// ═══════════════════════════════════════════════════════════

function TOTrendLine({ toHistory }) {
  if (toHistory.length < 2) return null;
  const last5 = toHistory.slice(-5);
  const vals = last5.map(t => t.total);
  const min = Math.min(...vals) - 30;
  const max = Math.max(...vals) + 30;
  const W = 220, H = 52;

  const pts = vals.map((v, i) => {
    const x = vals.length === 1 ? W / 2 : (i / (vals.length - 1)) * (W - 20) + 10;
    const y = H - 10 - ((v - min) / Math.max(1, max - min)) * (H - 20);
    return [x, y];
  });

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const trend = vals[vals.length - 1] >= vals[0];
  const trendColor = trend ? C.gold : C.down;

  return (
    <div style={{ marginTop: 12, padding: "10px 0 0" }}>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 6 }}>TREN {last5.length} TO TERAKHIR</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 52 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathD + ` L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`} fill="url(#trendFill)" />
        <path d={pathD} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill={trendColor} />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: C.muted }}>{vals[0]}</span>
        <span style={{ fontSize: 10, color: trendColor }}>{trend ? "↗ naik" : "↘ turun"}</span>
        <span style={{ fontSize: 10, color: trendColor }}>{vals[vals.length - 1]}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [UPGRADE] — Task 4E: GLASS TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════════

function Toast({ message, color = C.gold, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: "clamp(16px,3vh,36px)", right: "clamp(12px,3vw,36px)", zIndex: 9000,
      background: "rgba(14,14,16,0.94)",
      backdropFilter: "blur(28px) saturate(180%)",
      WebkitBackdropFilter: "blur(28px) saturate(180%)",
      borderRadius: "clamp(10px,1.2vw,14px)", padding: "clamp(10px,1.2vw,14px) clamp(14px,1.8vw,20px)",
      border: `1px solid ${color}45`,
      boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(240,238,233,0.04) inset`,
      color: C.cream, fontSize: "clamp(11px,1.1vw,13px)", fontFamily: F.body,
      animation: "slideInToast 0.4s cubic-bezier(0.16,1,0.3,1)",
      minWidth: "clamp(220px,40vw,260px)", maxWidth: "clamp(260px,85vw,380px)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%", background: color,
        boxShadow: `0 0 10px ${color}`, flexShrink: 0
      }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SPIDER / RADAR CHART
// ═══════════════════════════════════════════════════════════

// ─── SOURCE LINKS MODAL ─────────────────────────────────
const SOURCE_CATEGORIES = {
  VIDEO: { label: "Video Materi", icon: "▶", color: C.gold },
  DRILL: { label: "Latihan Soal", icon: "⊕", color: C.up },
  TO: { label: "Tryout", icon: "◎", color: C.down },
  READ: { label: "Artikel / Panduan", icon: "◇", color: C.cream },
  MANTAPPU: { label: "Mantappu Academy", icon: "★", color: C.gold },
  BONUS: { label: "Bonus", icon: "⊞", color: C.warn },
  BACKUP: { label: "Backup", icon: "◻", color: C.muted },
  UPLOAD: { label: "Platform", icon: "↑", color: C.gold },
  default: { label: "Resource", icon: "→", color: C.muted },
};

// Pre-built master source list from all curriculum links
const MASTER_SOURCES = [
  // ═══ Z ACADEMY (per subtes) ═══
  { tag: "VIDEO", label: "Z Academy — PU (Penalaran Umum)", url: "https://docs.google.com/spreadsheets/u/0/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=1212141722", subtes: ["PU"], days: [4, 9, 17] },
  { tag: "VIDEO", label: "Z Academy — PK/PM (Kuantitatif & Matematika)", url: "https://docs.google.com/spreadsheets/u/0/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=581220731", subtes: ["PK", "PM"], days: [3, 15] },
  { tag: "VIDEO", label: "Z Academy — PPU/PBM/LBI", url: "https://docs.google.com/spreadsheets/u/0/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=1573664648", subtes: ["PPU", "PBM", "LBI"], days: [5, 6, 11, 12, 13] },
  { tag: "VIDEO", label: "Z Academy — LBE (Literasi Bahasa Inggris)", url: "https://docs.google.com/spreadsheets/u/0/d/1H-by3Dix3nfKyQe6o40tP1ntRa3mHf8YOvj0am8foYo/htmlview#gid=656432209", subtes: ["LBE"], days: [7, 8] },

  // ═══ MANTAPPU ACADEMY ═══
  { tag: "MANTAPPU", label: "Mantappu AmbiSNBT — Rekaman Kelas", url: "https://docs.google.com/document/d/1fh5kvGtURv2OduN_B5RovCsWLAMESuGXz2de5ppx0mU/edit?tab=t.0", subtes: ["PK", "PM", "ALL"], days: [2, 3, 8, 15] },
  { tag: "MANTAPPU", label: "Mantappu NgejarSNBT — Rekaman Kelas", url: "https://docs.google.com/document/d/1DZdGPqb_H5gO9-iG_bXCJs2AOypwW-GDDXVaQYzD--Q/edit?tab=t.0", subtes: ["ALL"], days: [2, 3, 4, 5, 6, 7, 8] },
  // AmbiSNBT individual sessions
  { tag: "MANTAPPU", label: "AmbiSNBT P01 (2 Mar)", url: "https://youtu.be/Een2ppKUIBc", subtes: ["PK", "PM"], days: [2] },
  { tag: "MANTAPPU", label: "AmbiSNBT P02 (4 Mar)", url: "https://youtu.be/on9TKajL36o", subtes: ["PK", "PM"], days: [2] },
  { tag: "MANTAPPU", label: "AmbiSNBT P03 (6 Mar)", url: "https://youtu.be/xONsorhxhsc", subtes: ["PK", "PM"], days: [2] },
  { tag: "MANTAPPU", label: "AmbiSNBT P04 (9 Mar)", url: "https://youtu.be/Dmk-IeJVNX0?si=oZz4qn4UM-VueYiD", subtes: ["PK", "PM"], days: [2] },
  { tag: "MANTAPPU", label: "AmbiSNBT P05 (11 Mar)", url: "https://youtu.be/2APh2oHcGik", subtes: ["PK", "PM"], days: [2, 3] },
  { tag: "MANTAPPU", label: "AmbiSNBT P06 (13 Mar)", url: "https://youtu.be/FJI6ZgiIslo", subtes: ["PK", "PM"], days: [2, 3] },
  { tag: "MANTAPPU", label: "AmbiSNBT P07 (16 Mar)", url: "https://youtu.be/2qeDSfIDX5U", subtes: ["PK", "PM"], days: [3] },
  { tag: "MANTAPPU", label: "AmbiSNBT P08 (18 Mar)", url: "https://youtu.be/McJag-kWDjo", subtes: ["PK", "PM"], days: [3] },
  { tag: "MANTAPPU", label: "AmbiSNBT P09 (20 Mar)", url: "https://youtu.be/VVg9WHL99yk?si=rDFglo_MOQPf-Pbq", subtes: ["PK", "PM"], days: [3] },
  { tag: "MANTAPPU", label: "AmbiSNBT P10 (23 Mar)", url: "https://youtu.be/FPPdUY0Evq4", subtes: ["PK", "PM"], days: [3] },
  { tag: "MANTAPPU", label: "AmbiSNBT P11 (25 Mar)", url: "https://youtu.be/WRIYvh38hcQ", subtes: ["PK", "PM"], days: [3] },
  // NgejarSNBT individual sessions
  { tag: "MANTAPPU", label: "NgejarSNBT P01 (2 Feb)", url: "https://youtu.be/yT-Ip4HFXAU", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P02 (4 Feb)", url: "https://youtu.be/esI-uS2SG0M", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P03 (6 Feb)", url: "https://youtu.be/dOi1g11pNls", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P03 Materi Tambahan", url: "https://youtu.be/FmQXmulCbn0", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P04 (9 Feb)", url: "https://youtu.be/D3opvmjxkTI", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P05 (11 Feb)", url: "https://youtu.be/UDTk-gVoIYQ", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P05 Materi Tambahan", url: "https://youtu.be/EmrvhUKvm6Y", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P06 (13 Feb)", url: "https://youtu.be/_qq4lGJ3YDk", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P01 (2 Feb)", url: "https://youtu.be/yT-Ip4HFXAU", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P02 (4 Feb)", url: "https://youtu.be/esI-uS2SG0M", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P03 (6 Feb)", url: "https://youtu.be/dOi1g11pNls", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P03 Materi Tambahan", url: "https://youtu.be/FmQXmulCbn0", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P04 (9 Feb)", url: "https://youtu.be/D3opvmjxkTI", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P05 (11 Feb)", url: "https://youtu.be/UDTk-gVoIYQ", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P05 Materi Tambahan", url: "https://youtu.be/EmrvhUKvm6Y", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P06 (13 Feb)", url: "https://youtu.be/_qq4lGJ3YDk", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P07 (16 Feb)", url: "https://youtu.be/IE00MTuwQSc", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P08 (18 Feb)", url: "https://youtu.be/dAdS5ScL6ds", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P09 (20 Feb)", url: "https://youtu.be/_ngZ9bdf3G8", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P10 (23 Feb)", url: "https://youtu.be/V5twnG03sWg", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P11 (25 Feb)", url: "https://youtu.be/gezuGNnadDg", subtes: ["ALL"], days: [] },
  { tag: "MANTAPPU", label: "NgejarSNBT P12 (27 Feb)", url: "https://youtu.be/Qap41szpSqQ?si=Zvz_VuQQWQT4RZr7", subtes: ["ALL"], days: [] },

  // ═══ ZENIUS ═══
  { tag: "VIDEO", label: "Zenius YouTube — PU/PPU/PBM", url: "https://www.youtube.com/@ZeniusEducation", subtes: ["PU", "PPU", "PBM"], days: [4, 5, 11, 17, 20] },
  { tag: "VIDEO", label: "Trik PPU & PBM — Pak Franzz", url: "https://www.youtube.com/watch?v=drYws1LCkjc", subtes: ["PPU", "PBM"], days: [5, 6] },
  { tag: "VIDEO", label: "Latsoal UTBK PPU PBM Part 1", url: "https://www.youtube.com/watch?v=olDMv7a-vAg", subtes: ["PPU", "PBM"], days: [6] },
  { tag: "VIDEO", label: "Zenius: PBM Membaca Teks", url: "https://www.youtube.com/watch?v=qOVHa2doPrs", subtes: ["PBM"], days: [6] },

  // ═══ DRILL / LATIHAN SOAL ═══
  { tag: "DRILL", label: "aimasukptn.com — Latihan Soal", url: "https://aimasukptn.com/practice", subtes: ["PU", "PPU", "PBM", "LBI", "LBE", "PK", "PM"], days: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25] },
  { tag: "DRILL", label: "aimasukptn.com — Latsol SNBT Gratis", url: "https://aimasukptn.com/latsol-snbt-gratis", subtes: ["LBE", "PU", "PK", "PM"], days: [9, 16, 24, 25] },

  // ═══ TRYOUT PLATFORMS ═══
  { tag: "TO", label: "SainsIn — Tryout Platform", url: "https://sainsin.com", subtes: ["ALL"], days: [1, 5, 13, 23] },
  { tag: "TO", label: "Ruangguru / Ruanguji", url: "https://www.ruangguru.com/ruanguji", subtes: ["ALL"], days: [10, 21] },
  { tag: "TO", label: "SIAPPTN — Simulasi UTBK", url: "https://siapptn.com", subtes: ["ALL"], days: [10, 14, 23] },
  { tag: "TO", label: "tryout.id", url: "https://tryout.id", subtes: ["ALL"], days: [18] },
  { tag: "TO", label: "snbt.id", url: "https://snbt.id", subtes: ["ALL"], days: [18] },
  { tag: "TO", label: "aimasukptn.com — Latihan Soal SNBT", url: "https://aimasukptn.com/latihan-soal-snbt", subtes: ["ALL"], days: [19] },
  { tag: "TO", label: "SNPMB Official — Simulasi", url: "https://snpmb.id/simulasi", subtes: ["ALL"], days: [1] },

  // ═══ ARTIKEL / PANDUAN ═══
  { tag: "READ", label: "Strategi PPU di ujian SNBT 2026", url: "https://aimasukptn.com/blog/strategi-saat-ujian-snbt-2026", subtes: ["PPU"], days: [5] },
  { tag: "READ", label: "Subtes SNBT paling cepat naik — Teknik SRAS", url: "https://aimasukptn.com/blog/subtes-snbt-paling-cepat-naik-skornya", subtes: ["PBM"], days: [6, 12] },
];

function SourceLinksModal({ onClose, filterSubtes, filterDay }) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  const filtered = MASTER_SOURCES.filter(s => {
    if (activeTab !== "all" && s.tag !== activeTab) return false;
    if (filterSubtes && !s.subtes.includes(filterSubtes) && !s.subtes.includes("ALL")) return false;
    if (filterDay && !s.days.includes(filterDay)) return false;
    if (searchQ && !s.label.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const tabs = ["all", "VIDEO", "DRILL", "TO", "READ", "MANTAPPU"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(8,8,10,0.88)",
      backdropFilter: "blur(16px) saturate(140%)",
      WebkitBackdropFilter: "blur(16px) saturate(140%)",
      padding: "clamp(12px,3vw,20px)",
      overflowY: "auto",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        ...GLASS.modal,
        width: "min(100%, clamp(300px,90vw,760px))",
        maxHeight: "min(88vh,860px)",
        display: "flex", flexDirection: "column", animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(240,238,233,0.08)" }}>
          <div>
            <h2 style={{ ...S.h2, margin: 0, marginBottom: 4 }}>Sumber Belajar</h2>
            <div style={{ fontSize: 12, color: C.muted }}>{filtered.length} resource tersedia</div>
          </div>
          <button onClick={onClose} style={{ ...S.btnGhost, padding: "6px 12px", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {/* Search */}
        <div style={{ padding: "12px 24px 0" }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Cari resource..."
            style={{ ...S.input, fontSize: 13 }} />
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "12px 24px 0", flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              background: activeTab === t ? C.goldDim : "transparent", color: activeTab === t ? C.gold : C.muted,
              border: `1px solid ${activeTab === t ? C.goldLine : "rgba(240,238,233,0.07)"}`,
              borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: activeTab === t ? 600 : 400,
              cursor: "pointer", fontFamily: F.body, letterSpacing: "0.04em", transition: "all .15s"
            }}>
              {t === "all" ? "Semua" : (SOURCE_CATEGORIES[t]?.label || t)}
            </button>
          ))}
        </div>
        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: C.muted, padding: "40px 0", fontSize: 13 }}>Tidak ada resource ditemukan.</div>
          ) : filtered.map((s, i) => {
            const cat = SOURCE_CATEGORIES[s.tag] || SOURCE_CATEGORIES.default;
            return (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12,
                  background: "rgba(240,238,233,0.03)", border: "1px solid rgba(240,238,233,0.07)",
                  textDecoration: "none", transition: "all .2s", cursor: "pointer"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.goldDim; e.currentTarget.style.borderColor = C.goldLine; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(240,238,233,0.03)"; e.currentTarget.style.borderColor = "rgba(240,238,233,0.07)"; }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: cat.color + "18", border: `1px solid ${cat.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: cat.color, flexShrink: 0
                }}>
                  {cat.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.cream, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9, color: cat.color, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", background: cat.color + "15", padding: "1px 6px", borderRadius: 4 }}>{cat.label}</span>
                    {s.subtes.slice(0, 4).map(st => (
                      <span key={st} style={{ fontSize: 9, color: C.muted, background: "rgba(240,238,233,0.06)", padding: "1px 5px", borderRadius: 4 }}>{st}</span>
                    ))}
                    {s.days.length > 0 && <span style={{ fontSize: 9, color: C.faint }}>D{s.days.slice(0, 5).join(",")}{s.days.length > 5 ? "..." : ""}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 18, color: C.gold, opacity: 0.6, flexShrink: 0 }}>↗</div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SpiderChart({ scores, prevScores }) {
  const data = SUBTES.map(s => ({
    subject: s.short,
    current: scores ? Math.min(100, Math.round((scores[s.id] || 0) / s.target * 100)) : 0,
    target: 100,
    prev: prevScores ? Math.min(100, Math.round((prevScores[s.id] || 0) / s.target * 100)) : 0,
  }));
  const avg = data.reduce((a, d) => a + d.current, 0) / 7;
  return (
    <div style={{ position: "relative", padding: "4px", borderRadius: 12, boxShadow: avg > 70 ? `0 0 24px ${C.gold}20` : "none", transition: "box-shadow 0.5s" }}>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
          <PolarGrid stroke="rgba(240,238,233,0.07)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: C.muted, fontSize: 11, fontFamily: F.body }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Target" dataKey="target" stroke={C.gold} fill="none" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.4} />
          {prevScores && <Radar name="Sebelumnya" dataKey="prev" stroke={C.muted} fill="rgba(136,136,128,0.08)" strokeWidth={1} />}
          <Radar name="Saat Ini" dataKey="current" stroke={C.gold} fill="rgba(200,169,110,0.2)" strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: avg >= 76 ? C.up : avg >= 56 ? C.warn : C.down }}>{Math.round(avg)}%</div>
        <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Peluang Lolos</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UPLOAD ANALYZER — [UPGRADE] Task 1: glass modal treatment
// ═══════════════════════════════════════════════════════════

function UploadAnalyzer({ onSave, onClose, onToast }) {
  const [tab, setTab] = useState("manual");
  const [scores, setScores] = useState({});
  const [pasteText, setPasteText] = useState("");
  const [analyzed, setAnalyzed] = useState(null);

  const handleManualChange = (id, val) => setScores(prev => ({ ...prev, [id]: parseInt(val) || 0 }));

  const analyzeScores = (sc) => {
    const total = SUBTES.reduce((a, s) => a + (sc[s.id] || 0), 0);
    const probs = {}; SUBTES.forEach(s => { probs[s.id] = Math.min(100, Math.round(((sc[s.id] || 0) / s.target) * 100)); });
    const avg = Object.values(probs).reduce((a, b) => a + b, 0) / 7;
    const strongest = SUBTES.reduce((a, b) => (probs[a.id] > probs[b.id] ? a : b));
    const weakest = SUBTES.reduce((a, b) => (probs[a.id] < probs[b.id] ? a : b));
    setAnalyzed({ scores: sc, total, probs, avg, strongest, weakest, gap: weakest.target - (sc[weakest.id] || 0) });
  };

  const parsePaste = () => {
    const sc = {}; const text = pasteText.toLowerCase();
    SUBTES.forEach(s => {
      const kws = { PU: ["penalaran umum", "\bpu\b"], PPU: ["pengetahuan", "\bppu\b"], PBM: ["pemahaman bacaan", "\bpbm\b"], LBI: ["literasi bahasa indonesia", "\blbi\b"], LBE: ["literasi bahasa inggris", "\blbe\b"], PK: ["penalaran kuantitatif", "\bpk\b"], PM: ["pengetahuan matematika", "\bpm\b", "matematika"] };
      for (const kw of kws[s.id]) { const m = text.match(new RegExp(kw + "[:\s]*(\d+)", "i")); if (m) { sc[s.id] = parseInt(m[1]); break; } }
    });
    const nums = text.match(/\d+/g)?.map(Number).filter(n => n >= 30 && n <= 200) || [];
    if (Object.keys(sc).length < 3 && nums.length >= 7) SUBTES.forEach((s, i) => { if (!sc[s.id] && nums[i]) sc[s.id] = nums[i]; });
    setScores(sc); analyzeScores(sc);
  };

  const save = () => {
    if (!analyzed) return;
    const hist = LS.get("to_history", []);
    hist.push({ id: `TO${hist.length + 1}`, date: new Date().toISOString().slice(0, 10), scores: analyzed.scores, total: analyzed.total, day: getCurrentDay() });
    LS.set("to_history", hist); LS.set("latest_scores", analyzed.scores);
    onSave && onSave(analyzed); onToast && onToast("Tercatat. Radar diperbarui.");
  };

  return (
    <div style={{ ...S.card, ...GLASS.modal, borderColor: `${C.gold}30`, animation: "modalIn 0.15s cubic-bezier(0.16,1,0.3,1)", marginTop: 0 }}>
      <div style={S.flexBetween}>
        <h3 style={{ fontFamily: F.body, fontWeight: 600, fontSize: 14, color: C.cream }}>Input Hasil TO</h3>
        {onClose && <button onClick={onClose} style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 12 }}>✕</button>}
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[["manual", "Input Manual"], ["paste", "Paste Teks"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...S.btnGhost, background: tab === id ? C.goldDim : "transparent", color: tab === id ? C.gold : C.muted, fontSize: 12, padding: "6px 14px", borderColor: tab === id ? C.goldLine : "rgba(240,238,233,0.07)" }}>{label}</button>
        ))}
      </div>
      {tab === "manual" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8 }}>
            {SUBTES.map(s => (
              <div key={s.id}>
                <label style={{ fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.04em" }}>{s.short}</label>
                <input type="number" min="0" max="200" value={scores[s.id] || ""} onChange={e => handleManualChange(s.id, e.target.value)}
                  placeholder={`Target ${s.target}`} style={{ ...S.input, marginTop: 4 }} />
              </div>
            ))}
          </div>
          <button onClick={() => analyzeScores(scores)} style={{ ...S.btn(), marginTop: 12, width: "100%" }}>Analisis Skor</button>
        </div>
      )}
      {tab === "paste" && (
        <div>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste hasil TO... (PU: 85, PPU: 70, dll)" style={{ ...S.input, height: 100, resize: "vertical" }} />
          <button onClick={parsePaste} style={{ ...S.btn(), marginTop: 8, width: "100%" }}>Parse & Analisis</button>
        </div>
      )}
      {analyzed && (
        <div style={{ marginTop: 16, padding: 16, background: "rgba(200,169,110,0.06)", borderRadius: 12, border: `1px solid ${C.goldLine}`, animation: "modalIn 0.15s ease" }}>
          <div style={{ ...S.label, marginBottom: 8 }}>Hasil Analisis</div>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, color: analyzed.total >= 700 ? C.up : C.down, margin: "4px 0 12px" }}>
            {analyzed.total} / ~980 {analyzed.total >= 700 ? "— Target tercapai." : "— Gap " + (700 - analyzed.total) + " poin."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, marginBottom: 12 }}>
            <div style={{ color: C.muted }}>Terkuat: <span style={{ color: C.gold, fontWeight: 600 }}>{analyzed.strongest.short}</span> ({analyzed.scores[analyzed.strongest.id]})</div>
            <div style={{ color: C.muted }}>Terlemah: <span style={{ color: C.down, fontWeight: 600 }}>{analyzed.weakest.short}</span> ({analyzed.scores[analyzed.weakest.id] || 0})</div>
            <div style={{ color: C.muted }}>Peluang: <span style={{ fontWeight: 700, color: analyzed.avg >= 76 ? C.up : analyzed.avg >= 56 ? C.warn : C.down }}>{Math.round(analyzed.avg)}%</span></div>
            <div style={{ fontSize: 12, color: C.faint }}>Gap {analyzed.weakest.short}: -{analyzed.gap}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUBTES.map(s => (
              <div key={s.id} style={{ flex: 1, minWidth: 65, textAlign: "center", padding: 7, background: `${C.gold}0a`, borderRadius: 8, border: `1px solid ${C.gold}20` }}>
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 600 }}>{s.short}</div>
                <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: C.cream }}>{analyzed.scores[s.id] || 0}</div>
                <div style={{ fontSize: 9, color: analyzed.probs[s.id] >= 76 ? C.up : analyzed.probs[s.id] >= 56 ? C.warn : C.down }}>{analyzed.probs[s.id]}%</div>
              </div>
            ))}
          </div>
          <button onClick={save} style={{ ...S.btn(C.up), marginTop: 12, width: "100%" }}>Simpan & Update Radar</button>
        </div>
      )}
    </div>
  );
}

// PAGE: LANDING
// ═══════════════════════════════════════════════════════════

function useScrollAnim(threshold = 0.15) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

function FadeIn({ children, delay = 0, y = 24, style = {} }) {
  const [ref, vis] = useScrollAnim();
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? `translateY(0)` : `translateY(${y}px)`,
      transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, ...style
    }}>
      {children}
    </div>
  );
}

function LandingPage({ setPage }) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [hero, setHero] = useState(false);
  const [particles] = useState(() => Array.from({ length: 28 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: Math.random() * 2 + 0.5, d: Math.random() * 20 + 15, delay: Math.random() * 8 })));
  useEffect(() => { setTimeout(() => setHero(true), 100); }, []);
  const onMove = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });

  return (
    <div onMouseMove={onMove} style={{ background: C.ink, position: "relative", overflowX: "hidden" }}>
      {/* Ambient orb */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(900px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(200,169,110,0.08) 0%, transparent 65%)`,
        transition: "background 0.2s ease"
      }} />
      {/* Grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(240,238,233,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(240,238,233,0.02) 1px, transparent 1px)`,
        backgroundSize: "80px 80px"
      }} />
      {/* Floating particles */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, borderRadius: "50%",
            background: C.gold, opacity: 0.18,
            animation: `particleFloat ${p.d}s ease-in-out ${p.delay}s infinite alternate`
          }} />
        ))}
      </div>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, padding: "80px 32px 60px" }}>
        {/* Overline badge */}
        <div style={{
          opacity: hero ? 1 : 0, transform: hero ? "translateY(0)" : "translateY(12px)", transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0ms",
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 24,
          background: C.goldDim, border: `1px solid ${C.goldLine}`, marginBottom: 36
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, animation: "pulseDot 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Program Aktif · 25 Mar – 20 Apr 2026</span>
        </div>

        {/* Main headline — staggered word reveal */}
        <div style={{ textAlign: "center", maxWidth: 800 }}>
          <h1 style={{ fontFamily: F.display, fontSize: "clamp(52px,8vw,96px)", fontWeight: 600, lineHeight: 1.0, margin: 0, letterSpacing: "-1.5px" }}>
            {["26 Hari."].map((word, i) => (
              <span key={i} style={{
                display: "block", color: C.cream,
                opacity: hero ? 1 : 0, transform: hero ? "translateY(0)" : "translateY(32px)",
                transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) ${100 + i * 120}ms, transform 1s cubic-bezier(0.16,1,0.3,1) ${100 + i * 120}ms`
              }}>{word}</span>
            ))}
            <span style={{
              display: "block", color: C.gold,
              opacity: hero ? 1 : 0, transform: hero ? "translateY(0)" : "translateY(32px)",
              transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 220ms, transform 1s cubic-bezier(0.16,1,0.3,1) 220ms",
              background: `linear-gradient(135deg, ${C.gold}, #E8C98A, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundSize: "200% 100%", animation: hero ? "goldShimmer 4s ease-in-out infinite" : undefined
            }}>
              Satu kursi di IPB.
            </span>
          </h1>
          <p style={{
            fontFamily: F.body, fontSize: 18, color: C.muted, lineHeight: 1.7, maxWidth: 480, margin: "24px auto 0",
            opacity: hero ? 1 : 0, transform: hero ? "translateY(0)" : "translateY(20px)", transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 400ms"
          }}>
            Bukan persiapan. Eksekusi sistematis menuju skor 700+.
          </p>
        </div>

        {/* Subtes badges */}
        <div style={{
          display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 36,
          opacity: hero ? 1 : 0, transition: "opacity 0.8s ease 600ms"
        }}>
          {SUBTES.map((s, i) => (
            <span key={s.id} style={{
              ...S.badge(C.gold), fontSize: 12,
              opacity: hero ? 1 : 0, transform: hero ? "scale(1)" : "scale(0.85)",
              transition: `opacity 0.5s ease ${650 + i * 60}ms, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${650 + i * 60}ms`
            }}>
              {s.short}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{
          display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 44,
          opacity: hero ? 1 : 0, transition: "opacity 0.8s ease 850ms"
        }}>
          <button onClick={() => setPage("dashboard")} style={{
            ...S.btn(), fontSize: 15, padding: "14px 40px",
            animation: "btnPulse 3s ease-in-out 2s infinite"
          }}>
            Masuk ke Dashboard
          </button>
          <button onClick={() => setPage("path")} style={{ ...S.btnGhost, fontSize: 15, padding: "14px 30px" }}>
            Lihat Peta 26 Hari →
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 56, marginTop: 80,
          opacity: hero ? 0.7 : 0, transition: "opacity 1.2s ease 1000ms"
        }}>
          {[["26", "Hari"], ["7", "Subtes"], ["700+", "Target Skor"], ["7", "Tryout"]].map(([n, l], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: F.display, fontSize: 34, fontWeight: 600, color: C.gold }}>{n}</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          opacity: hero ? 0.4 : 0, transition: "opacity 1s ease 1500ms"
        }}>
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: `linear-gradient(${C.gold},transparent)`, animation: "scrollLine 1.5s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ── SECTION: 7 Subtes ── */}
      <section style={{ padding: "80px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn delay={0} style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={S.label}>7 Subtes SNBT</div>
          <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, color: C.cream, marginTop: 8 }}>The 7 critical dimensions.</div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
          {SUBTES.map((s, i) => {
            const descs = { PU: "Pattern recognition. Logic systems.", PPU: "Knowledge applied to real contexts.", PBM: "Speed × comprehension accuracy.", LBI: "Precision in language structure.", LBE: "Reading fluency and inference.", PK: "Quantitative reasoning mastery.", PM: "Mathematical foundations. Non-negotiable." };
            return (
              <FadeIn key={s.id} delay={i * 80}>
                <div style={{
                  ...S.cardSm, position: "relative", overflow: "hidden", cursor: "pointer",
                  transition: "transform .3s cubic-bezier(0.34,1.56,0.64,1), box-shadow .3s",
                  borderTop: `2px solid ${C.gold}55`, height: "100%"
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px) scale(1.01)"; e.currentTarget.style.boxShadow = `0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px ${C.gold}35`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right,${C.gold}14,transparent)`, pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.gold}22,transparent)`, pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, color: C.gold }}>{s.short}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{s.name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>{descs[s.id]}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(240,238,233,0.06)" }}>
                    <span style={{ fontSize: 11, color: C.faint }}>Baseline {s.baseline}</span>
                    <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>Target {s.target}</span>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── SECTION: Method strip ── */}
      <section style={{ padding: "80px 32px", borderTop: "1px solid rgba(240,238,233,0.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <FadeIn delay={0} style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={S.label}>Method</div>
            <div style={{ fontFamily: F.display, fontSize: 34, fontWeight: 600, color: C.cream, marginTop: 8 }}>System & Method.</div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { pct: "15%", title: "Content", desc: "Watch at 1.5x. Take structured notes. Move forward." },
              { pct: "15%", title: "Discussion", desc: "Independent thinking has limits. Collaborate." },
              { pct: "70%", title: "Practice", desc: "UTBK tests speed and accuracy — not comprehension." },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div style={{ ...S.cardSm, textAlign: "center" }}>
                  <div style={{ fontFamily: F.display, fontSize: 48, fontWeight: 600, color: C.gold, lineHeight: 1 }}>{item.pct}</div>
                  <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 14, color: C.cream, margin: "8px 0 6px" }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: Manifesto ── */}
      <section style={{ padding: "100px 32px", textAlign: "center", borderTop: "1px solid rgba(240,238,233,0.05)" }}>
        <FadeIn delay={0} style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ width: 32, height: 1, background: C.gold, margin: "0 auto 32px" }} />
          <blockquote style={{ fontFamily: F.display, fontSize: "clamp(20px,3vw,26px)", fontStyle: "italic", color: C.muted, lineHeight: 1.55, marginBottom: 24 }}>
            "You do not rise to the level of your goals. You fall to the level of your systems."
          </blockquote>
          <div style={{ fontSize: 11, color: C.faint, letterSpacing: "0.12em", textTransform: "uppercase" }}>James Clear</div>
          <div style={{ marginTop: 48 }}>
            <button onClick={() => setPage("dashboard")} style={{ ...S.btn(), fontSize: 15, padding: "14px 40px" }}>
              Mulai Sekarang
            </button>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NEW WIDGETS — Fill empty space, boost engagement
// ═══════════════════════════════════════════════════════════

function EnergyWidget() {
  const curDay = getCurrentDay();
  const [energy, setEnergy] = useState(() => LS.get(`energy_d${curDay}`, 0));
  const levels = [
    { val: 1, label: "Rendah", icon: "◇", color: C.down },
    { val: 2, label: "Sedang", icon: "◆", color: C.warn },
    { val: 3, label: "Tinggi", icon: "⚡", color: C.gold },
    { val: 4, label: "Max", icon: "✦", color: C.up },
  ];
  const selectEnergy = (val) => { setEnergy(val); LS.set(`energy_d${curDay}`, val); };
  return (
    <div style={S.card} className="card-hover">
      <div style={{ ...S.label, marginBottom: 10 }}>Energy Level</div>
      <div style={{ display: "flex", gap: 8 }}>
        {levels.map(l => (
          <button key={l.val} onClick={() => selectEnergy(l.val)}
            style={{
              flex: 1, padding: "10px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer",
              background: energy === l.val ? `${l.color}18` : "rgba(240,238,233,0.03)",
              border: `1px solid ${energy === l.val ? `${l.color}40` : "rgba(240,238,233,0.06)"}`,
              transition: "all .25s cubic-bezier(0.34,1.56,0.64,1)",
              transform: energy === l.val ? "scale(1.05)" : "scale(1)",
              boxShadow: energy === l.val ? `0 4px 16px ${l.color}25` : "none"
            }}
            onMouseEnter={e => { if (energy !== l.val) { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.borderColor = `${l.color}30`; } }}
            onMouseLeave={e => { if (energy !== l.val) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(240,238,233,0.06)"; } }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{l.icon}</div>
            <div style={{ fontSize: 9, color: energy === l.val ? l.color : C.faint, fontWeight: 600, letterSpacing: "0.04em" }}>{l.label}</div>
          </button>
        ))}
      </div>
      {energy > 0 && (
        <div style={{
          marginTop: 10, fontSize: 11, color: levels[energy - 1].color, fontWeight: 500, textAlign: "center",
          animation: "fadeSlideIn 0.3s ease"
        }}>
          {energy === 4 ? "Dominasi hari ini." : energy === 3 ? "Momentum bagus." : energy === 2 ? "Push through." : "Mulai pelan, nanti naik."}
        </div>
      )}
    </div>
  );
}

function StudyStatsWidget({ progress }) {
  const curDay = getCurrentDay();
  const totalSoal = Object.values(progress).reduce((a, p) => a + (p.soalCount || 0), 0);
  const totalDone = Object.values(progress).reduce((a, p) => a + Object.values(p.tasks || {}).filter(Boolean).length, 0);
  const daysActive = Object.keys(progress).filter(d => Object.values(progress[d]?.tasks || {}).filter(Boolean).length > 0).length;
  const avgTasksPerDay = daysActive > 0 ? Math.round(totalDone / daysActive) : 0;
  const avgSoalPerDay = daysActive > 0 ? Math.round(totalSoal / daysActive) : 0;

  return (
    <div style={S.card} className="card-hover">
      <div style={{ ...S.label, marginBottom: 12 }}>Statistik Belajar</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Total Soal", val: totalSoal, color: C.gold },
          { label: "Hari Aktif", val: `${daysActive}/${curDay}`, color: C.up },
          { label: "Avg Task/Hari", val: avgTasksPerDay, color: C.gold },
          { label: "Avg Soal/Hari", val: avgSoalPerDay, color: C.warn },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "10px 12px", borderRadius: 10, background: "rgba(240,238,233,0.03)",
            border: "1px solid rgba(240,238,233,0.06)", textAlign: "center",
            transition: "all .2s"
          }}
            className="card-hover">
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: C.faint, marginTop: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pre-Session Checklist — persisted per day
function PreSessionChecklist({ day }) {
  const items = ["Air minum tersedia", "HP mode senyap", "Tab lain ditutup", "Catatan siap", "Niat dikunci"];
  const [checked, setChecked] = useState(() => LS.get(`presession_d${day}`, items.map(() => false)));
  useEffect(() => { setChecked(LS.get(`presession_d${day}`, items.map(() => false))); }, [day]);
  const toggle = (i) => {
    const next = [...checked]; next[i] = !next[i];
    setChecked(next); LS.set(`presession_d${day}`, next);
  };
  const allDone = checked.every(Boolean);
  return (
    <div style={{
      ...S.card, borderColor: allDone ? `${C.up}30` : undefined,
      boxShadow: allDone ? `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${C.up}10` : undefined,
      transition: "all .3s"
    }}>
      <div style={{ ...S.label, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Pre-Session</span>
        {allDone && <span style={{ color: C.up, fontSize: 10, fontWeight: 600 }}>✓ Ready</span>}
      </div>
      {items.map((item, i) => (
        <label key={i} onClick={() => toggle(i)}
          className="sq-item"
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", fontSize: 13,
            color: checked[i] ? C.up : C.muted, cursor: "pointer", borderRadius: 8,
            background: checked[i] ? "rgba(76,175,125,0.06)" : "transparent",
            border: `1px solid ${checked[i] ? "rgba(76,175,125,0.15)" : "transparent"}`,
            marginBottom: 3, transition: "all .2s"
          }}>
          <div style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            background: checked[i] ? `linear-gradient(135deg,${C.up},#6FCF97)` : "rgba(240,238,233,0.06)",
            border: `1.5px solid ${checked[i] ? C.up + "66" : "rgba(240,238,233,0.12)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .25s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: checked[i] ? `0 0 10px ${C.up}44` : "none"
          }}>
            {checked[i] && <svg width="10" height="8" viewBox="0 0 12 10" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round"><polyline points="1,5 4.5,8 11,1" /></svg>}
          </div>
          <span style={{ textDecoration: checked[i] ? "line-through" : "none", transition: "all .2s" }}>{item}</span>
        </label>
      ))}
    </div>
  );
}

// Focus Mode Quick Timer (inline, not pomodoro)
function FocusTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
      return () => clearInterval(ref.current);
    }
  }, [running]);

  const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ ...GLASS.cardSm, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }} className="card-hover">
      <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: running ? C.gold : C.muted, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
        {fmt(seconds)}
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={() => setRunning(!running)} style={{ ...S.btnGold, fontSize: 10, padding: "5px 12px" }}>
        {running ? "⏸ Pause" : "▶ Start"}
      </button>
      {seconds > 0 && <button onClick={() => { setRunning(false); setSeconds(0); }} style={{ ...S.btnGhost, fontSize: 10, padding: "5px 10px" }}>Reset</button>}
      {running && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, animation: "pulseDot 2s infinite", boxShadow: `0 0 8px ${C.gold}` }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [NEW WIDGET] DAILY SOAL TRACKER — quick increment gauge
// ═══════════════════════════════════════════════════════════
function DailySoalTracker({ progress, setProgress }) {
  const curDay = getCurrentDay();
  const todayProg = progress[curDay] || {};
  const soalToday = todayProg.soalCount || 0;
  const targetSoal = 80;
  const pct = Math.min(100, Math.round((soalToday / targetSoal) * 100));
  const color = pct >= 100 ? C.up : pct >= 60 ? C.gold : pct >= 30 ? C.warn : C.muted;

  const increment = (n) => {
    const np = { ...progress };
    np[curDay] = { ...np[curDay], soalCount: Math.max(0, (np[curDay]?.soalCount || 0) + n) };
    setProgress(np); LS.set("progress", np);
  };

  return (
    <div style={{ ...S.cardSm, marginBottom: 16 }} className="card-hover">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ ...S.label }}>Soal Hari Ini</div>
        <div style={{ fontFamily: F.display, fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 600, color }}>
          {soalToday}
          <span style={{ fontSize: 12, color: C.muted, fontFamily: F.body, marginLeft: 4 }}>/{targetSoal}</span>
        </div>
      </div>
      {/* Gauge bar */}
      <div style={{ height: 6, background: "rgba(240,238,233,0.06)", borderRadius: 6, overflow: "hidden", marginBottom: 10, position: "relative" }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${color}88,${color})`,
          borderRadius: 6, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)", boxShadow: pct > 0 ? `0 0 10px ${color}44` : "none"
        }} />
        {/* milestone marks */}
        {[25, 50, 75].map(m => (
          <div key={m} style={{ position: "absolute", top: 0, bottom: 0, left: `${m}%`, width: 1, background: "rgba(240,238,233,0.15)" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[5, 10, 20, 30].map(n => (
            <button key={n} onClick={() => increment(n)} style={{ ...S.btnGold, padding: "4px 8px", fontSize: 11, fontWeight: 600 }}>+{n}</button>
          ))}
          <button onClick={() => increment(-5)} style={{ ...S.btnGhost, padding: "4px 8px", fontSize: 11, color: C.muted }}>-5</button>
        </div>
        <span style={{ fontSize: 11, color: pct >= 100 ? C.up : C.muted, fontWeight: 600 }}>
          {pct >= 100 ? "✦ Target!" : `${pct}%`}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [NEW WIDGET] POMODORO — preset focus sessions
// ═══════════════════════════════════════════════════════════
function PomodoroWidget() {
  const presets = [{ label: "Focus 25'", mins: 25, color: C.gold }, { label: "Deep 45'", mins: 45, color: C.warn }, { label: "Block 60'", mins: 60, color: C.down }];
  const [activePreset, setActivePreset] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const ref = useRef(null);
  const totalSecs = presets[activePreset].mins * 60;
  const remaining = totalSecs - seconds;
  const pct = Math.min(100, (seconds / totalSecs) * 100);
  const clr = presets[activePreset].color;

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => {
        if (s + 1 >= totalSecs) { setRunning(false); setCycles(c => c + 1); return 0; }
        return s + 1;
      }), 1000);
      return () => clearInterval(ref.current);
    }
  }, [running, totalSecs]);

  const reset = () => { setRunning(false); setSeconds(0); };
  const switchPreset = (i) => { reset(); setActivePreset(i); };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={S.card} className="card-hover">
      <div style={{ ...S.flexBetween, marginBottom: 12 }}>
        <div style={S.label}>Pomodoro</div>
        {cycles > 0 && <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>🔥 {cycles} sesi</span>}
      </div>
      {/* Preset tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => switchPreset(i)} style={{
            flex: 1, padding: "6px 4px", borderRadius: 8, fontSize: 10, fontWeight: 600, fontFamily: F.body, cursor: "pointer",
            background: activePreset === i ? `${p.color}18` : "rgba(240,238,233,0.03)",
            color: activePreset === i ? p.color : C.faint,
            border: `1px solid ${activePreset === i ? p.color + "40" : "rgba(240,238,233,0.06)"}`,
            transition: "all .2s", letterSpacing: "0.04em",
          }}>{p.label}</button>
        ))}
      </div>
      {/* Timer display */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg viewBox="0 0 72 72" style={{ width: 72, height: 72, transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(240,238,233,0.06)" strokeWidth="5" />
            <circle cx="36" cy="36" r="30" fill="none" stroke={clr} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${188.5 * pct / 100} 188.5`}
              style={{ transition: "stroke-dasharray 0.5s linear", filter: running ? `drop-shadow(0 0 4px ${clr}88)` : "none" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F.display, fontSize: 13, fontWeight: 600, color: running ? clr : C.muted, fontVariantNumeric: "tabular-nums" }}>
              {fmt(remaining)}
            </span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
            {running ? <span style={{ color: clr, fontWeight: 600 }}>● Fokus aktif</span> : seconds > 0 ? "Dijeda" : "Siap"}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setRunning(r => !r)} style={{ ...S.btn(clr), fontSize: 11, padding: "7px 14px" }}>
              {running ? "⏸ Pause" : "▶ Mulai"}
            </button>
            {seconds > 0 && <button onClick={reset} style={{ ...S.btnGhost, fontSize: 11, padding: "7px 10px" }}>↺</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [NEW WIDGET] DAILY INSIGHT — auto-computed from progress
// ═══════════════════════════════════════════════════════════
function DailyInsightWidget({ progress }) {
  const curDay = getCurrentDay();
  const toHistory = LS.get("to_history", []);
  const totalDone = Object.values(progress).reduce((a, p) => a + Object.values(p.tasks || {}).filter(Boolean).length, 0);
  const totalTasks = CURRICULUM.reduce((a, c) => a + c.tasks.length, 0);
  const completion = Math.round((totalDone / totalTasks) * 100);
  const latestTO = toHistory.length > 0 ? toHistory[toHistory.length - 1] : null;
  const daysLeft = getDaysRemaining();

  // Generate insight
  const insights = [];
  if (completion >= 80) insights.push({ icon: "💎", text: "Completion rate elite — 80%+. Mayoritas siswa tidak sampai sini.", color: C.up });
  else if (completion >= 50) insights.push({ icon: "⚡", text: `${completion}% selesai. Kamu di atas rata-rata. Maintain.`, color: C.gold });
  else insights.push({ icon: "▲", text: `${100 - completion}% task belum selesai. Tiap task = 1 level up.`, color: C.warn });

  if (latestTO && latestTO.total >= 700) insights.push({ icon: "🎯", text: `TO terakhir: ${latestTO.total}. Target tercapai. Defend posisi ini.`, color: C.up });
  else if (latestTO) insights.push({ icon: "📊", text: `Gap ke target: ${700 - latestTO.total} pt. ${Math.ceil((700 - latestTO.total) / Math.max(1, 7 - curcumDay))} pt/hari.`, color: C.warn });

  if (daysLeft <= 3) insights.push({ icon: "🔴", text: "Final push. Tidak ada yang bisa ditambah sekarang — eksekusi saja.", color: C.down });
  else if (daysLeft <= 7) insights.push({ icon: "⚔", text: `${daysLeft} hari tersisa. Setiap sesi menentukan.`, color: C.warn });

  return (
    <div style={S.card} className="card-hover">
      <div style={{ ...S.label, marginBottom: 12 }}>Daily Insight</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {insights.slice(0, 3).map((ins, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
            borderRadius: 10, background: `${ins.color}08`, border: `1px solid ${ins.color}20`,
            animation: `cardReveal 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both`
          }}>
            <span style={{ fontSize: 16, lineHeight: 1.3, flexShrink: 0 }}>{ins.icon}</span>
            <span style={{ fontSize: "clamp(11px,1vw,13px)", color: C.muted, lineHeight: 1.55 }}>{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// Helper to avoid undefined reference in DailyInsightWidget
const curcumDay = getCurrentDay();

// ═══════════════════════════════════════════════════════════
// [NEW PREMIUM] TARGET SCORE PROJECTION
// Projects if user is on track to hit 700+ based on TO trend
// ═══════════════════════════════════════════════════════════
function TargetScoreProjection({ toHistory, curDay }) {
  if (toHistory.length === 0) return (
    <div style={{ ...S.card, borderColor: `${C.gold}25` }} className="glow-ring">
      <div style={{ ...S.label, marginBottom: 10 }}>Score Projection</div>
      <div style={{ fontSize: 13, color: C.faint, fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
        Upload TO pertama untuk melihat proyeksi skor.
      </div>
      <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: `${C.gold}08`, border: `1px solid ${C.gold}15`, fontSize: 11, color: C.muted, textAlign: "center" }}>
        Target: 700+ · IPB 2026
      </div>
    </div>
  );

  const last = toHistory[toHistory.length - 1];
  const first = toHistory[0];
  const toCount = toHistory.length;
  const daysLeft = Math.max(1, 26 - curDay);
  const toLeft = Math.max(0, 7 - toCount);

  // Linear trend projection
  let projected = last.total;
  if (toCount >= 2) {
    const trend = (last.total - first.total) / (toCount - 1);
    projected = Math.round(last.total + trend * toLeft);
  }
  projected = Math.min(980, Math.max(0, projected));

  const onTrack = projected >= 700;
  const gap = 700 - last.total;
  const color = onTrack ? C.up : gap < 50 ? C.warn : C.down;
  const pct = Math.min(100, Math.round((last.total / 700) * 100));

  return (
    <div style={{ ...S.card, borderColor: `${color}30`, boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 24px ${color}0c, inset 0 1px 0 rgba(240,238,233,0.06)` }} className="card-hover">
      <div style={{ ...S.flexBetween, marginBottom: 14 }}>
        <div style={S.label}>Score Projection</div>
        <span style={{ ...S.badge(color), fontSize: 10 }}>{onTrack ? "✓ On Track" : `Gap -${Math.abs(gap)}`}</span>
      </div>

      {/* Big projected number */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: F.display, fontSize: "clamp(32px,4vw,44px)", fontWeight: 600, color, lineHeight: 1, letterSpacing: "-1px" }}>
          {projected}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Proyeksi Akhir · Target 700
        </div>
      </div>

      {/* Progress arc-bar */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <div style={{ height: 6, background: "rgba(240,238,233,0.06)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: 6,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 12px ${color}44`,
            transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ fontSize: 9, color: C.faint }}>0</span>
          <span style={{ fontSize: 9, color, fontWeight: 600 }}>700</span>
          <span style={{ fontSize: 9, color: C.faint }}>980</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Skor Terakhir", val: last.total, col: last.total >= 700 ? C.up : C.gold },
          { label: "TO Selesai", val: `${toCount}/7`, col: C.gold },
          { label: "Hari Tersisa", val: daysLeft, col: daysLeft <= 5 ? C.down : C.muted },
          { label: "TO Tersisa", val: toLeft, col: C.muted },
        ].map((s, i) => (
          <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(240,238,233,0.03)", border: "1px solid rgba(240,238,233,0.06)", textAlign: "center" }}>
            <div style={{ fontFamily: F.display, fontSize: "clamp(15px,1.8vw,18px)", fontWeight: 600, color: s.col }}>{s.val}</div>
            <div style={{ fontSize: 9, color: C.faint, marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [NEW PREMIUM] DAILY INTENSITY METER
// Visual gauge showing today's combat intensity level
// ═══════════════════════════════════════════════════════════
function DailyIntensityMeter({ todayDone, todayTotal, streak, totalSoal, curDay }) {
  const taskPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const streakBonus = Math.min(30, streak * 5);
  const soalBonus = Math.min(20, Math.floor(totalSoal / 50) * 5);
  const intensity = Math.min(100, taskPct * 0.5 + streakBonus + soalBonus);
  const level = intensity >= 85 ? { label: "ELITE", color: C.up, icon: "⚡" }
    : intensity >= 65 ? { label: "COMBAT", color: C.gold, icon: "⚔" }
    : intensity >= 40 ? { label: "ACTIVE", color: C.warn, icon: "▲" }
    : { label: "STANDBY", color: C.muted, icon: "◇" };

  const segments = 12;
  const activeSegs = Math.round((intensity / 100) * segments);

  return (
    <div style={{ ...S.card, borderColor: `${level.color}25` }} className="card-hover">
      <div style={{ ...S.flexBetween, marginBottom: 12 }}>
        <div style={S.label}>Combat Intensity</div>
        <span style={{ fontSize: 11, color: level.color, fontWeight: 700, letterSpacing: "0.08em" }}>{level.icon} {level.label}</span>
      </div>

      {/* Segmented gauge bar */}
      <div style={{ display: "flex", gap: 3, marginBottom: 10, height: 20, alignItems: "center" }}>
        {Array.from({ length: segments }, (_, i) => {
          const active = i < activeSegs;
          const near = i === activeSegs - 1;
          return (
            <div key={i} style={{
              flex: 1, height: near ? 20 : active ? 16 : 10, borderRadius: 3,
              background: active ? level.color : "rgba(240,238,233,0.08)",
              boxShadow: near ? `0 0 10px ${level.color}88` : "none",
              transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)",
              transitionDelay: `${i * 40}ms`,
              opacity: active ? (0.5 + (i / segments) * 0.5) : 0.3,
            }} />
          );
        })}
      </div>

      {/* Intensity score */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: F.display, fontSize: "clamp(26px,3vw,32px)", fontWeight: 600, color: level.color, lineHeight: 1 }}>{Math.round(intensity)}</div>
          <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>Intensity Score</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
          <div>Tasks: <span style={{ color: C.cream, fontWeight: 600 }}>{taskPct}%</span></div>
          <div>Streak: <span style={{ color: streak > 0 ? C.warn : C.muted, fontWeight: 600 }}>+{streakBonus}</span></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// [PREMIUM] INSIGHT PANEL — rotating professional quotes
// Cycles every 12s with fade animation
// ═══════════════════════════════════════════════════════════
const INSIGHT_QUOTES = [
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", src: "James Clear" },
  { text: "Professionals practice until they can't get it wrong.", src: "Anonymous" },
  { text: "Target: 700+. Systematic execution, not aspiration.", src: "UTBK_26" },
  { text: "Compound effort. Small daily gains create exponential results.", src: "UTBK_26" },
  { text: "The scoreboard reflects preparation. Nothing more.", src: "UTBK_26" },
  { text: "One plan, fully executed, outperforms ten plans considered.", src: "UTBK_26" },
  { text: "Direction matters more than speed. Verify your approach.", src: "M. Gandhi" },
  { text: "Error analysis today directly improves tomorrow's accuracy.", src: "UTBK_26" },
  { text: "Daily iteration. Compound results.", src: "UTBK_26" },
  { text: "Simulations under test conditions yield the most accurate predictions.", src: "UTBK_26" },
];

function WarRoomQuote({ curDay }) {
  const [idx, setIdx] = useState(() => curDay % INSIGHT_QUOTES.length);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % INSIGHT_QUOTES.length);
        setVisible(true);
      }, 400);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const q = INSIGHT_QUOTES[idx];
  return (
    <div style={{
      ...S.cardSm,
      borderLeft: `3px solid ${C.gold}`,
      position: "relative", overflow: "hidden",
      background: `linear-gradient(135deg, rgba(200,169,110,0.06) 0%, rgba(12,12,14,0.3) 100%)`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(200,169,110,0.1)`,
    }} className="card-hover">
      {/* Corner glow */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80,
        background: `radial-gradient(circle, ${C.gold}15, transparent)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 8, right: 10, opacity: 0.15 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
        </svg>
      </div>

      <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ fontSize: "clamp(11px,1.1vw,13px)", color: C.cream, fontStyle: "italic", lineHeight: 1.65, marginBottom: 10, fontFamily: F.display }}>
          "{q.text}"
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: "0.06em" }}>— {q.src}</span>
          <div style={{ display: "flex", gap: 4 }}>
            {INSIGHT_QUOTES.map((_, i) => (
              <div key={i} onClick={() => { setVisible(false); setTimeout(() => { setIdx(i); setVisible(true); }, 300); }}
                style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 3,
                  background: i === idx ? C.gold : "rgba(200,169,110,0.2)",
                  cursor: "pointer", transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ── PAGE: DASHBOARD ──────────────────────────────────────
function DashboardPage({ progress, setProgress, setPage, setFocusDay }) {
  const curDay = getCurrentDay();
  const daysLeft = getDaysRemaining();
  const phase = getPhaseForDay(curDay);
  const today = CURRICULUM.find(d => d.day === curDay) || CURRICULUM[0];
  const toHistory = LS.get("to_history", []);
  const latestScores = LS.get("latest_scores", null);
  const totalSoal = Object.values(progress).reduce((a, p) => a + (p.soalCount || 0), 0);
  const latestTotal = toHistory.length > 0 ? toHistory[toHistory.length - 1].total : null;
  const todayProg = progress[curDay] || { tasks: {}, sideQuests: {} };
  const todayDone = Object.values(todayProg.tasks).filter(Boolean).length;
  const todayTotal = today.tasks.length;
  const streak = (() => { let s = 0; for (let d = curDay - 1; d >= 1; d--) { const p = progress[d]; if (p && Object.values(p.tasks).filter(Boolean).length > 0) s++; else break; } return s; })();
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("overview");

  const toggleTask = (taskId) => {
    const np = { ...progress };
    np[curDay] = { ...np[curDay], tasks: { ...np[curDay].tasks, [taskId]: !np[curDay].tasks[taskId] } };
    setProgress(np); LS.set("progress", np);
  };
  return (
    <PageWrapper>
      <div style={S.page} className="resp-page">
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {showSources && <SourceLinksModal onClose={() => setShowSources(false)} filterDay={curDay} />}
        {/* Header */}
        <div style={{ ...S.flexBetween, marginBottom: 24 }}>
          <div>
            <h1 style={{ ...S.h1, fontSize: 28 }}>Dashboard</h1>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              Day {curDay}/26 · {today.date} · <span style={{ color: phase.color, fontWeight: 600 }}>{phase.name}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB
          </div>
        </div>

        <CountdownWidget />
        <PhaseBar />

        {/* Premium: Streak Fire + Daily Wisdom + Energy */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(8px,1.2vw,14px)", marginBottom: 16 }}>
          {/* Streak Fire */}
          <div style={{ ...S.cardSm, display: "flex", alignItems: "center", gap: 14, borderLeft: `2px solid ${streak >= 3 ? C.warn : C.goldLine}` }} className="card-hover">
            <div className={streak >= 3 ? "streak-fire" : ""} style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{streak >= 7 ? "🔥" : streak >= 3 ? "🔥" : streak >= 1 ? "✦" : "○"}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: F.display, fontSize: "clamp(18px,2.5vw,22px)", fontWeight: 600, color: streak >= 3 ? C.warn : C.gold }}>{streak} Hari</div>
              <div style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{streak >= 7 ? "Unstoppable." : streak >= 3 ? "Momentum terbentuk." : streak >= 1 ? "Mulai terbangun." : "Mulai hari ini."}</div>
            </div>
            {streak >= 5 && <div style={{ marginLeft: "auto", padding: "4px 8px", borderRadius: 20, background: `${C.warn}20`, border: `1px solid ${C.warn}40`, fontSize: 9, color: C.warn, fontWeight: 600, flexShrink: 0 }}>🏆 {streak}x</div>}
          </div>
          {/* Daily Wisdom */}
          <div style={{ ...S.cardSm, display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" }} className="card-hover">
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right,${C.gold}08,transparent)`, pointerEvents: "none" }} />
            <div style={{ width: 2, height: 28, background: `linear-gradient(${C.gold},transparent)`, borderRadius: 2, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9, color: C.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Hari Ini</div>
              <div style={{ fontSize: "clamp(11px,1.1vw,13px)", color: C.muted, fontStyle: "italic", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }} className="gold-shimmer">"{today.quote || QUOTES[(curDay - 1) % QUOTES.length]}"</div>
            </div>
          </div>
          {/* Energy */}
          <EnergyWidget />
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr) repeat(2, 1fr)", gap: "clamp(8px,1vw,12px)", marginBottom: 20 }} className="resp-grid-4-2">
          {[
            { label: "Hari Tersisa", value: daysLeft, color: daysLeft <= 5 ? C.down : C.gold, sub: "/26 hari" },
            { label: "Total Soal", value: totalSoal, color: C.gold, sub: "dikerjakan" },
            { label: "Estimasi Skor", value: latestTotal || "—", color: latestTotal ? (latestTotal >= 700 ? C.up : C.down) : C.muted, sub: latestTotal ? `TO-${toHistory.length}` : "belum TO" },
            { label: "Tryout", value: `${toHistory.length}/7`, color: C.gold, sub: "selesai" },
          ].map((sc, i) => (
            <div key={i} className={`card-${i}`}>
              <StatCard {...sc} />
            </div>
          ))}
        </div>

        {/* ── EXECUTIVE CALENDAR — FULL WIDTH COMPACT ── */}
        <ExecutiveCalendar progress={progress} setFocusDay={setFocusDay} setPage={setPage} />

        {/* ── DASHBOARD: TWO COLUMN WITH STICKY SIDEBAR ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: "clamp(12px, 1.5vw, 20px)", alignItems: "start", animation: "fadeSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }} className="resp-grid-dashboard">
          
          {/* LEFT: MAIN SCROLLABLE DASHBOARD WIDGETS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 1. Misi Hari Ini (Full Width Left) */}
            <div style={S.card}>
              {showSources && <SourceLinksModal onClose={() => setShowSources(false)} filterDay={curDay} />}
              <div style={S.flexBetween}>
                <h2 style={S.h2}>Misi Hari Ini — Day {curDay}</h2>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  {today.focusSubtes.slice(0, 4).map(id => <SubtesBadge key={id} id={id} small />)}
                </div>
              </div>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 14 }}>{today.title}</div>
              {today.isTO && <span style={{ ...S.badge(C.down), display: "inline-block", marginBottom: 14, fontSize: 12 }}>TO #{today.toNum} Hari Ini</span>}
              {todayTotal === 0 && <div style={{ fontSize: 13, color: C.muted, padding: "12px 0" }}>Hari ini belum dimulai.</div>}
              <ProgressBar pct={(todayDone / Math.max(1, todayTotal)) * 100} color={phase.color} height={5} />
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6, marginBottom: 16 }}>
                <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: todayDone === todayTotal && todayTotal > 0 ? C.up : C.cream }}>{todayDone}</span>
                <span style={{ color: C.faint }}> / {todayTotal} tasks</span>
                {todayDone > 0 && todayDone < todayTotal && <span style={{ marginLeft: 8, fontSize: 10, color: C.warn, fontWeight: 600, padding: "2px 8px", background: `${C.warn}15`, borderRadius: 12, border: `1px solid ${C.warn}30` }}>⚡ {todayTotal - todayDone} tersisa</span>}
                {todayDone === todayTotal && todayTotal > 0 && <span style={{ marginLeft: 8, fontSize: 10, color: C.up, fontWeight: 600, padding: "2px 8px", background: `${C.up}15`, borderRadius: 12, border: `1px solid ${C.up}30` }}>✦ COMPLETE</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {today.tasks.map((t, ti) => {
                  const isDone = todayProg.tasks[t.id];
                  const tagColor = TAG_COLORS[t.tag] || C.muted;
                  return (
                    <div key={t.id} onClick={() => toggleTask(t.id)}
                      className={`task-item ${isDone ? "task-item-done" : ""}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10,
                        background: isDone ? `linear-gradient(135deg, ${C.up}0d, ${C.up}05)` : C.g1,
                        border: `1px solid ${isDone ? C.up + "28" : "rgba(240,238,233,0.06)"}`,
                        animation: `cardReveal 0.35s cubic-bezier(0.16,1,0.3,1) ${ti * 40}ms both`,
                        backdropFilter: "blur(12px)"
                      }}>
                      {/* Step number */}
                      <div className={isDone ? "task-check-done" : ""} style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: isDone ? `linear-gradient(135deg,${C.up},#6FCF97)` : "rgba(240,238,233,0.04)",
                        border: `1.5px solid ${isDone ? C.up + "66" : "rgba(240,238,233,0.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .3s cubic-bezier(0.34,1.56,0.64,1)",
                        boxShadow: isDone ? `0 0 16px ${C.up}44, 0 2px 8px rgba(0,0,0,0.3)` : "0 2px 8px rgba(0,0,0,0.2)"
                      }}>
                        {isDone ? (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1,5 4.5,8 11,1" strokeDasharray="20" style={{ animation: "checkDraw 0.25s ease forwards" }} />
                          </svg>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, fontFamily: F.body }}>{ti + 1}</span>
                        )}
                      </div>
                      {/* Tag & Label */}
                      <div style={{ padding: "4px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", background: `${tagColor}18`, color: tagColor, border: `1px solid ${tagColor}30`, textTransform: "uppercase", flexShrink: 0 }}>{t.tag}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: isDone ? 400 : 500, color: isDone ? C.muted : C.cream, textDecoration: isDone ? "line-through" : "none", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</span>
                      </div>
                      {/* Link */}
                      {t.link && <a href={t.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="link-btn" style={{ fontSize: 10, color: C.gold, textDecoration: "none", padding: "5px 12px", border: `1px solid ${C.goldLine}`, borderRadius: 8, background: `linear-gradient(135deg, ${C.goldDim}, rgba(200,169,110,0.08))`, display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, fontWeight: 600 }}>↗ Buka</a>}
                    </div>
                  );
                })}
              </div>
              {today.sideQuests.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(240,238,233,0.06)" }}>
                  <div style={{ ...S.label, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 14 }}>⚔</span> Side Quests</div>
                  {today.sideQuests.map((sq, si) => (
                    <div key={sq.id} className="sq-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(200,169,110,0.04)", border: `1px solid rgba(200,169,110,0.1)`, marginBottom: 6, cursor: "pointer", animation: `cardReveal 0.3s ease ${si * 60}ms both` }}>
                      <div style={{ padding: "3px 10px", borderRadius: 8, background: `${C.gold}18`, border: `1px solid ${C.gold}30`, fontSize: 10, fontWeight: 700, color: C.gold }}>+{sq.xp} XP</div>
                      <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>{sq.label}</span>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.goldDim }} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={() => setShowSources(true)} style={{ ...S.btnGold, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12 }}>◇ Sumber Hari Ini</button>
                {!showUpload ? <button onClick={() => setShowUpload(true)} style={{ ...S.btn(), width: "60%" }}>Input Hasil TO</button> : <UploadAnalyzer onSave={() => setShowUpload(false)} onClose={() => setShowUpload(false)} onToast={setToast} />}
              </div>
            </div>

            {/* 2. Target & Intensity (Side-by-side) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <TargetScoreProjection toHistory={toHistory} curDay={curDay} />
              <DailyIntensityMeter todayDone={todayDone} todayTotal={todayTotal} streak={streak} totalSoal={totalSoal} curDay={curDay} />
            </div>

            {/* 3. Progress Ring & Analytics (Side-by-side) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              {/* Progress Ring Card */}
              <div style={S.card} className="card-hover">
                <div style={{ ...S.label, marginBottom: 10 }}>Progress Task Visual</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                    <svg viewBox="0 0 90 90" style={{ width: 72, height: 72, transform: "rotate(-90deg)" }}>
                      <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(240,238,233,0.06)" strokeWidth="7" />
                      <circle cx="45" cy="45" r="38" fill="none" stroke={todayDone === todayTotal && todayTotal > 0 ? C.up : C.gold} strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={`${238.76 * (todayDone / Math.max(1, todayTotal))} 238.76`}
                        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${C.gold}44)` }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: todayDone === todayTotal && todayTotal > 0 ? C.up : C.cream }}>{todayDone}</div>
                      <div style={{ fontSize: 8, color: C.muted }}>/{todayTotal}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.cream, marginBottom: 5 }}>{todayDone === todayTotal && todayTotal > 0 ? "All done!" : todayDone === 0 ? "Not started" : `${todayTotal - todayDone} left`}</div>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {today.focusSubtes.slice(0, 3).map(id => <SubtesBadge key={id} id={id} small />)}
                    </div>
                    {todayDone === todayTotal && todayTotal > 0 && <div style={{ marginTop: 6, fontSize: 10, color: C.up, fontWeight: 600 }}>✦ Day Complete</div>}
                  </div>
                </div>
              </div>

              {/* Spider Chart Card */}
              {latestScores ? (
                <div style={S.card}>
                  <h2 style={S.h2}>Radar Subtes</h2>
                  <SpiderChart scores={latestScores} prevScores={toHistory.length > 1 ? toHistory[toHistory.length - 2].scores : null} />
                </div>
              ) : (
                <StudyStatsWidget progress={progress} />
              )}
            </div>

            {/* 4. Achievements + Pemahaman — side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginBottom: 16 }}>
              <div style={{ ...S.card, marginBottom: 0 }} className="card-hover">
                <div style={{ ...S.label, marginBottom: 10 }}>Achievements & Metrics</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { icon: "◆", label: "First Task", desc: "Complete first task", done: Object.values(progress).some(p => Object.values(p.tasks || {}).some(Boolean)) },
                    { icon: "◇", label: "Data Driven", desc: "Upload first TO", done: toHistory.length > 0 },
                    { icon: "✦", label: "On Fire", desc: "3-day streak", done: streak >= 3 },
                    { icon: "▸", label: "Centurion", desc: "100+ problems", done: totalSoal >= 100 },
                    { icon: "★", label: "Consistent", desc: "7-day streak", done: streak >= 7 },
                    { icon: "◈", label: "TO Master", desc: "4+ simulations", done: toHistory.length >= 4 },
                  ].map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 10, background: a.done ? `${C.gold}0c` : "rgba(240,238,233,0.02)", border: `1px solid ${a.done ? `${C.gold}30` : "rgba(240,238,233,0.05)"}`, opacity: a.done ? 1 : 0.4 }}>
                      <span style={{ fontSize: 14, color: a.done ? C.gold : C.faint }}>{a.icon}</span>
                      <div style={{ minWidth: 0, flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: a.done ? C.gold : C.muted }}>{a.label}</div>
                        <div style={{ fontSize: 9, color: C.faint }}>{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...S.card, marginBottom: 0 }} className="card-hover">
                <div style={{ ...S.label, marginBottom: 14 }}>Pemahaman per Subtes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {SUBTES.map(s => {
                    const vals = Object.values(progress).map(p => p.understanding?.[s.id] || 0).filter(v => v > 0);
                    const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, fontSize: 10, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.short}</div>
                        <div style={{ flex: 1, height: 6, background: "rgba(240,238,233,0.06)", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ width: `${avg}%`, height: "100%", background: `linear-gradient(90deg, ${s.color}99, ${s.color})`, borderRadius: 6, transition: "width 0.8s ease", boxShadow: `0 0 8px ${s.color}44` }} />
                        </div>
                        <div style={{ width: 32, fontSize: 10, color: avg > 70 ? C.up : avg > 40 ? C.warn : C.muted, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{avg}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. Score Line Chart */}
            {toHistory.length > 0 && (
              <div style={{ ...S.card }}>
                <div style={{ ...S.label, marginBottom: 12 }}>Score Progression Line</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={toHistory.map((t, i) => ({ name: `TO-${i + 1}`, total: t.total }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,238,233,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10, fontFamily: F.body }} />
                    <YAxis domain={[400, 800]} tick={{ fill: C.muted, fontSize: 10, fontFamily: F.body }} />
                    <Tooltip contentStyle={{ background: "rgba(12,12,14,0.92)", border: `1px solid ${C.goldLine}`, borderRadius: 10, fontSize: 12, fontFamily: F.body, backdropFilter: "blur(16px)" }} />
                    <Line type="monotone" dataKey="total" stroke={C.gold} strokeWidth={2} dot={{ fill: C.gold, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
                <TOTrendLine toHistory={toHistory} />
              </div>
            )}

          </div>

          {/* RIGHT: SIDEBAR — no sticky, flows with page */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
            <DailyInsightWidget progress={progress} />
            <WarRoomQuote curDay={curDay} />
            <SidebarMiniMap curDay={curDay} setFocusDay={setFocusDay} setPage={setPage} progress={progress} />
          </div>
        </div>

        {/* ── DASHBOARD WIDGET ROW — 4 PER ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 16 }}>
          <PomodoroWidget />
          <DailySoalTracker progress={progress} setProgress={setProgress} />
          <div style={{ ...S.card, padding: "14px 16px" }}>
            <div style={{ ...S.label, marginBottom: 8 }}>Jadwal Eksekusi</div>
            {[["06:00", "Warm-up", C.gold], ["08:00", "Focus Block 1", C.down], ["11:30", "Break", C.muted], ["12:00", "Focus Block 2", C.warn], ["15:30", "Break", C.muted], ["16:00", "Focus Block 3", C.gold], ["18:00", "Recharge", C.muted], ["19:30", "Review", C.up], ["22:00", "Rest", C.muted]].map(([time, label, color], i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "3px 0", borderBottom: "1px solid rgba(240,238,233,0.04)" }}>
                <span style={{ fontSize: 10, color: C.faint, width: 38, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{time}</span>
                <span style={{ fontSize: 11, color }}>{label}</span>
              </div>
            ))}
          </div>
          <WeaknessDetector />
        </div>
      </div>
    </PageWrapper>
  );
}

// ── NEW COMPONENT: KALENDER EKSEKUTIF ──────────────────────
function ExecutiveCalendar({ progress, setFocusDay, setPage }) {
  const curDay = getCurrentDay();
  const daysLeft = getDaysRemaining();
  // Pulses warning styling when H-7 or below
  const isDangerZone = daysLeft > 0 && daysLeft <= 7;

  return (
    <div style={{ ...S.card, padding: "clamp(14px, 2vw, 20px)", marginBottom: 20, position: "relative", overflow: "hidden", border: `1px solid ${isDangerZone ? C.warn : C.gold}30` }}>
      <div style={{ position: "absolute", top: -150, right: -150, width: 400, height: 400, background: `radial-gradient(circle, ${isDangerZone ? C.warn : C.gold}15 0%, transparent 60%)`, pointerEvents: "none" }} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: F.display, fontSize: "clamp(14px, 1.6vw, 18px)", fontWeight: 600, color: C.cream, letterSpacing: "1px" }}>Peta Eksekusi</div>
          {isDangerZone && <span style={{ fontSize: 10, padding: "3px 8px", background: `${C.warn}20`, color: C.warn, borderRadius: 6, border: `1px solid ${C.warn}40`, animation: "btnPulse 1.5s infinite alternate", fontWeight: 700, letterSpacing: "0.06em" }}>CRITICAL</span>}
          <div style={{ fontSize: 11, color: C.muted }}>Klik hari manapun → langsung ke Focus</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            fontFamily: F.display, fontSize: "clamp(22px, 2.8vw, 32px)", fontWeight: 700, color: isDangerZone ? C.warn : C.gold, lineHeight: 1,
            animation: isDangerZone ? "pulseText 1.5s infinite alternate" : "none",
            textShadow: isDangerZone ? `0 0 20px ${C.warn}66` : `0 0 20px rgba(200,169,110,0.3)`
          }}>
            H-{daysLeft}
          </div>
          <div style={{ fontSize: 9, color: isDangerZone ? C.warn : C.gold, letterSpacing: "2px", textTransform: "uppercase" }}>SNBT</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 6 }}>
        {CURRICULUM.map(d => {
          const p = progress[d.day];
          const done = p ? Object.values(p.tasks).filter(Boolean).length : 0;
          const total = d.tasks.length;
          const isToday = d.day === curDay;
          const isPast = d.day < curDay;
          const pct = total > 0 ? (done / total) * 100 : 0;
          
          let statusColor = "rgba(240,238,233,0.02)";
          let borderColor = "rgba(240,238,233,0.05)";
          let textColor = C.muted;
          let glow = "none";
          
          if (isToday) {
            statusColor = `${C.gold}15`;
            borderColor = C.gold;
            textColor = C.gold;
            glow = `0 0 20px ${C.gold}20`;
          } else if (isPast) {
            if (pct >= 80) { statusColor = `${C.up}10`; borderColor = `${C.up}30`; textColor = C.up; }
            else if (pct >= 40) { statusColor = `${C.warn}10`; borderColor = `${C.warn}30`; textColor = C.warn; }
            else { statusColor = `${C.down}10`; borderColor = `${C.down}30`; textColor = C.down; }
          }
          
          return (
            <div key={d.day} onClick={() => { setFocusDay(d.day); setPage("focus"); }}
                 title={`Day ${d.day} — ${d.title}`}
                 className="card-hover"
                 style={{
                   background: statusColor, border: `1px solid ${borderColor}`, borderRadius: 8, padding: "7px 8px",
                   cursor: "pointer", transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", position: "relative",
                   boxShadow: glow, minHeight: 46
                 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: textColor, fontVariantNumeric: "tabular-nums", fontFamily: F.display }}>{d.day}</div>
                {isToday && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, animation: "btnPulse 2s infinite", boxShadow: `0 0 6px ${C.gold}`, flexShrink: 0 }} />}
                {d.isTO && !isToday && <div style={{ fontSize: 7, color: C.down, fontWeight: 700 }}>TO</div>}
              </div>
              <div style={{ height: 3, background: "rgba(0,0,0,0.35)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: textColor, borderRadius: 3, transition: "width 0.8s ease" }} />
              </div>
            </div>
          )
        })}
        {/* UTBK Day Final Block */}
        <div style={{
           background: `linear-gradient(135deg, ${C.gold}25, rgba(200,169,110,0.04))`, border: `1px solid ${C.gold}60`, borderRadius: 8, padding: "8px 12px",
           display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
           gridColumn: "1 / -1", marginTop: 4
        }}>
           <div style={{ fontSize: 16 }}>⚔️</div>
           <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, letterSpacing: "2px", textShadow: `0 0 12px ${C.gold}88` }}>UTBK 2026 — Final Execution</div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulseText {
          0% { opacity: 0.75; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>
    </div>
  )
}

// ── NEW COMPONENT: SIDEBAR MINI MAP ─────────────────────────
function SidebarMiniMap({ curDay, setFocusDay, setPage, progress }) {
  // A compact grid map to fill the vertical space in the sidebar
  return (
    <div style={{ ...S.card, flex: 1, display: "flex", flexDirection: "column", minHeight: 200 }} className="card-hover">
      <div style={{ ...S.flexBetween, marginBottom: 12 }}>
        <div style={S.label}>Heatmap Mini</div>
        <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "1px" }}>26 Hari</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, flex: 1, alignContent: "flex-start" }}>
        {CURRICULUM.map(d => {
          const p = progress[d.day];
          const done = p ? Object.values(p.tasks).filter(Boolean).length : 0;
          const total = d.tasks.length;
          const isToday = d.day === curDay;
          const pct = total > 0 ? (done / total) * 100 : 0;
          const lvl = pct === 0 ? 0 : pct <= 30 ? 1 : pct <= 60 ? 2 : pct <= 95 ? 3 : 4;
          const fills = ["rgba(240,238,233,0.01)", `${C.down}15`, `${C.warn}20`, `${C.gold}35`, `${C.up}35`];
          const borders = ["rgba(240,238,233,0.04)", `${C.down}30`, `${C.warn}40`, `${C.gold}60`, `${C.up}60`];

          return (
            <div key={d.day} onClick={() => { setFocusDay(d.day); setPage("focus"); }}
                 title={`Day ${d.day}`}
                 style={{
                   aspectRatio: "1", borderRadius: 8,
                   background: isToday ? `${C.gold}20` : fills[lvl],
                   border: `1px solid ${isToday ? C.gold : borders[lvl]}`,
                   display: "flex", alignItems: "center", justifyContent: "center",
                   cursor: "pointer", transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                   boxShadow: isToday ? `0 0 10px ${C.gold}20` : "none",
                   position: "relative", overflow: "hidden"
                 }}
                 onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.borderColor = C.gold; }}
                 onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = (isToday ? C.gold : borders[lvl]); }}>
              <span style={{ fontSize: 13, fontFamily: F.display, fontWeight: 700, color: isToday ? C.gold : C.muted }}>
                {d.day}
              </span>
              {isToday && <div style={{ position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: "50%", background: C.gold, animation: "btnPulse 2s infinite" }} />}
            </div>
          )
        })}
        {/* Placeholder for remaining space in 3 columns (26 % 3 = 2 grid cells remaining) */}
        <div style={{ aspectRatio: "1", borderRadius: 8, background: "rgba(240,238,233,0.01)", border: "1px dashed rgba(240,238,233,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, color: C.faint }}>⚔️</span></div>
      </div>
    </div>
  )
}


// ── PAGE: FOCUS ──────────────────────────────────────────
function FocusPage({ progress, setProgress, focusDay }) {
  const [day, setDay] = useState(focusDay || getCurrentDay());
  const cur = CURRICULUM.find(d => d.day === day) || CURRICULUM[0];
  const phase = getPhaseForDay(day);
  const prog = progress[day] || { tasks: {}, sideQuests: {}, understanding: {}, notes: "", soalCount: 0 };
  const done = Object.values(prog.tasks).filter(Boolean).length;
  const [notes, setNotes] = useState(prog.notes || "");
  const [soalCount, setSoalCount] = useState(prog.soalCount || 0);
  const [pomTime, setPomTime] = useState(25 * 60);
  const [pomActive, setPomActive] = useState(false);
  const [pomOriginal, setPomOriginal] = useState(25 * 60);
  const [pomDone, setPomDone] = useState(false);
  // Chat persistence — load from localStorage per day
  const loadChat = (d) => {
    const saved = LS.get(`chat_focus_d${d}`, null);
    const c = CURRICULUM.find(x => x.day === d) || CURRICULUM[0];
    if (saved && saved.length > 0) return saved;
    return [{ role: "clod", text: `Day ${d} — ${c.title}. Fokus: ${c.focusSubtes.join(", ")}.`, ts: Date.now() }];
  };
  const [chatMessages, setChatMessages] = useState(() => loadChat(day));
  const [chatInput, setChatInput] = useState("");
  const [chatMode, setChatMode] = useState("TUTOR");
  const [isTyping, setIsTyping] = useState(false);
  const [intention, setIntention] = useState(() => LS.get(`intention_d${day}`, ""));
  const pomRef = useRef(null);
  const chatEndRef = useRef(null);
  const [showSources, setShowSources] = useState(false);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    if (chatMessages.length > 0) LS.set(`chat_focus_d${day}`, chatMessages);
  }, [chatMessages, day]);

  useEffect(() => { setDay(focusDay || getCurrentDay()); }, [focusDay]);
  useEffect(() => {
    setNotes(prog.notes || ""); setSoalCount(prog.soalCount || 0);
    setIntention(LS.get(`intention_d${day}`, ""));
  }, [day]);
  useEffect(() => {
    if (pomActive && pomTime > 0) { pomRef.current = setInterval(() => setPomTime(p => p - 1), 1000); return () => clearInterval(pomRef.current); }
    else if (pomTime <= 0) { setPomActive(false); setPomTime(25 * 60); setPomDone(true); setTimeout(() => setPomDone(false), 2000); }
  }, [pomActive, pomTime]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, isTyping]);
  // Load chat history when day changes (instead of resetting)
  useEffect(() => {
    setChatMessages(loadChat(day));
    setIsTyping(false);
  }, [day]);

  const clearChat = () => {
    const c = CURRICULUM.find(x => x.day === day) || CURRICULUM[0];
    const fresh = [{ role: "clod", text: `Chat direset. Day ${day} — ${c.title}. Fokus: ${c.focusSubtes.join(", ")}.`, ts: Date.now() }];
    setChatMessages(fresh);
    LS.set(`chat_focus_d${day}`, fresh);
  };

  const toggleTask = (taskId) => {
    const np = { ...progress }; np[day] = { ...np[day], tasks: { ...np[day].tasks, [taskId]: !np[day].tasks[taskId] } };
    setProgress(np); LS.set("progress", np);
  };
  const saveNotes = () => { const np = { ...progress }; np[day] = { ...np[day], notes, soalCount }; setProgress(np); LS.set("progress", np); };
  const saveIntention = (val) => { setIntention(val); LS.set(`intention_d${day}`, val); };
  const updateUnderstanding = (id, val) => { const np = { ...progress }; np[day] = { ...np[day], understanding: { ...np[day].understanding, [id]: parseInt(val) } }; setProgress(np); LS.set("progress", np); };

  const sendChat = async () => {
    const text = chatInput.trim(); if (!text || isTyping) return;
    setChatInput("");
    const updated = [...chatMessages, { role: "user", text, ts: Date.now() }];
    setChatMessages(updated); setIsTyping(true);
    const history = updated.slice(-10).map(m => ({ role: m.role === "clod" ? "assistant" : "user", content: m.text }));
    const apiMessages = [{ role: "system", content: buildClodSystemPrompt(chatMode, day, cur, done, cur.tasks.length) }, ...history];
    try { const reply = await callClodAI(apiMessages); setChatMessages(p => { const n = [...p, { role: "clod", text: reply, ts: Date.now() }]; return n; }); }
    catch (e) { setChatMessages(p => [...p, { role: "clod", text: "Koneksi gagal. Coba lagi.", ts: Date.now() }]); }
    finally { setIsTyping(false); }
  };
  const triggerModePrompt = async (mode) => {
    setChatMode(mode); if (isTyping) return;
    const prompts = { TUTOR: `Jelaskan materi hari ini: ${cur.focusSubtes.join(", ")}.`, REVIEW: `Quiz saya untuk ${cur.focusSubtes.join(", ")}.`, DEBUG: `Analisis pola kesalahan saya untuk ${cur.focusSubtes.join(", ")}.`, BRIEF: `Ringkasan materi ${cur.title}.`, WRAPUP: `Recap Day ${day}: ${done}/${cur.tasks.length} tasks selesai.` };
    const text = prompts[mode] || `Mode ${mode} aktif.`;
    const updated = [...chatMessages, { role: "user", text }];
    setChatMessages(updated); setIsTyping(true);
    const history = updated.slice(-10).map(m => ({ role: m.role === "clod" ? "assistant" : "user", content: m.text }));
    const apiMessages = [{ role: "system", content: buildClodSystemPrompt(mode, day, cur, done, cur.tasks.length) }, ...history];
    try { const reply = await callClodAI(apiMessages); setChatMessages(p => { const n = [...p, { role: "clod", text: reply, ts: Date.now() }]; return n; }); }
    catch (e) { setChatMessages(p => [...p, { role: "clod", text: "Koneksi gagal." }]); }
    finally { setIsTyping(false); }
  };

  const schedule = [
    { time: "06:00", label: "Warm-up", c: C.gold, h: 6 }, { time: "08:00", label: "Focus Block 1", c: C.down, h: 8 },
    { time: "11:30", label: "Break", c: C.muted, h: 11.5 }, { time: "12:00", label: "Focus Block 2", c: C.warn, h: 12 },
    { time: "15:30", label: "Break", c: C.muted, h: 15.5 }, { time: "16:00", label: "Focus Block 3", c: C.gold, h: 16 },
    { time: "18:00", label: "Recharge", c: C.muted, h: 18 }, { time: "19:30", label: "Review", c: C.up, h: 19.5 },
  ];

  return (
    <PageWrapper>
      <div style={S.page} className="resp-page">
        {pomDone && <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 400, background: `radial-gradient(ellipse at center, transparent 30%, rgba(200,169,110,0.25) 100%)`, animation: "pulseVignette 2s ease forwards" }} />}
        
        {/* Top Navigation Bar / Breadcrumbs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => setDay(Math.max(1, day - 1))} style={{ ...S.btnGhost, padding: "6px 12px", fontSize: 11 }}>← Prev Day</button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "2px" }}>PATH MODE</span>
            <span style={{ color: C.goldLine }}>/</span>
            <span style={{ fontSize: 10, color: C.cream, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Focus Sesi {day}</span>
          </div>
          <button onClick={() => setDay(Math.min(26, day + 1))} style={{ ...S.btnGhost, padding: "6px 12px", fontSize: 11 }}>Next Day →</button>
        </div>

        {/* ── FOCUS LAYOUT: 2 COLUMN ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(320px, 2.5fr)", gap: "clamp(16px, 2vw, 24px)", alignItems: "start" }} className="resp-grid-2-1">
          
          {/* LEFT: MAIN FOCUS AREA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Header Area (Day Title + Start Button) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 16, borderBottom: "1px solid rgba(240,238,233,0.06)", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <h1 style={{ fontFamily: F.display, fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 600, color: phase.color, lineHeight: 1, textShadow: `0 0 30px ${phase.color}30` }}>
                    {day}
                  </h1>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 10, color: C.faint, letterSpacing: "2px", textTransform: "uppercase" }}>{cur.date}</div>
                    <div style={{ fontSize: 16, color: C.cream, fontWeight: 500 }}>{cur.title}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={S.badge(phase.color)}>{phase.name}</span>
                  {cur.isTO && <span style={S.badge(C.down)}>TO #{cur.toNum}</span>}
                  {cur.focusSubtes.map(id => <SubtesBadge key={id} id={id} small />)}
                </div>
              </div>
              
              <button
                onClick={() => setPomActive(true)}
                style={{
                  background: `linear-gradient(135deg, #D4A84B 0%, #F0D080 45%, #C8A96E 100%)`,
                  color: "#0C0C0E",
                  border: "1px solid rgba(240,210,100,0.4)",
                  borderRadius: 12, padding: "14px 36px",
                  fontFamily: F.display, fontWeight: 700, fontSize: 15, letterSpacing: "2px",
                  cursor: "pointer",
                  boxShadow: `0 0 24px rgba(200,169,110,0.6), 0 0 60px rgba(200,169,110,0.25), 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)`,
                  transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", textTransform: "uppercase",
                  display: "flex", alignItems: "center", gap: 10, position: "relative", overflow: "hidden"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06) translateY(-3px)"; e.currentTarget.style.boxShadow = `0 0 40px rgba(200,169,110,0.85), 0 0 100px rgba(200,169,110,0.4), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.5)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.boxShadow = `0 0 24px rgba(200,169,110,0.6), 0 0 60px rgba(200,169,110,0.25), 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)`; }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0C0C0E", opacity: 0.7, animation: "btnPulse 1.5s infinite", flexShrink: 0 }} />
                Start Day {day}
              </button>
            </div>

            {/* Target Intention (Inline minimalist) */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(240,238,233,0.02)", borderRadius: 8, border: `1px solid rgba(240,238,233,0.05)` }}>
              <span style={{ fontSize: 14, color: C.gold }}>🎯</span>
              <input value={intention} onChange={e => setIntention(e.target.value)} onBlur={e => saveIntention(e.target.value)} onKeyDown={e => e.key === "Enter" && saveIntention(e.target.value)}
                placeholder="Set primary intention for today..."
                style={{ ...S.input, background: "transparent", border: "none", padding: 0, fontSize: 13, flex: 1, outline: "none", color: intention ? C.cream : C.muted, fontStyle: intention ? "normal" : "italic" }} />
            </div>

            {/* Progress Bar Header */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "1px" }}>PROGRESS <span style={{ color: C.cream }}>{done}/{cur.tasks.length}</span></div>
                <div style={{ fontSize: 11, color: phase.color, fontWeight: 700 }}>{Math.round((done / Math.max(1, cur.tasks.length)) * 100)}%</div>
              </div>
              <div style={{ height: 4, background: "rgba(240,238,233,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${(done / Math.max(1, cur.tasks.length)) * 100}%`, height: "100%", background: phase.color, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)", boxShadow: `0 0 10px ${phase.color}88` }} />
              </div>
            </div>

            {/* Checklist Box */}
            <div style={{ ...S.card, marginTop: 10, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid rgba(240,238,233,0.04)", background: "rgba(240,238,233,0.02)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: C.muted, textTransform: "uppercase" }}>Checklist</div>
                <button onClick={() => setShowSources(true)} style={{ border: "none", background: "transparent", fontSize: 11, color: C.gold, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6 }}>
                  <span>◇</span> Referensi
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {cur.tasks.map((t, ti) => {
                  const isDone = prog.tasks[t.id];
                  const tagColor = TAG_COLORS[t.tag] || C.muted;
                  return (
                    <div key={t.id} onClick={() => toggleTask(t.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
                        borderBottom: ti < cur.tasks.length - 1 ? "1px solid rgba(240,238,233,0.03)" : "none",
                        background: isDone ? `linear-gradient(90deg, ${C.up}09, transparent)` : "transparent",
                        cursor: "pointer", transition: "all .2s ease",
                      }}
                      className="task-hover-bg">
                      {/* Subdued tiny checkbox */}
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1px solid ${isDone ? C.up : "rgba(240,238,233,0.2)"}`,
                        background: isDone ? C.up : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .2s"
                      }}>
                        {isDone && <svg width="10" height="8" viewBox="0 0 12 10" fill="none" stroke={C.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,5 4.5,8 11,1" /></svg>}
                      </div>
                      
                      {/* Tag */}
                      <div style={{ padding: "3px 8px", borderRadius: 6, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", background: `${tagColor}15`, color: tagColor, textTransform: "uppercase", flexShrink: 0 }}>
                        {t.tag}
                      </div>

                      {/* Label */}
                      <div style={{ flex: 1, minWidth: 0, color: isDone ? C.muted : C.cream, textDecoration: isDone ? "line-through" : "none", fontSize: 13, transition: "color .2s" }}>
                        {t.label}
                      </div>

                      {/* Link Button */}
                      {t.link && (
                        <a href={t.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} 
                          style={{
                            fontSize: 10, color: C.muted, textDecoration: "none", padding: "4px 10px", borderRadius: 6,
                            background: "rgba(240,238,233,0.04)", border: "1px solid rgba(240,238,233,0.08)",
                            transition: "all .2s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = C.goldLine; }}
                          onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = "rgba(240,238,233,0.08)"; }}>
                          Buka ↗
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Grid for Secondary Info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 8 }}>
              {/* Understanding Sliders */}
              <div style={S.card}>
                <div style={{ ...S.flexBetween, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" }}>Pemahaman Subtes</div>
                  <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>
                    {Math.round(SUBTES.reduce((a, s) => (a + (prog.understanding?.[s.id] || 0)), 0) / SUBTES.length)}% avg
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {SUBTES.map(s => (
                    <SliderWithTrack
                      key={s.id}
                      label={s.short}
                      value={prog.understanding?.[s.id] || 0}
                      onChange={val => updateUnderstanding(s.id, val)}
                      color={C.gold}
                      showValue={true}
                    />
                  ))}
                </div>
              </div>

              {/* Notes & Quant */}
              <div style={{ ...S.card, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Materi & Konsep (Notes)</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes}
                  placeholder="Catat insight penting atau rumus baru di sini..."
                  style={{ ...S.input, flex: 1, minHeight: 80, resize: "none", fontSize: 12, lineHeight: 1.6, background: "rgba(12,12,14,0.4)" }} />
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(240,238,233,0.06)" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>Soal Dikerjakan Sesi Ini:</span>
                  <input type="number" value={soalCount} onChange={e => setSoalCount(parseInt(e.target.value) || 0)} onBlur={saveNotes}
                    style={{ ...S.input, width: 60, padding: "4px 8px", fontSize: 12, textAlign: "center", background: "rgba(12,12,14,0.4)" }} />
                </div>
              </div>
            </div>

            {/* War Room Quote Full Width */}
            <div style={{ ...S.cardSm, fontStyle: "italic", fontSize: 12, color: C.muted, lineHeight: 1.65, textAlign: "center", margin: "16px 0", borderTop: `1px solid rgba(240,238,233,0.06)` }}>
              "{cur.quote || QUOTES[(day - 1) % QUOTES.length]}"
            </div>

          </div>

          {/* RIGHT: CLOD AI + widgets stacked — no empty space */}
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,1vw,12px)" }}>

            {/* CLOD AI */}
            <div style={{ ...S.card, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }} className="glow-ring">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(240,238,233,0.06)", background: "rgba(240,238,233,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: C.goldDim, border: `1px solid ${C.goldLine}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>⚡</div>
                  <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 12, color: C.cream, letterSpacing: "1px", textTransform: "uppercase" }}>Clod AI</div>
                  {isTyping && <div style={{ fontSize: 9, color: C.gold, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", animation: "pulseText 1s infinite alternate" }}>Thinking...</div>}
                </div>
                <button onClick={clearChat} style={{ background: "none", border: "none", fontSize: 10, color: C.muted, cursor: "pointer", fontFamily: F.body }}>✕ Clear</button>
              </div>
              <div style={{ display: "flex", gap: 2, padding: "8px 12px", background: "rgba(240,238,233,0.01)", borderBottom: "1px solid rgba(240,238,233,0.04)" }}>
                {["TUTOR", "REVIEW", "DEBUG", "BRIEF", "WRAP-UP"].map(m => {
                  const modeKey = m.replace("-", "");
                  const isActive = chatMode === modeKey;
                  return (
                    <button key={m} onClick={() => triggerModePrompt(modeKey)}
                      style={{ flex: 1, background: isActive ? C.goldLine : "transparent", color: isActive ? C.ink : C.muted, border: "none", borderRadius: 4, padding: "4px 0", fontSize: 9, fontWeight: isActive ? 700 : 500, cursor: "pointer", fontFamily: F.body, transition: "all .15s" }}>
                      {m}
                    </button>
                  );
                })}
              </div>
              <div style={{ height: "clamp(200px,24vh,360px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px" }}>
                {chatMessages.map((m, i) => (
                  <div key={i} className="chat-msg-in" style={{ padding: "10px 14px", borderRadius: 12, fontSize: 12, lineHeight: 1.6, background: m.role === "clod" ? C.goldDim : "rgba(240,238,233,0.06)", border: `1px solid ${m.role === "clod" ? C.goldLine : "rgba(240,238,233,0.08)"}`, alignSelf: m.role === "clod" ? "flex-start" : "flex-end", borderBottomLeftRadius: m.role === "clod" ? 4 : 12, borderBottomRightRadius: m.role === "user" ? 4 : 12, maxWidth: "92%", color: C.cream, whiteSpace: "pre-wrap" }}>
                    {m.role === "clod" && <div style={{ fontSize: 9, color: C.gold, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4, fontWeight: 700 }}>CLOD</div>}
                    {m.text}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ padding: "10px 14px", borderRadius: 12, background: C.goldDim, border: `1px solid ${C.goldLine}`, alignSelf: "flex-start", display: "flex", gap: 4, alignItems: "center", borderBottomLeftRadius: 4 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, opacity: 0.6, animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: "12px", borderTop: "1px solid rgba(240,238,233,0.06)", background: "rgba(12,12,14,0.6)", display: "flex", gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()} placeholder={`Minta saran Clod [${chatMode}]...`} disabled={isTyping} style={{ ...S.input, flex: 1, fontSize: 12, opacity: isTyping ? 0.5 : 1, padding: "8px 12px", borderRadius: 8 }} />
                <button onClick={sendChat} disabled={isTyping} style={{ background: C.goldLine, color: C.ink, border: "none", borderRadius: 8, padding: "0 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: isTyping ? 0.5 : 1 }}>↑</button>
              </div>
            </div>

            {/* Pomodoro + Session Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(8px,1vw,12px)" }}>
              <div style={{ ...S.card, padding: "clamp(10px,1.2vw,14px)", background: pomActive ? `rgba(232,168,56,0.08)` : C.g1, border: `1px solid ${pomActive ? C.warn + "44" : "rgba(240,238,233,0.08)"}`, marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" }}>Pomodoro</div>
                  {pomActive && <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.warn, animation: "btnPulse 1s infinite" }} />
                    <span style={{ fontSize: 8, color: C.warn, fontWeight: 700 }}>ON</span>
                  </div>}
                </div>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <div style={{ fontFamily: F.display, fontSize: "clamp(22px,2.2vw,32px)", fontWeight: 700, color: pomActive ? C.warn : C.cream, fontVariantNumeric: "tabular-nums", letterSpacing: "2px", lineHeight: 1, textShadow: pomActive ? `0 0 20px ${C.warn}44` : "none" }}>
                    {String(Math.floor(pomTime / 60)).padStart(2, "0")}:{String(pomTime % 60).padStart(2, "0")}
                  </div>
                  <div style={{ height: 3, background: "rgba(240,238,233,0.06)", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
                    <div style={{ width: `${((pomOriginal - pomTime) / Math.max(1, pomOriginal)) * 100}%`, height: "100%", background: C.warn, borderRadius: 3, transition: "width 1s linear" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, marginBottom: 6 }}>
                  {[["25", 25*60], ["45", 45*60], ["90", 90*60], ["5", 5*60]].map(([label, secs]) => (
                    <button key={label} onClick={() => { setPomTime(secs); setPomOriginal(secs); setPomActive(false); }}
                      style={{ fontSize: 8, padding: "3px 0", borderRadius: 4, background: pomTime === secs ? C.goldDim : "rgba(240,238,233,0.04)", border: `1px solid ${pomTime === secs ? C.goldLine : "rgba(240,238,233,0.08)"}`, color: pomTime === secs ? C.gold : C.muted, cursor: "pointer", fontFamily: F.body, fontWeight: 600 }}>
                      {label}m
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setPomActive(!pomActive)} style={{ flex: 2, ...S.btn(pomActive ? C.warn : C.up), padding: "6px 0", fontSize: 9, borderRadius: 6 }}>{pomActive ? "⏸" : "▶ Start"}</button>
                  <button onClick={() => { setPomActive(false); setPomTime(pomOriginal); }} style={{ flex: 1, ...S.btnGhost, padding: "6px 0", fontSize: 9, borderRadius: 6 }}>↺</button>
                </div>
              </div>

              <div style={{ ...S.card, padding: "clamp(10px,1.2vw,14px)", marginBottom: 0 }}>
                <div style={{ ...S.label, marginBottom: 8, fontSize: 9 }}>Session Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { val: done, label: "Done", color: done === cur.tasks.length && done > 0 ? C.up : C.gold },
                    { val: cur.tasks.length - done, label: "Left", color: cur.tasks.length - done > 0 ? C.warn : C.up },
                    { val: prog.soalCount || 0, label: "Soal", color: C.gold },
                    { val: `${Math.round((done / Math.max(1, cur.tasks.length)) * 100)}%`, label: "Rate", color: C.gold },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "6px 4px", background: "rgba(240,238,233,0.03)", borderRadius: 7, border: "1px solid rgba(240,238,233,0.06)" }}>
                      <div style={{ fontFamily: F.display, fontSize: "clamp(16px,1.8vw,22px)", fontWeight: 600, color: item.color }}>{item.val}</div>
                      <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule + Pemahaman mini */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(8px,1vw,12px)" }}>
              <div style={{ ...S.card, padding: "clamp(10px,1.2vw,14px)", marginBottom: 0 }}>
                <div style={{ ...S.label, marginBottom: 8, fontSize: 9 }}>Jadwal Hari Ini</div>
                {(() => {
                  const now = new Date(); const hour = now.getHours() + now.getMinutes() / 60;
                  return schedule.map((s, i) => {
                    const isActive = hour >= s.h && (i === schedule.length - 1 || hour < schedule[i + 1]?.h);
                    return (
                      <div key={i} style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 0", opacity: hour > s.h + (schedule[i+1] ? schedule[i+1].h - s.h : 2) ? 0.4 : 1 }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", flexShrink: 0, background: isActive ? s.c : "rgba(240,238,233,0.15)", boxShadow: isActive ? `0 0 5px ${s.c}` : "none", animation: isActive ? "btnPulse 1.5s infinite" : "none" }} />
                        <span style={{ fontSize: 8, color: C.faint, width: 28, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{s.time}</span>
                        <span style={{ fontSize: 8, color: isActive ? s.c : C.muted, fontWeight: isActive ? 600 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                        {isActive && <span style={{ fontSize: 6, padding: "1px 3px", background: `${s.c}20`, color: s.c, borderRadius: 3, border: `1px solid ${s.c}40`, fontWeight: 700, flexShrink: 0 }}>NOW</span>}
                      </div>
                    );
                  });
                })()}
              </div>

              <div style={{ ...S.card, padding: "clamp(10px,1.2vw,14px)", marginBottom: 0 }}>
                <div style={{ ...S.flexBetween, marginBottom: 8 }}>
                  <div style={{ ...S.label, fontSize: 9 }}>Pemahaman</div>
                  <span style={{ fontSize: 9, color: C.gold, fontWeight: 600 }}>
                    {Math.round(SUBTES.reduce((a, s) => a + (prog.understanding?.[s.id] || 0), 0) / SUBTES.length)}%
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SUBTES.map(s => {
                    const val = prog.understanding?.[s.id] || 0;
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 20, fontSize: 8, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.short}</div>
                        <div style={{ flex: 1, height: 4, background: "rgba(240,238,233,0.06)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${val}%`, height: "100%", background: `linear-gradient(90deg, ${s.color}88, ${s.color})`, borderRadius: 4, transition: "width 0.5s" }} />
                        </div>
                        <div style={{ fontSize: 8, color: val > 70 ? C.up : val > 40 ? C.warn : C.faint, width: 20, textAlign: "right", fontWeight: 600 }}>{val}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pre-Session + Energy */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(8px,1vw,12px)" }}>
              <PreSessionChecklist day={day} />
              <EnergyWidget />
            </div>

          </div>
        </div>
      </div>
      {showSources && <SourceLinksModal onClose={() => setShowSources(false)} filterDay={day} />}
    </PageWrapper>
  );
}

// ── PAGE: 26-DAY PATH ───────────────────────────────────
function PathPage({ progress, setPage, setFocusDay }) {
  const curDay = getCurrentDay();
  const day18Done = progress[18] && Object.values(progress[18].tasks).filter(Boolean).length >= 4;
  return (
    <PageWrapper>
      <div style={S.page} className="resp-page">
        <h1 style={{ ...S.h1, marginBottom: 4 }}>Peta 26 Hari</h1>
        <div style={{ ...S.muted, marginBottom: 20 }}>25 Mar → 20 Apr 2026 · Setiap fase ada konsekuensinya.</div>
        <PhaseBar />
        {PHASES.map(phase => (
          <div key={phase.name} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: phase.color }} />
              <h2 style={{ ...S.h2, color: phase.color, margin: 0 }}>{phase.name}</h2>
              <span style={{ fontSize: 11, color: C.muted }}>Day {phase.days[0]}–{phase.days[phase.days.length - 1]}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
              {phase.days.map(dayNum => {
                const c = CURRICULUM.find(d => d.day === dayNum); if (!c) return null;
                const p = progress[dayNum] || { tasks: {} };
                const doneCnt = Object.values(p.tasks).filter(Boolean).length;
                const total = c.tasks.length;
                const pct = total > 0 ? (doneCnt / total) * 100 : 0;
                const locked = c.locked && !day18Done;
                const isCurrent = dayNum === curDay;
                return (
                  <div key={dayNum}
                    style={{
                      ...S.cardSm, opacity: locked ? 0.4 : 1,
                      border: `1px solid ${isCurrent ? phase.color : "rgba(240,238,233,0.07)"}`,
                      boxShadow: isCurrent ? `0 0 20px ${phase.color}20` : undefined,
                      position: "relative", overflow: "hidden", transition: "all .2s",
                      cursor: locked ? "not-allowed" : "pointer"
                    }}
                    onClick={() => { if (!locked) { setFocusDay(dayNum); setPage("focus"); } }}>
                    {isCurrent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${phase.color},transparent)` }} />}
                    {locked && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(12,12,14,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, borderRadius: 12 }}>
                        <span style={{ fontSize: 11, color: C.muted, textAlign: "center", padding: "0 14px" }}>Fase ini terkunci. Selesaikan yang ada di depanmu.</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: isCurrent ? phase.color : C.cream }}>D{dayNum}</span>
                        <span style={{ fontSize: 10, color: C.faint }}>{c.date.slice(5)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {c.isTO && <span style={S.tag(C.down)}>TO#{c.toNum}</span>}
                        {c.focusSubtes.slice(0, 3).map(id => <SubtesBadge key={id} id={id} small />)}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, margin: "7px 0" }}>{c.title}</div>
                    <ProgressBar pct={pct} color={pct === 100 ? C.up : phase.color} height={3} />
                    <div style={{ fontSize: 10, color: C.faint, marginTop: 5 }}>{doneCnt}/{total} tasks</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

// ── STUDY SESSION LOG ────────────────────────────────────
function StudySessionLog({ progress }) {
  const sessions = [...CURRICULUM].reverse().filter(d => {
    const p = progress[d.day];
    return p && Object.values(p.tasks || {}).filter(Boolean).length > 0;
  }).slice(0, 10);
  if (sessions.length === 0) return (
    <div style={S.card}>
      <h2 style={S.h2}>Session Log</h2>
      <div style={{ fontSize: 13, color: C.muted, padding: "16px 0" }}>Belum ada sesi tercatat.</div>
    </div>
  );
  return (
    <div style={S.card}>
      <h2 style={{ ...S.h2, marginBottom: 20 }}>Session Log</h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {sessions.map((d, i) => {
          const p = progress[d.day];
          const done = Object.values(p.tasks || {}).filter(Boolean).length;
          const total = d.tasks.length;
          const ph = getPhaseForDay(d.day);
          const intention = LS.get(`intention_d${d.day}`, "");
          return (
            <div key={d.day} style={{ display: "flex", gap: 14, paddingBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: done === total ? C.up : ph.color, marginTop: 4, boxShadow: `0 0 6px ${done === total ? C.up : ph.color}66`, flexShrink: 0 }} />
                {i < sessions.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(240,238,233,0.07)", marginTop: 4, minHeight: 20 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 16, borderBottom: i < sessions.length - 1 ? "1px solid rgba(240,238,233,0.04)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: ph.color }}>D{d.day}</span>
                  <span style={{ fontSize: 13, color: C.cream }}>{d.title}</span>
                  <span style={{ fontSize: 11, color: done === total ? C.up : C.muted, marginLeft: "auto" }}>{done === total ? "✓ Done" : `${done}/${total}`}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: intention ? 4 : 0 }}>{d.date} · {d.focusSubtes.slice(0, 4).join(", ")}</div>
                {intention && <div style={{ fontSize: 11, color: C.faint, fontStyle: "italic" }}>"{intention}"</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PAGE: PROFILE ────────────────────────────────────────
function ProfilePage({ progress }) {
  const toHistory = LS.get("to_history", []);
  const latestScores = LS.get("latest_scores", null);
  const prevScores = toHistory.length > 1 ? toHistory[toHistory.length - 2].scores : null;
  const curDay = getCurrentDay();
  const totalSoal = Object.values(progress).reduce((a, p) => a + (p.soalCount || 0), 0);
  const totalDone = Object.values(progress).reduce((a, p) => a + Object.values(p.tasks || {}).filter(Boolean).length, 0);
  const totalAll = CURRICULUM.reduce((a, c) => a + c.tasks.length, 0);
  const streak = (() => { let s = 0; for (let d = curDay - 1; d >= 1; d--) { if (Object.values(progress[d]?.tasks || {}).filter(Boolean).length > 0) s++; else break; } return s; })();
  const avgUnderstanding = (() => {
    let sum = 0, cnt = 0;
    for (let d = 1; d <= curDay; d++) SUBTES.forEach(s => { const v = progress[d]?.understanding?.[s.id]; if (v > 0) { sum += v; cnt++; } });
    return cnt > 0 ? Math.round(sum / cnt) : 0;
  })();
  const latestTotal = toHistory.length > 0 ? toHistory[toHistory.length - 1].total : null;
  const outputProx = latestTotal ? Math.min(100, Math.round((latestTotal / 700) * 100)) : 0;
  const lastIntention = (() => { for (let d = curDay; d >= 1; d--) { const v = LS.get(`intention_d${d}`, ""); if (v) return { day: d, text: v }; } return null; })();
  const checkpoints = [{ day: 1, label: "Base", y: 88 }, { day: 7, label: "Camp 1", y: 70 }, { day: 14, label: "Camp 2", y: 50 }, { day: 21, label: "Camp 3", y: 28 }, { day: 26, label: "Summit", y: 8 }];

  // Editable profile state
  const [profileName, setProfileName] = useState(() => LS.get("profile_name", "Pex"));
  const [profileBio, setProfileBio] = useState(() => LS.get("profile_bio", "Gapyear · Bekasi · Target IPB 2026"));
  const [profileTarget, setProfileTarget] = useState(() => LS.get("profile_target", "IPB 2026"));
  const [editingProfile, setEditingProfile] = useState(false);

  const saveProfile = () => {
    LS.set("profile_name", profileName);
    LS.set("profile_bio", profileBio);
    LS.set("profile_target", profileTarget);
    setEditingProfile(false);
  };

  return (
    <PageWrapper>
      <div style={S.page} className="resp-page">
        <h1 style={{ ...S.h1, marginBottom: 4 }}>Profil — UTBK 26</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, marginBottom: 4, flexWrap: "wrap" }}>
          {editingProfile ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Nama"
                style={{ ...S.input, width: 140, fontSize: 13, padding: "6px 10px" }} />
              <input value={profileBio} onChange={e => setProfileBio(e.target.value)} placeholder="Bio"
                style={{ ...S.input, width: 280, fontSize: 13, padding: "6px 10px" }} />
              <input value={profileTarget} onChange={e => setProfileTarget(e.target.value)} placeholder="Target"
                style={{ ...S.input, width: 120, fontSize: 13, padding: "6px 10px" }} />
              <button onClick={saveProfile} style={{ ...S.btn(), padding: "6px 14px", fontSize: 11 }}>Simpan</button>
              <button onClick={() => setEditingProfile(false)} style={{ ...S.btnGhost, padding: "6px 12px", fontSize: 11 }}>Batal</button>
            </div>
          ) : (
            <>
              <div style={S.muted}>{profileBio}</div>
              <button onClick={() => setEditingProfile(true)} style={{ ...S.btnGold, fontSize: 11, padding: "5px 11px", display: "flex", alignItems: "center", gap: 4 }}>
                ✎ Edit Profil
              </button>
            </>
          )}
          <button onClick={() => exportProgressReport(progress, LS.get("to_history", []))} style={{ ...S.btnGold, fontSize: 11, padding: "5px 11px", marginLeft: editingProfile ? 0 : 12, display: "flex", alignItems: "center", gap: 4 }}>
            ↓ Export Report
          </button>
          <button onClick={() => exportTOCSV(LS.get("to_history", []))} style={{ ...S.btnGold, fontSize: 11, padding: "5px 11px", display: "flex", alignItems: "center", gap: 4 }}>
            ↓ TO CSV
          </button>
        </div>
        {lastIntention && (
          <div style={{ ...S.cardSm, borderLeft: `2px solid rgba(200,169,110,0.3)`, marginTop: 12, marginBottom: 4 }}>
            <div style={{ ...S.label, marginBottom: 4 }}>Last Declared Intention · D{lastIntention.day}</div>
            <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>"{lastIntention.text}"</div>
          </div>
        )}
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 14, marginTop: 20 }} className="resp-grid-6-3">
          <StatCard label="Estimasi Skor" value={latestTotal || "—"} color={latestTotal && latestTotal >= 700 ? C.up : C.down} />
          <StatCard label="Total Soal" value={totalSoal} color={C.gold} />
          <StatCard label="Streak" value={`${streak}d`} color={C.gold} />
          <StatCard label="Tryout" value={`${toHistory.length}/7`} color={C.gold} />
          <StatCard label="Tasks" value={`${totalDone}/${totalAll}`} color={C.gold} />
          <StatCard label="Avg Paham" value={`${avgUnderstanding}%`} color={C.up} />
        </div>
        <div style={S.grid2} className="resp-grid-2-1">
          {/* Mountain */}
          <div style={S.card}>
            <h2 style={S.h2}>Progress</h2>
            <svg viewBox="0 0 400 120" style={{ width: "100%" }}>
              <defs>
                <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.gold} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={C.gold} stopOpacity="0.04" />
                </linearGradient>
              </defs>
              <polygon points="0,110 50,90 120,65 200,45 300,25 370,12 400,8 400,110" fill="url(#mtn)" stroke={C.gold} strokeWidth="1.5" />
              {checkpoints.map((cp, i) => {
                const x = (cp.day / 26) * 380 + 10; const reached = curDay >= cp.day;
                return (
                  <g key={i}>
                    <circle cx={x} cy={cp.y} r={reached ? 6 : 4} fill={reached ? C.up : C.inkMid} stroke={reached ? C.up : "rgba(240,238,233,0.2)"} strokeWidth={1.5} />
                    <text x={x} y={cp.y + 16} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily={F.body}>{cp.label}</text>
                    <text x={x} y={cp.y - 10} textAnchor="middle" fill={reached ? C.up : C.muted} fontSize="8" fontFamily={F.body} fontWeight="600">D{cp.day}</text>
                  </g>
                );
              })}
              <circle cx={(curDay / 26) * 380 + 10} cy={90 - (curDay / 26) * 80} r={5} fill={C.gold} style={{ filter: `drop-shadow(0 0 5px ${C.gold})` }}>
                <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          {/* Spider */}
          <div style={S.card}>
            <h2 style={S.h2}>Radar Subtes</h2>
            {latestScores
              ? <SpiderChart scores={latestScores} prevScores={prevScores} />
              : <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Upload hasil TO untuk melihat radar.</div>}
          </div>
        </div>
        {/* Output Proximity */}
        <div style={S.card}>
          <div style={S.flexBetween}>
            <h2 style={S.h2}>Output Proximity — Skor 700</h2>
            <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: outputProx >= 100 ? C.up : C.down }}>{outputProx}%</span>
          </div>
          <ProgressBar pct={outputProx} color={outputProx >= 100 ? C.up : C.gold} height={10} />
          {!latestScores && <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Upload hasil TO untuk kalkulasi proximity.</div>}
          {latestScores && (
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {SUBTES.map(s => {
                const score = latestScores[s.id] || 0; const gap = s.target - score;
                return (
                  <div key={s.id} style={{ flex: "1 0 110px", padding: 10, background: `${C.gold}09`, borderRadius: 10, border: `1px solid ${C.gold}20` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.gold }}>{s.short}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.cream }}>{score}</span>
                    </div>
                    <div style={{ fontSize: 10, color: gap > 0 ? C.warn : C.up }}>{gap > 0 ? `Gap -${gap}` : "✓ Target"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <WeaknessDetector />
        <StudySessionLog progress={progress} />
        {toHistory.length > 0 && (
          <div style={S.card}>
            <h2 style={S.h2}>TO History</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: F.body }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(240,238,233,0.07)" }}>
                    <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>TO</th>
                    <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tanggal</th>
                    {SUBTES.map(s => <th key={s.id} style={{ padding: "8px 4px", textAlign: "center", color: C.gold, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.short}</th>)}
                    <th style={{ padding: "8px 6px", textAlign: "center", color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {toHistory.map((to, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(240,238,233,0.04)" }}>
                      <td style={{ padding: "7px 6px", fontWeight: 600, color: C.cream }}>{to.id}</td>
                      <td style={{ padding: "7px 6px", color: C.muted }}>{to.date}</td>
                      {SUBTES.map(s => (
                        <td key={s.id} style={{ padding: "7px 4px", textAlign: "center", color: (to.scores[s.id] || 0) >= s.target ? C.up : C.cream }}>{to.scores[s.id] || "—"}</td>
                      ))}
                      <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: 700, color: to.total >= 700 ? C.up : C.down }}>{to.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16 }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={toHistory.map((t, i) => { const d = { name: t.id }; SUBTES.forEach(s => d[s.short] = t.scores[s.id] || 0); d.total = t.total; return d; })}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,238,233,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10, fontFamily: F.body }} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10, fontFamily: F.body }} />
                  <Tooltip contentStyle={{ background: "rgba(12,12,14,0.92)", border: `1px solid ${C.goldLine}`, borderRadius: 10, fontSize: 11, fontFamily: F.body, backdropFilter: "blur(16px)" }} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: F.body }} />
                  {SUBTES.map(s => <Line key={s.id} type="monotone" dataKey={s.short} stroke={C.gold} strokeWidth={1.5} dot={{ r: 3 }} strokeOpacity={0.7} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* DAILY HEATMAP */}
        <div style={{ ...S.card }}>
          <div style={{ ...S.flexBetween, marginBottom: 14 }}>
            <div style={S.label}>Daily Progress Heatmap</div>
            <div style={{ fontSize: 10, color: C.muted }}>26 Hari</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: 4 }}>
            {CURRICULUM.map(d => {
              const p = progress[d.day] || { tasks: {} };
              const done = Object.values(p.tasks).filter(Boolean).length;
              const total = d.tasks.length;
              const pct = total > 0 ? (done / total) * 100 : 0;
              const isToday = d.day === curDay;
              const bg = pct >= 100 ? C.up : pct >= 60 ? C.gold : pct >= 20 ? C.warn : "rgba(240,238,233,0.05)";
              return (
                <div key={d.day} title={`D${d.day}: ${d.title} — ${Math.round(pct)}%`} style={{
                  aspectRatio: "1", borderRadius: 4, background: bg, opacity: pct > 0 ? 1 : 0.3,
                  border: `1px solid ${isToday ? C.gold : "transparent"}`, boxShadow: isToday ? `0 0 8px ${C.gold}44` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "rgba(0,0,0,0.6)", fontWeight: 700
                }}>{d.day}</div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 9, color: C.muted }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: C.up }} /> Done</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: C.gold }} /> Partial</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: C.warn }} /> Started</div>
          </div>
        </div>

        {/* WEEKLY BREAKDOWN */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="resp-grid-4-2">
          <div style={{ ...S.card }}>
            <div style={{ ...S.label, marginBottom: 12 }}>Weekly Breakdown</div>
            {[1,2,3,4].map(w => {
              const days = CURRICULUM.filter(d => d.day >= (w-1)*7+1 && d.day <= w*7);
              const done = days.reduce((a, d) => a + Object.values(progress[d.day]?.tasks || {}).filter(Boolean).length, 0);
              const total = days.reduce((a, d) => a + d.tasks.length, 0);
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={w} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: C.muted, width: 20, flexShrink: 0 }}>W{w}</div>
                  <div style={{ flex: 1, height: 6, background: "rgba(240,238,233,0.06)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: C.gold, borderRadius: 6, transition: "width 0.8s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.gold, width: 28, textAlign: "right", fontWeight: 600 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
          <div style={{ ...S.card }}>
            <div style={{ ...S.label, marginBottom: 12 }}>Attendance Stats</div>
            {[
              { label: "On Time (started ≥1 task)", val: Object.values(progress).filter(p => Object.values(p.tasks || {}).some(Boolean)).length, color: C.up },
              { label: "Full Complete (100%)", val: CURRICULUM.filter(d => { const p = progress[d.day]; const dn = Object.values(p?.tasks || {}).filter(Boolean).length; return dn === d.tasks.length && d.tasks.length > 0; }).length, color: C.gold },
              { label: "Missing (0% done)", val: CURRICULUM.filter(d => d.day < curDay && Object.values(progress[d.day]?.tasks || {}).filter(Boolean).length === 0).length, color: C.down },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(240,238,233,0.04)" }}>
                <span style={{ fontSize: 10, color: C.muted }}>{item.label}</span>
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS ANALYTICS — task completion per day */}
        <div style={{ ...S.card }}>
          <div style={{ ...S.flexBetween, marginBottom: 14 }}>
            <div style={S.label}>Progress Analytics — Task Completion per Day</div>
            <span style={{ fontSize: 9, color: C.muted }}>Day {curDay}/26</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={CURRICULUM.map(d => {
              const p = progress[d.day] || { tasks: {} };
              const dn = Object.values(p.tasks).filter(Boolean).length;
              const tt = d.tasks.length;
              return { day: `D${d.day}`, pct: tt > 0 ? Math.round((dn / tt) * 100) : 0 };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,238,233,0.05)" />
              <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 9, fontFamily: F.body }} interval={2} />
              <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 9, fontFamily: F.body }} unit="%" />
              <Tooltip contentStyle={{ background: "rgba(12,12,14,0.92)", border: `1px solid ${C.goldLine}`, borderRadius: 10, fontSize: 11, fontFamily: F.body }} />
              <Line type="monotone" dataKey="pct" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageWrapper>
  );
}

// ── PAGE ANIMATION WRAPPER ───────────────────────────────
function PageWrapper({ children }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  return (
    <div style={{
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)"
    }}>
      {children}
    </div>
  );
}

// ── PAGE: DAILY REPORT ────────────────────────────────────
function DailyReportPage({ progress }) {
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState(() => LS.get("saved_reports", {}));
  const toHistory = LS.get("to_history", []);
  const curDay = getCurrentDay();
  const cur = CURRICULUM.find(d => d.day === selectedDay) || CURRICULUM[0];
  const prog = progress[selectedDay] || { tasks: {}, understanding: {}, notes: "", soalCount: 0 };
  const done = Object.values(prog.tasks).filter(Boolean).length;
  const total = cur.tasks.length;
  const understanding = SUBTES.reduce((a, s) => a + (prog.understanding?.[s.id] || 0), 0) / SUBTES.length;

  const generateReport = async () => {
    setLoading(true);
    const prompt = `Buat laporan belajar harian yang ringkas dan analytical untuk:
Day ${selectedDay}/26 — ${cur.title}
Fase: ${cur.phase}
Subtes fokus: ${cur.focusSubtes.join(", ")}
Tasks selesai: ${done}/${total} (${Math.round(done / Math.max(1, total) * 100)}%)
Soal dikerjakan: ${prog.soalCount || 0}
Rata-rata pemahaman: ${Math.round(understanding)}%
Catatan: ${prog.notes || "(kosong)"}
${toHistory.length > 0 ? `Skor TO terakhir: ${toHistory[toHistory.length - 1].total}` : ""}

Format output:
## Ringkasan
[2-3 kalimat]

## Yang Berhasil
[2-3 poin]

## Gap & Prioritas
[2-3 poin]

## Rencana Besok
[1-2 poin konkret]

Gunakan bahasa Indonesia. Presisi, tidak berlebihan.`;

    const messages = [{ role: "user", content: prompt }];
    const result = await callClodAI(messages);
    setReport(result);
    const updated = { ...savedReports, [selectedDay]: { text: result, date: new Date().toISOString().slice(0, 10) } };
    setSavedReports(updated); LS.set("saved_reports", updated);
    setLoading(false);
  };

  const downloadReport = () => {
    if (!report && !savedReports[selectedDay]) return;
    const text = report || savedReports[selectedDay]?.text || "";
    downloadText(`UTBK_26 Daily Report — Day ${selectedDay}\n${cur.title}\n${new Date().toLocaleDateString("id-ID")}\n\n${text}`,
      `utbk26-report-day${selectedDay}.txt`);
  };

  return (
    <PageWrapper>
      <div style={S.page} className="resp-page">
        <div style={S.flexBetween}>
          <div>
            <h1 style={S.h1}>Daily Report</h1>
            <div style={{ ...S.muted, marginTop: 4 }}>Generate & simpan laporan harian dengan AI</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => exportProgressReport(progress, toHistory)} style={{ ...S.btnGold, display: "flex", alignItems: "center", gap: 5 }}>
              <span>↓</span> Export Lengkap
            </button>
            <button onClick={() => exportTOCSV(toHistory)} style={{ ...S.btnGold, display: "flex", alignItems: "center", gap: 5 }}>
              <span>↓</span> TO CSV
            </button>
          </div>
        </div>

        {/* Day selector */}
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={S.flexBetween}>
            <h2 style={S.h2}>Pilih Hari</h2>
            <div style={{ ...S.badge(done === total && total > 0 ? C.up : C.gold), fontSize: 11 }}>{done}/{total} tasks</div>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {CURRICULUM.map(d => {
              const p = progress[d.day] || { tasks: {} };
              const dp = Object.values(p.tasks || {}).filter(Boolean).length;
              const dt = d.tasks.length;
              const hasSaved = !!savedReports[d.day];
              return (
                <div key={d.day} onClick={() => setSelectedDay(d.day)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all .15s", fontSize: 11,
                    background: selectedDay === d.day ? C.goldDim : (dp === dt && dt > 0 ? `${C.up}15` : "rgba(240,238,233,0.03)"),
                    border: `1px solid ${selectedDay === d.day ? C.goldLine : (dp === dt && dt > 0 ? `${C.up}35` : "rgba(240,238,233,0.07)")}`,
                    color: selectedDay === d.day ? C.gold : (dp === dt && dt > 0 ? C.up : C.muted),
                    fontWeight: selectedDay === d.day ? 600 : 400,
                    position: "relative"
                  }}>
                  {d.day}
                  {hasSaved && <div style={{ position: "absolute", top: 2, right: 2, width: 4, height: 4, borderRadius: "50%", background: C.gold }} />}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, padding: "14px 0", borderTop: "1px solid rgba(240,238,233,0.06)" }}>
            <div style={{ fontFamily: F.display, fontSize: 18, color: C.cream, marginBottom: 4 }}>{cur.title}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{cur.date} · {cur.phase} · {cur.focusSubtes.join(", ")}</div>
          </div>
        </div>

        <div style={S.grid2} className="resp-grid-2-1">
          {/* Report generator */}
          <div>
            <div style={S.card}>
              <div style={S.flexBetween}>
                <h2 style={S.h2}>Laporan AI</h2>
                {(report || savedReports[selectedDay]) && (
                  <button onClick={downloadReport} style={{ ...S.btnGold, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                    ↓ Download
                  </button>
                )}
              </div>
              {savedReports[selectedDay] && !report && (
                <div style={{ ...S.cardSm, marginBottom: 14, background: `${C.up}0a`, border: `1px solid ${C.up}25` }}>
                  <div style={{ fontSize: 11, color: C.up }}>Laporan tersimpan dari {savedReports[selectedDay].date}</div>
                </div>
              )}
              <div style={{
                minHeight: 180, padding: 16, background: "rgba(240,238,233,0.02)", borderRadius: 12,
                border: "1px solid rgba(240,238,233,0.06)", fontSize: 13, color: C.muted, lineHeight: 1.75,
                whiteSpace: "pre-wrap", fontFamily: F.body, marginBottom: 14
              }}>
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 12 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, animation: `typingDot 1.2s ease ${i * 0.2}s infinite` }} />)}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>AI sedang menulis laporan…</div>
                  </div>
                ) : (report || savedReports[selectedDay]?.text) ? (
                  <div style={{ color: C.cream }}>{report || savedReports[selectedDay].text}</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 8 }}>
                    <div style={{ fontSize: 32, opacity: 0.2 }}>◇</div>
                    <div>Klik tombol untuk generate laporan hari ini.</div>
                  </div>
                )}
              </div>
              <button onClick={generateReport} disabled={loading} style={{ ...S.btn(), width: "100%", opacity: loading ? 0.5 : 1 }}>
                {loading ? "Generating..." : savedReports[selectedDay] ? "Regenerate Laporan" : "Generate Laporan"}
              </button>
            </div>
          </div>

          {/* Stats sidebar */}
          <div>
            <div style={S.card}>
              <h2 style={S.h2}>Statistik Day {selectedDay}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ ...S.label, marginBottom: 6 }}>Progress Tasks</div>
                  <ProgressBar pct={Math.round((done / Math.max(1, total)) * 100)} color={done === total && total > 0 ? C.up : C.gold} height={6} showLabel />
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{done}/{total} tasks selesai</div>
                </div>
                <div>
                  <div style={{ ...S.label, marginBottom: 6 }}>Rata-rata Pemahaman</div>
                  <ProgressBar pct={Math.round(understanding)} color={C.gold} height={6} showLabel />
                </div>
                <div>
                  <div style={{ ...S.label, marginBottom: 6 }}>Soal Dikerjakan</div>
                  <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 600, color: C.gold }}>{prog.soalCount || 0}</div>
                </div>
              </div>
            </div>
            {/* Pemahaman per subtes */}
            <div style={S.card}>
              <h2 style={S.h2}>Pemahaman per Subtes</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SUBTES.map(s => (
                  <SliderWithTrack key={s.id} label={s.short} value={prog.understanding?.[s.id] || 0} onChange={() => { }} color={C.gold} showValue />
                ))}
              </div>
            </div>
            {/* TO History mini */}
            {toHistory.length > 0 && (
              <div style={S.card}>
                <div style={S.flexBetween}>
                  <h2 style={S.h2}>TO Scores</h2>
                  <button onClick={() => exportTOCSV(toHistory)} style={{ ...S.btnGold, fontSize: 10, padding: "4px 8px" }}>↓ CSV</button>
                </div>
                {toHistory.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(240,238,233,0.05)" }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{t.id} · {t.date}</span>
                    <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: t.total >= 700 ? C.up : C.down }}>{t.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ANALYTICS CHARTS — Full width below the 2-col layout */}
        <div style={{ marginTop: 20 }}>
          {/* Task Completion History Chart */}
          <div style={{ ...S.card }}>
            <div style={{ ...S.label, marginBottom: 14 }}>Task Completion History — All Days</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={CURRICULUM.map(d => {
                const p = progress[d.day] || { tasks: {} };
                const dn = Object.values(p.tasks).filter(Boolean).length;
                const tt = d.tasks.length;
                return { day: `D${d.day}`, pct: tt > 0 ? Math.round((dn / tt) * 100) : 0, done: dn, total: tt };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,238,233,0.05)" />
                <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 9, fontFamily: F.body }} interval={2} />
                <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 9, fontFamily: F.body }} unit="%" />
                <Tooltip contentStyle={{ background: "rgba(12,12,14,0.92)", border: `1px solid ${C.goldLine}`, borderRadius: 10, fontSize: 11, fontFamily: F.body }} formatter={(v) => [`${v}%`, "Selesai"]} />
                <Line type="monotone" dataKey="pct" stroke={C.gold} strokeWidth={2} dot={{ fill: C.gold, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subtes Understanding Bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="resp-grid-4-2">
            {SUBTES.map(s => {
              const vals = Object.values(progress).map(p => p.understanding?.[s.id] || 0);
              const avg = vals.filter(v => v > 0).length > 0 ? Math.round(vals.filter(v => v > 0).reduce((a, b) => a + b, 0) / vals.filter(v => v > 0).length) : 0;
              return (
                <div key={s.id} style={{ ...S.cardSm }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.short}</div>
                    <div style={{ fontSize: 10, color: avg > 70 ? C.up : avg > 40 ? C.warn : C.muted, fontWeight: 600 }}>{avg}% avg</div>
                  </div>
                  <div style={{ height: 6, background: "rgba(240,238,233,0.06)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${avg}%`, height: "100%", background: `linear-gradient(90deg, ${s.color}88, ${s.color})`, borderRadius: 6, transition: "width 0.8s" }} />
                  </div>
                  <div style={{ fontSize: 9, color: C.faint, marginTop: 4 }}>{s.name}</div>
                </div>
              );
            })}
          </div>

          {/* Soal per Day bar */}
          <div style={{ ...S.card }}>
            <div style={{ ...S.label, marginBottom: 14 }}>Soal Dikerjakan per Hari</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={CURRICULUM.map(d => {
                const p = progress[d.day] || {};
                return { day: `D${d.day}`, soal: p.soalCount || 0 };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,238,233,0.05)" />
                <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 9, fontFamily: F.body }} interval={3} />
                <YAxis tick={{ fill: C.muted, fontSize: 9, fontFamily: F.body }} />
                <Tooltip contentStyle={{ background: "rgba(12,12,14,0.92)", border: `1px solid ${C.goldLine}`, borderRadius: 10, fontSize: 11, fontFamily: F.body }} />
                <Line type="monotone" dataKey="soal" stroke={C.up} strokeWidth={2} dot={{ fill: C.up, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ── PAGE: SCHEDULE ───────────────────────────────────────
function SchedulePage() {
  const schedNormal = [
    { time: "05:30", label: "Wake up · Prep · Breakfast", dur: "30m", color: C.muted },
    { time: "06:00", label: "Warm-up — Active learning 1.5x · structured notes", dur: "2h", color: C.gold },
    { time: "08:00", label: "Focus Block 1 — 50+ problems on priority subtest", dur: "3.5h", color: C.down },
    { time: "11:30", label: "Midday break", dur: "30m", color: C.muted },
    { time: "12:00", label: "Focus Block 2 — 50+ problems on secondary subtest", dur: "3.5h", color: C.warn },
    { time: "15:30", label: "Break", dur: "30m", color: C.muted },
    { time: "16:00", label: "Focus Block 3 — Error drill · supplementary", dur: "2h", color: C.gold },
    { time: "18:00", label: "Recharge · Dinner", dur: "1.5h", color: C.muted },
    { time: "19:30", label: "Review — Error analysis · notes · tomorrow plan", dur: "2h", color: C.up },
    { time: "21:30", label: "Wind down · planning", dur: "30m", color: C.muted },
    { time: "22:00", label: "Rest", dur: "", color: C.up },
  ];
  const schedTO = [
    { time: "07:30", label: "Full Simulation — Strict test conditions", dur: "4h", color: C.down },
    { time: "11:30", label: "Break", dur: "1.5h", color: C.muted },
    { time: "13:00", label: "Intensive error review", dur: "3h", color: C.warn },
    { time: "16:00", label: "Error analysis · next day targets", dur: "2h", color: C.gold },
    { time: "18:00", label: "Break · Recharge", dur: "1.5h", color: C.muted },
    { time: "19:30", label: "Review — Final consolidation", dur: "2h", color: C.up },
    { time: "22:00", label: "Rest", dur: "", color: C.up },
  ];
  return (
    <PageWrapper>
      <div style={S.page} className="resp-page">
        <h1 style={{ ...S.h1, marginBottom: 4 }}>Jadwal Harian</h1>
        <div style={{ ...S.muted, marginBottom: 24 }}>~12–13 jam efektif per hari · Mulai sebelum 06:15 = sistem berjalan.</div>
        <div style={S.grid2} className="resp-grid-2-1">
          {[["Hari Normal", schedNormal], ["Hari TO", schedTO]].map(([title, sched]) => (
            <div key={title} style={S.card}>
              <h2 style={{ ...S.h2, color: title === "Hari TO" ? C.down : C.gold }}>{title}</h2>
              {sched.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: "1px solid rgba(240,238,233,0.04)" }}>
                  <span style={{ fontSize: 12, color: item.color, fontWeight: 600, width: 46, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{item.time}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: C.cream }}>{item.label}</div>
                    {item.dur && <span style={{ fontSize: 10, color: C.faint }}>{item.dur}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

// ── PAGE: METHOD ─────────────────────────────────────────
function MethodPage() {
  return (
    <PageWrapper>
      <div style={S.page} className="resp-page">
        <h1 style={{ ...S.h1, marginBottom: 4 }}>System & Method</h1>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.7, maxWidth: 560 }}>
          A structured approach to systematic score improvement.
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>Learning Split</h2>
          <div style={{ display: "flex", gap: 4, borderRadius: 10, overflow: "hidden", height: 40, marginBottom: 16 }}>
            {[["15%", "Materi", C.muted, "15%"], [" 15%", "Diskusi", C.gold, "15%"], ["70%", "Latihan Soal", C.down, "70%"]].map(([pct, label, color, w]) => (
              <div key={label} style={{ width: w, background: `${color}25`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}</span>
                <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75 }}>
            15% materi — pengetahuan tanpa eksekusi tidak berguna. 15% diskusi — berpikir sendirian ada batasnya. 70% latihan soal — UTBK tidak menguji seberapa paham kamu, tapi seberapa cepat.
          </p>
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>6 Daily Phases</h2>
          {[
            { name: "WARM-UP", time: "06:00–08:00", desc: "Active learning: video at 1.5x. Take structured notes. No passive consumption.", color: C.gold },
            { name: "BLOCK 1", time: "08:00–11:30", desc: "50+ problems on priority subtest. Timer active. Zero distractions.", color: C.down },
            { name: "BLOCK 2", time: "12:00–15:30", desc: "50+ problems on secondary subtest. Same intensity.", color: C.warn },
            { name: "BLOCK 3", time: "16:00–18:00", desc: "Error review. Weak topics. Supplementary subtests.", color: C.gold },
            { name: "SIMULATION", time: "TO Days", desc: "Full simulation per schedule. 7 sessions total. Strict test conditions.", color: C.up },
            { name: "REVIEW", time: "19:30–21:30", desc: "Error analysis + notes update + tomorrow's plan. This is the differentiator.", color: C.up },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(240,238,233,0.05)" }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: f.color, width: 90, flexShrink: 0, letterSpacing: "0.04em" }}>{f.name}</span>
              <span style={{ fontSize: 11, color: C.faint, width: 96, flexShrink: 0 }}>{f.time}</span>
              <span style={{ fontSize: 13, color: C.cream, lineHeight: 1.5 }}>{f.desc}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>Principles</h2>
          {[
            { q: "You do not rise to the level of your goals. You fall to the level of your systems.", a: "James Clear" },
            { q: "Professionals practice until they can't get it wrong.", a: "Anonymous" },
            { q: "Compound effort. Small daily gains create exponential results.", a: "—" },
            { q: "Direction matters more than speed. Verify your approach.", a: "Gandhi" },
            { q: "No practice is wasted. Feedback loops require input.", a: "—" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid rgba(240,238,233,0.05)" }}>
              <div style={{ fontFamily: F.display, fontSize: 15, color: C.cream, fontStyle: "italic", lineHeight: 1.6, marginBottom: 4 }}>"{item.q}"</div>
              <div style={{ fontSize: 11, color: C.faint }}>— {item.a}</div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>Platform</h2>
          <div style={S.grid2} className="resp-grid-2-1">
            {[
              { cat: "Materi", items: ["Mantappu AmbiSNBT", "Z Academy", "Zenius YouTube"] },
              { cat: "Drill Soal", items: ["aimasukptn.com (utama)", "SainsIn", "Ruanguji"] },
              { cat: "Tryout", items: ["SainsIn", "Ruanguji", "SIAPPTN", "tryout.id", "snbt.id"] },
              { cat: "Analisis", items: ["Upload Analyzer (built-in)", "Spider Radar", "Error Notes"] },
            ].map((g, i) => (
              <div key={i} style={S.cardSm}>
                <div style={{ ...S.label, color: C.gold, marginBottom: 8 }}>{g.cat}</div>
                {g.items.map((item, j) => <div key={j} style={{ fontSize: 12, color: C.muted, padding: "3px 0" }}>· {item}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ── MAIN APP ─────────────────────────────────────────────
// ── SCHEDULE SIDEBAR ──────────────────────────────────────
function ScheduleSidebar({ page, setPage, progress }) {
  const curDay = getCurrentDay();
  const cur = CURRICULUM.find(d => d.day === curDay) || CURRICULUM[0];
  const phase = getPhaseForDay(curDay);
  const todayProg = progress[curDay] || { tasks: {} };
  const todayDone = Object.values(todayProg.tasks).filter(Boolean).length;
  const todayTotal = cur.tasks.length;
  const pct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const now = new Date();
  const hour = now.getHours();

  const schedule = [
    { t: "06:00", h: 6, l: "Warm-up", c: C.gold, ico: "◆" },
    { t: "08:00", h: 8, l: "Focus Block 1", c: C.down, ico: "▸" },
    { t: "11:30", h: 11.5, l: "Break", c: C.muted, ico: "○" },
    { t: "12:00", h: 12, l: "Focus Block 2", c: C.warn, ico: "▸" },
    { t: "15:30", h: 15.5, l: "Break", c: C.muted, ico: "○" },
    { t: "16:00", h: 16, l: "Focus Block 3", c: C.gold, ico: "◆" },
    { t: "18:00", h: 18, l: "Recharge", c: C.muted, ico: "○" },
    { t: "19:30", h: 19.5, l: "Review", c: C.up, ico: "✦" },
    { t: "22:00", h: 22, l: "Rest", c: C.up, ico: "◇" },
  ];
  const activeIdx = schedule.reduce((a, s, i) => hour >= s.h ? i : a, 0);

  return (
    <div className="app-sidebar" style={{
      background: "rgba(12,12,14,0.6)", backdropFilter: "blur(20px) saturate(160%)",
      WebkitBackdropFilter: "blur(20px) saturate(160%)",
      borderRight: "1px solid rgba(240,238,233,0.06)",
      display: "flex", flexDirection: "column", padding: "16px 0",
      height: "100vh", overflowY: "auto", overflowX: "hidden",
    }}>
      {/* Day badge */}
      <div style={{ padding: "8px 16px", marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg,${phase.color}44,${phase.color}22)`,
          border: `1px solid ${phase.color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: phase.color, fontFamily: F.body
        }}>
          {curDay}
        </div>
        <div className="sb-label" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.cream }}>{cur.title}</div>
          <div style={{ fontSize: 9, color: phase.color, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{phase.name}</div>
        </div>
      </div>

      {/* Mini progress */}
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <div style={{ height: 3, background: "rgba(240,238,233,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? C.up : C.gold, borderRadius: 3, transition: "width 0.5s" }} />
        </div>
        <div className="sb-label" style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>{todayDone}/{todayTotal}</div>
      </div>

      <div style={{ width: "80%", margin: "0 auto 12px", height: 1, background: "rgba(240,238,233,0.06)" }} />

      {/* Page nav icons */}
      <div style={{ padding: "0 8px", marginBottom: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        {[
          { id: "dashboard", icon: "⊞", label: "Dashboard" },
          { id: "focus", icon: "◎", label: "Focus" },
          { id: "path", icon: "◇", label: "26 Hari" },
          { id: "report", icon: "≡", label: "Report" },
        ].map(n => (
          <div key={n.id} onClick={() => setPage(n.id)} className={`sb-item ${page === n.id ? "sb-active" : ""}`}
            style={{ color: page === n.id ? C.gold : undefined }}>
            <span style={{ fontSize: 14, width: 16, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
            <span className="sb-label" style={{ fontSize: 11 }}>{n.label}</span>
          </div>
        ))}
      </div>

      <div style={{ width: "80%", margin: "0 auto 8px", height: 1, background: "rgba(240,238,233,0.06)" }} />

      {/* Schedule items */}
      <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {schedule.map((s, i) => (
          <div key={i} className={`sb-item ${i === activeIdx ? "sb-active" : ""}`}
            style={{
              color: i === activeIdx ? s.c : undefined, fontSize: 12,
              background: i === activeIdx ? `${s.c}12` : undefined
            }}>
            <span style={{ fontSize: 13, width: 16, textAlign: "center", flexShrink: 0 }}>{s.ico}</span>
            <span className="sb-label" style={{ fontSize: 10, color: C.faint, width: 36, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{s.t}</span>
            <span className="sb-label" style={{ fontSize: 12, fontWeight: i === activeIdx ? 600 : 400 }}>{s.l}</span>
            {i === activeIdx && <span className="sb-label" style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: s.c, boxShadow: `0 0 8px ${s.c}`, flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      <div style={{ width: "80%", margin: "12px auto", height: 1, background: "rgba(240,238,233,0.06)" }} />

      {/* 26-day mini nav */}
      <div style={{ padding: "0 10px", flex: 1 }}>
        <div className="sb-label" style={{ ...S.label, fontSize: 8, marginBottom: 6, padding: "0 6px" }}>26 HARI</div>
        {/* Grid visible when collapsed */}
        <div className="sb-days-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, padding: "0 2px" }}>
          {CURRICULUM.slice(0, 26).map(d => {
            const p = progress[d.day] || { tasks: {} };
            const dn = Object.values(p.tasks).filter(Boolean).length;
            const tt = d.tasks.length;
            const dp = tt > 0 ? (dn / tt) * 100 : 0;
            return (
              <div key={d.day} onClick={() => setPage("focus")}
                title={`Day ${d.day}: ${d.title}`}
                style={{
                  width: "100%", aspectRatio: "1", borderRadius: 3, fontSize: 7,
                  background: dp === 100 ? `${C.up}66` : dp > 0 ? `${C.gold}44` : "rgba(240,238,233,0.04)",
                  border: `1px solid ${d.day === curDay ? C.gold : "transparent"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: d.day === curDay ? C.gold : C.faint, cursor: "pointer",
                  fontWeight: d.day === curDay ? 700 : 400
                }}>
                {d.day}
              </div>
            );
          })}
        </div>
        {/* Vertical list visible when expanded */}
        <div className="sb-days-list" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {CURRICULUM.slice(0, 26).map(d => {
            const p = progress[d.day] || { tasks: {} };
            const dn = Object.values(p.tasks).filter(Boolean).length;
            const tt = d.tasks.length;
            const dp = tt > 0 ? (dn / tt) * 100 : 0;
            const isToday = d.day === curDay;
            return (
              <div key={d.day} onClick={() => setPage("focus")}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 8, cursor: "pointer",
                  background: isToday ? `${C.gold}15` : dp === 100 ? `${C.up}0d` : "transparent",
                  border: `1px solid ${isToday ? C.gold + "50" : "transparent"}`,
                  transition: "all 0.15s"
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: dp === 100 ? `${C.up}44` : dp > 0 ? `${C.gold}33` : "rgba(240,238,233,0.06)",
                  border: `1px solid ${isToday ? C.gold : "rgba(240,238,233,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: isToday ? C.gold : dp === 100 ? C.up : C.faint
                }}>{d.day}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: isToday ? 600 : 400, color: isToday ? C.cream : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                  <div style={{ height: 2, background: "rgba(240,238,233,0.06)", borderRadius: 2, marginTop: 3, overflow: "hidden" }}>
                    <div style={{ width: `${dp}%`, height: "100%", background: dp === 100 ? C.up : C.gold, borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontSize: 9, color: dp === 100 ? C.up : C.faint, fontWeight: 600, flexShrink: 0 }}>{dp === 100 ? "✓" : `${Math.round(dp)}%`}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: quote */}
      <div style={{ padding: "12px 16px", marginTop: "auto" }}>
        <div className="sb-label" style={{ fontSize: 10, color: C.faint, fontStyle: "italic", lineHeight: 1.5 }}>
          "{QUOTES[(curDay - 1) % QUOTES.length]}"
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [progress, setProgress] = useState(() => initProgress());
  const [focusDay, setFocusDay] = useState(null);
  const [bg, setBg] = useState(() => BG.get());

  useEffect(() => {
    if (!document.getElementById("utbk-fonts")) {
      const link = document.createElement("link");
      link.id = "utbk-fonts";
      link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  const renderPage = () => {
    switch (page) {
      case "landing": return <LandingPage setPage={setPage} />;
      case "dashboard": return <DashboardPage progress={progress} setProgress={setProgress} setPage={setPage} setFocusDay={setFocusDay} />;
      case "focus": return <FocusPage progress={progress} setProgress={setProgress} focusDay={focusDay} />;
      case "path": return <PathPage progress={progress} setPage={setPage} setFocusDay={setFocusDay} />;
      case "profile": return <ProfilePage progress={progress} />;
      case "report": return <DailyReportPage progress={progress} />;
      case "schedule": return <SchedulePage />;
      case "method": return <MethodPage />;
      default: return <DashboardPage progress={progress} setProgress={setProgress} setPage={setPage} setFocusDay={setFocusDay} />;
    }
  };

  return (
    <div style={{ ...S.app, position: "relative", width: "100%", minHeight: "100vh", overflowX: "hidden" }}>
      <BackgroundLayer bg={bg} />
      <style>{`
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior:smooth; }
        body { overflow-x:hidden; }

        /* Premium scrollbar */
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(200,169,110,0.22); border-radius:10px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(200,169,110,0.45); }

        /* Selection */
        ::selection { background:rgba(200,169,110,0.2); color:${C.cream}; }

        /* Font rendering */
        * { -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility; }

        /* Range input — premium gold track */
        input[type="range"] {
          -webkit-appearance:none; appearance:none;
          background:transparent; cursor:pointer; width:100%; height:20px;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height:4px; background:rgba(200,169,110,0.15); border-radius:4px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance:none; appearance:none;
          width:16px; height:16px; margin-top:-6px;
          border-radius:50%; background:${C.gold};
          border:2px solid rgba(12,12,14,0.6);
          box-shadow:0 0 0 3px rgba(200,169,110,0.2), 0 2px 8px rgba(0,0,0,0.4);
          transition:box-shadow 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow:0 0 0 5px rgba(200,169,110,0.3), 0 2px 8px rgba(0,0,0,0.4);
        }

        /* Input focus */
        input:focus, textarea:focus, select:focus {
          border-color:rgba(200,169,110,0.4) !important;
          box-shadow:0 0 0 3px rgba(200,169,110,0.12) !important;
          outline:none;
        }

        /* Textarea */
        textarea { resize:vertical; min-height:80px; }

        /* Button interactions */
        button { cursor:pointer; }
        button:active { transform:scale(0.97) !important; }

        /* Smooth links */
        a { transition:opacity 0.2s; }
        a:hover { opacity:0.8; }

        /* Focus visible */
        *:focus-visible { outline:2px solid rgba(200,169,110,0.5); outline-offset:3px; border-radius:4px; }

        /* Landing page — hide nav */

        /* Keyframes */
        @keyframes checkDraw {
          from { stroke-dashoffset:20; opacity:0; }
          to   { stroke-dashoffset:0; opacity:1; }
        }
        @keyframes slideInToast {
          from { transform:translateY(20px) scale(0.96); opacity:0; }
          to   { transform:translateY(0) scale(1); opacity:1; }
        }
        @keyframes modalIn {
          from { transform:scale(0.94) translateY(8px); opacity:0; }
          to   { transform:scale(1) translateY(0); opacity:1; }
        }
        @keyframes pulseVignette {
          0%   { opacity:0; }
          30%  { opacity:1; }
          100% { opacity:0; }
        }
        @keyframes typingDot {
          0%,60%,100% { transform:translateY(0); opacity:0.3; }
          30%          { transform:translateY(-5px); opacity:1; }
        }
        @keyframes pulseDot {
          0%,100% { opacity:0.6; transform:scale(1); }
          50%     { opacity:1; transform:scale(1.5); }
        }
        @keyframes goldShimmer {
          0%   { background-position:0% 50%; }
          50%  { background-position:100% 50%; }
          100% { background-position:0% 50%; }
        }
        @keyframes particleFloat {
          0%   { transform:translateY(0px) scale(1); opacity:0.08; }
          100% { transform:translateY(-40px) scale(1.8); opacity:0.22; }
        }
        @keyframes scrollLine {
          0%   { transform:scaleY(0); transform-origin:top; opacity:1; }
          50%  { transform:scaleY(1); transform-origin:top; opacity:1; }
          51%  { transform:scaleY(1); transform-origin:bottom; opacity:1; }
          100% { transform:scaleY(0); transform-origin:bottom; opacity:0; }
        }
        @keyframes btnPulse {
          0%,100% { box-shadow:0 4px 24px rgba(200,169,110,0.3); }
          50%     { box-shadow:0 4px 40px rgba(200,169,110,0.6); }
        }
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position:200% center; }
          100% { background-position:-200% center; }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow:0 0 20px rgba(200,169,110,0.12); }
          50%     { box-shadow:0 0 40px rgba(200,169,110,0.3); }
        }
        @keyframes cardReveal {
          from { opacity:0; transform:translateY(20px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        /* Staggered card animations */
        .card-0 { animation:cardReveal 0.5s cubic-bezier(0.16,1,0.3,1) 0ms both; }
        .card-1 { animation:cardReveal 0.5s cubic-bezier(0.16,1,0.3,1) 80ms both; }
        .card-2 { animation:cardReveal 0.5s cubic-bezier(0.16,1,0.3,1) 160ms both; }
        .card-3 { animation:cardReveal 0.5s cubic-bezier(0.16,1,0.3,1) 240ms both; }

        /* Premium table */
        table { border-collapse:collapse; width:100%; }
        th { font-weight:600; }

        /* ═══ RESPONSIVE — FLUID FIRST SYSTEM ═══ */
        /* Force all content to fit viewport at any zoom level */
        html, body, #root { max-width:100% !important; overflow-x:hidden !important; width:100% !important; }

        /* Fluid page padding — adapts to any zoom/size */
        .resp-page {
          padding: clamp(12px,2vw,28px) clamp(10px,2.5vw,36px) clamp(28px,4vw,56px) !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Wide screens: keep content readable */
        @media (max-width:1400px) {
          .resp-grid-2-1 { grid-template-columns:1fr 1.5fr !important; }
        }
        @media (max-width:1200px) {
          .resp-grid-2-1 { grid-template-columns:1fr !important; }
          .resp-grid-4-2 { grid-template-columns:repeat(2,1fr) !important; }
          .resp-grid-6-3 { grid-template-columns:repeat(3,1fr) !important; }
          .resp-grid-focus { grid-template-columns:1fr !important; }
          .resp-grid-dashboard { grid-template-columns:1fr !important; }
        }
        @media (max-width:900px) {
          .nav-label { display:none !important; }
          .grid-hide-mobile { display:none !important; }
          .resp-grid-2-1 { grid-template-columns:1fr !important; }
          .resp-grid-4-2 { grid-template-columns:repeat(2,1fr) !important; }
          .resp-grid-6-3 { grid-template-columns:repeat(2,1fr) !important; }
          .resp-grid-dashboard { grid-template-columns:1fr !important; }
          .resp-hide-tablet { display:none !important; }
          .resp-page { padding: clamp(10px,2vw,20px) clamp(8px,2vw,16px) clamp(20px,3vw,40px) !important; }
        }
        @media (max-width:600px) {
          .hide-mobile { display:none !important; }
          .resp-grid-4-2 { grid-template-columns:1fr 1fr !important; }
          .resp-grid-6-3 { grid-template-columns:repeat(2,1fr) !important; }
          .resp-page { padding: 12px 10px 28px !important; }
          .resp-h1 { font-size:clamp(18px,5vw,24px) !important; }
          .resp-schedule-hide { display:none !important; }
          .resp-hero-text { font-size:clamp(28px,8vw,48px) !important; }
        }
        @media (max-width:400px) {
          .resp-grid-4-2 { grid-template-columns:1fr !important; }
          .resp-page { padding: 10px 8px 24px !important; }
        }

        /* High-DPI / zoom-safe: modal positioning */
        .modal-backdrop {
          position: fixed !important;
          inset: 0 !important;
          z-index: 1000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: clamp(12px,3vw,24px) !important;
          overflow-y: auto !important;
        }
        .modal-box {
          width: min(100%, clamp(300px,90vw,760px)) !important;
          max-height: min(90vh, 900px) !important;
          display: flex !important;
          flex-direction: column !important;
          border-radius: clamp(12px,2vw,22px) !important;
        }

        /* Toast — responsive position */
        .toast-wrap {
          position: fixed !important;
          bottom: clamp(16px,3vh,36px) !important;
          right: clamp(12px,3vw,36px) !important;
          left: clamp(12px,3vw,auto) !important;
          z-index: 9000 !important;
          max-width: clamp(260px,90vw,400px) !important;
        }

        /* Fluid text elements */
        .resp-text-sm { font-size: clamp(10px,1vw,13px) !important; }
        .resp-text-xs { font-size: clamp(9px,0.9vw,11px) !important; }

        /* ═══ PREMIUM EXCLUSIVE ELEMENTS ═══ */
        /* Gold shimmer text effect */
        .gold-shimmer {
          background: linear-gradient(90deg, rgba(200,169,110,0.4) 0%, rgba(232,201,138,1) 45%, rgba(200,169,110,0.4) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerText 3s ease-in-out infinite;
        }
        @keyframes shimmerText {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* Breathing glow ring for active elements */
        .glow-ring {
          box-shadow: 0 0 0 1px rgba(200,169,110,0.2), 0 0 20px rgba(200,169,110,0.08);
          animation: breatheGlow 4s ease-in-out infinite;
        }
        @keyframes breatheGlow {
          0%,100% { box-shadow: 0 0 0 1px rgba(200,169,110,0.2), 0 0 20px rgba(200,169,110,0.08); }
          50% { box-shadow: 0 0 0 1px rgba(200,169,110,0.4), 0 0 40px rgba(200,169,110,0.18); }
        }

        /* Hover lift for all cards */
        .card-hover { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s !important; }
        .card-hover:hover { transform: translateY(-3px) scale(1.005) !important; box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,169,110,0.15) !important; }

        /* PREMIUM CHECKLIST ITEM EFFECTS */
        .task-item { 
          position:relative; overflow:hidden; cursor:pointer;
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .task-item::before {
          content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
          background:linear-gradient(90deg, transparent, rgba(200,169,110,0.06), transparent);
          transition:left 0.6s ease;
        }
        .task-item:hover::before { left:100%; }
        .task-item:hover { 
          transform:translateX(6px) scale(1.008) !important; 
          border-color:rgba(200,169,110,0.25) !important;
          box-shadow:0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(200,169,110,0.1), inset 0 1px 0 rgba(240,238,233,0.08) !important;
        }
        .task-item:active { transform:translateX(6px) scale(0.995) !important; }
        .task-item-done { opacity:0.7; }
        .task-item-done:hover { opacity:0.85; transform:translateX(3px) !important; }
        
        /* Task checkbox pulse on complete */
        .task-check-done {
          animation: checkPulse 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes checkPulse {
          0% { transform:scale(1); }
          50% { transform:scale(1.3); }
          100% { transform:scale(1); }
        }
        
        /* Side quest item hover */
        .sq-item { transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .sq-item:hover { transform:translateX(4px); box-shadow:0 4px 16px rgba(200,169,110,0.15); border-color:rgba(200,169,110,0.2) !important; }
        
        /* Link button premium hover */
        .link-btn { transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .link-btn:hover { 
          transform:translateY(-2px) scale(1.05) !important;
          box-shadow:0 6px 20px rgba(200,169,110,0.3) !important;
          background:linear-gradient(135deg, rgba(200,169,110,0.3), rgba(200,169,110,0.15)) !important;
        }

        /* Noise grain overlay */
        .noise-overlay::before {
          content:''; position:fixed; inset:0; z-index:9999; pointer-events:none;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4; mix-blend-mode: overlay;
        }

        /* Scrollbar glow on scroll */
        ::-webkit-scrollbar-thumb:active { background:rgba(200,169,110,0.6) !important; box-shadow:0 0 12px rgba(200,169,110,0.4); }

        /* Focus ring gold */
        *:focus-visible { outline: 2px solid rgba(200,169,110,0.5) !important; outline-offset:3px; border-radius:4px; }

        /* Premium page enter */
        .page-enter { animation: pageSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes pageSlideIn {
          from { opacity:0; transform:translateY(16px); }
          to { opacity:1; transform:translateY(0); }
        }
        
        /* Stat card number counter */
        .stat-val { transition: all 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        
        /* Glass card border shimmer on hover */
        .glass-shimmer { position:relative; overflow:hidden; }
        .glass-shimmer::after {
          content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%;
          background:conic-gradient(from 0deg, transparent 0%, rgba(200,169,110,0.08) 10%, transparent 20%);
          opacity:0; transition:opacity 0.5s;
          animation:borderRotate 4s linear infinite;
          pointer-events:none;
        }
        .glass-shimmer:hover::after { opacity:1; }
        @keyframes borderRotate {
          from { transform:rotate(0deg); }
          to { transform:rotate(360deg); }
        }
        
        /* Navbar item underline effect */
        .nav-item-active { position:relative; }
        .nav-item-active::after {
          content:''; position:absolute; bottom:-2px; left:20%; right:20%; height:2px;
          background:linear-gradient(90deg, transparent, rgba(200,169,110,0.6), transparent);
          border-radius:2px;
        }

        /* Chat message animation */
        .chat-msg-in {
          animation: chatSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes chatSlideIn {
          from { opacity:0; transform:translateY(8px) scale(0.97); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }

        /* Streak fire animation */
        .streak-fire { animation: firePulse 1.5s ease-in-out infinite; }
        @keyframes firePulse {
          0%,100% { filter: drop-shadow(0 0 4px rgba(232,168,56,0.5)); transform:scale(1); }
          50% { filter: drop-shadow(0 0 12px rgba(232,168,56,0.8)); transform:scale(1.1); }
        }

        /* Number counter tick */
        .num-tick { transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1); }

        /* Sidebar — truly fixed full height */
        .app-sidebar { width:56px; transition:width 0.3s cubic-bezier(0.16,1,0.3,1); overflow-x:hidden; overflow-y:auto; flex-shrink:0; position:fixed; left:0; top:0; height:100vh; z-index:150; }
        .app-sidebar:hover { width:220px; }
        .app-sidebar .sb-label { opacity:0; transition:opacity 0.2s; white-space:nowrap; }
        .app-sidebar:hover .sb-label { opacity:1; }
        .app-sidebar .sb-item { display:flex; align-items:center; gap:12px; padding:8px 16px; border-radius:10px; cursor:pointer; transition:all 0.15s; color:${C.muted}; font-size:12px; }
        .app-sidebar .sb-item:hover { background:rgba(240,238,233,0.05); color:${C.cream}; transform:translateX(3px); }
        .app-sidebar .sb-item.sb-active { background:rgba(200,169,110,0.12); color:${C.gold}; border-left:2px solid ${C.gold}; }
        .app-sidebar-open ~ .main-content { margin-left: 220px !important; }
        .app-sidebar .sb-days-list { display:none; }
        .app-sidebar:hover .sb-days-grid { display:none !important; }
        .app-sidebar:hover .sb-days-list { display:flex !important; }
        @media (max-width:900px) { .app-sidebar { display:none !important; } }

        /* Prevent right-side cutoff */
        .main-page-content { max-width: calc(100vw - 56px) !important; overflow-x: hidden !important; box-sizing: border-box !important; }

        /* Hide default cursor for custom cursor */
        @media (hover: hover) {
          * { cursor: none !important; }
        }
      `}</style>
      <NetworkCanvas />
      <CustomCursor />
      <div style={{ position: "relative", zIndex: 1 }} className="noise-overlay">
        {page !== "landing" && <Navbar page={page} setPage={setPage} onBgUpload={setBg} progress={progress} />}
        {page !== "landing" ? (
          <div style={{ display: "flex", minHeight: "calc(100vh - clamp(52px,6vw,60px))" }}>
            <ScheduleSidebar page={page} setPage={setPage} progress={progress} />
            <div className="main-content" style={{ flex: 1, minWidth: 0, maxWidth: "calc(100vw - 56px)", marginLeft: 56, overflowX: "hidden", boxSizing: "border-box" }}>{renderPage()}</div>
          </div>
        ) : renderPage()}
      </div>
    </div>
  );
}
