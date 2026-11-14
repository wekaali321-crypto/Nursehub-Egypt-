import type { LucideIcon } from "lucide-react";
import {
  Accessibility, Activity, Ambulance, Apple, Award, Baby, Bandage, BedDouble, Bell, Biohazard, BookOpen, Bone, Brain, Bug,
  Calculator, Calendar, Candy, CircleAlert, CircleCheck, CircleHelp, CircleX, ClipboardList, Clock, Compass, Cross, Dna,
  Droplet, Droplets, Ear, Eye, FileText, Flame, FlaskConical, Footprints, Gauge, Globe, GraduationCap, Hand, HandHeart,
  Heart, HeartCrack, HeartPulse, Hospital, House, Info, Languages, Layers, Leaf, Library, Lightbulb, Link, Lock, Mail, MapPin,
  MessageCircle, MessagesSquare, Microscope, Milk, Moon, NotebookPen, Package, Pill, Plane, Printer, Puzzle, Radiation,
  RefreshCw, Ribbon, Ruler, Scale, ScanLine, Scissors, Search, Settings, Shield, ShieldPlus, ShoppingCart, Siren, Skull,
  Smartphone, Snowflake, Sparkles, Star, Stethoscope, Sun, Syringe, Target, TestTubes, Thermometer, Timer, TrendingDown,
  TrendingUp, TriangleAlert, Trophy, Users, Utensils, Video, Wind, Wrench, Zap, Baby as Child, PersonStanding, Bath, Toilet,
  Flower2, Smile, Frown, BedSingle, Briefcase, Ban, Cigarette, Wine, Sprout, Bean, Newspaper, Megaphone, BellOff, Trash2,
} from "lucide-react";

/**
 * One icon set for the whole site (lucide, same stroke, inherits the text colour).
 * Content and the database still store emoji (topic `icon` columns, i18n strings): this maps an emoji to its icon at render
 * time, so no data changes. Unmapped emoji fall back to `fallback` (e.g. the section icon) so a list stays visually uniform,
 * and only then to the emoji itself.
 */
const MAP: Record<string, LucideIcon> = {
  // study / content
  "📖": BookOpen, "📘": BookOpen, "📚": Library, "📝": NotebookPen, "📋": ClipboardList, "📄": FileText, "📜": FileText, "🗂": Layers,
  "💡": Lightbulb, "🎓": GraduationCap, "🧑‍🎓": GraduationCap, "🎯": Target, "🧩": Puzzle, "🔤": Languages, "🗣": MessagesSquare,
  "💬": MessageCircle, "❓": CircleHelp, "🔍": Search, "🔎": Search, "🧮": Calculator, "📏": Ruler, "📐": Ruler, "⚖": Scale,
  "📈": TrendingUp, "📉": TrendingDown, "📊": Gauge, "🏆": Trophy, "🏅": Award, "⭐": Star, "✨": Sparkles, "🖨": Printer, "📰": Newspaper, "📣": Megaphone, "🔕": BellOff, "🗑": Trash2,
  // clinical
  "🩺": Stethoscope, "⚕": Stethoscope, "🧑‍⚕": Stethoscope, "🥼": Stethoscope, "💊": Pill, "💉": Syringe, "🧴": Droplets,
  "🏥": Hospital, "🚑": Ambulance, "🚨": Siren, "🆘": Siren, "🩹": Bandage, "❤‍🩹": Bandage, "🌡": Thermometer, "🩻": ScanLine,
  "🔬": Microscope, "🧪": FlaskConical, "⚗": FlaskConical, "🧫": TestTubes, "🧬": Dna, "🦠": Bug, "🪱": Bug, "🐛": Bug, "🦟": Bug,
  "☣": Biohazard, "☢": Radiation, "☠": Skull, "💀": Skull, "🛡": Shield, "⛑": ShieldPlus, "🔪": Scissors, "✂": Scissors,
  "🧵": Scissors, "🪡": Scissors, "🧤": Hand, "😷": ShieldPlus, "🧼": Droplets, "🚰": Droplet, "🚿": Bath, "🚽": Toilet, "🚻": Toilet,
  "🛏": BedDouble, "🛌": BedSingle, "🦽": Accessibility, "🦿": Accessibility, "🩼": Accessibility, "🧰": Briefcase,
  // body
  "🧠": Brain, "❤": Heart, "💓": HeartPulse, "🫀": HeartPulse, "💔": HeartCrack, "❤‍🔥": HeartPulse, "🫁": Wind, "🌬": Wind,
  "💨": Wind, "😮‍💨": Wind, "🩸": Droplet, "💧": Droplet, "💦": Droplets, "🫧": Droplets, "🦴": Bone, "🦵": Bone, "🦶": Footprints,
  "👁": Eye, "👂": Ear, "✋": Hand, "🖐": Hand, "🤲": Hand, "💪": Activity, "🏃": Activity, "🚶": PersonStanding, "🧍": PersonStanding,
  "⚡": Zap, "🔥": Flame, "🌀": RefreshCw, "🔄": RefreshCw, "🔁": RefreshCw, "🥶": Snowflake, "🧊": Snowflake,
  // mother & child
  "👶": Baby, "🍼": Milk, "🤱": HandHeart, "🤰": HandHeart, "🫃": HandHeart, "🧒": Child, "🧸": Child, "🚼": Baby,
  "🌸": Flower2, "🎗": Ribbon, "🎀": Ribbon,
  // nutrition / lifestyle
  "🍽": Utensils, "🥗": Apple, "🍎": Apple, "🍓": Apple, "🍬": Candy, "🍭": Candy, "🧂": Utensils, "🫘": Bean, "🌿": Leaf,
  "🌱": Sprout, "🚭": Ban, "🚫": Ban, "🍷": Wine, "😴": Moon, "🌙": Moon, "☀": Sun, "🌞": Sun,
  // ui
  "✅": CircleCheck, "❌": CircleX, "⚠": TriangleAlert, "🔴": CircleAlert, "ℹ": Info, "🔔": Bell, "🔗": Link, "🔒": Lock,
  "⚙": Settings, "🛠": Wrench, "🔧": Wrench, "⏱": Timer, "🕐": Clock, "⏰": Clock, "📅": Calendar, "🏠": House, "📲": Smartphone,
  "📱": Smartphone, "🛒": ShoppingCart, "📦": Package, "✈": Plane, "📍": MapPin, "🌍": Globe, "🌐": Globe, "🧭": Compass,
  "✉": Mail, "📧": Mail, "👥": Users, "🎥": Video, "📹": Video, "😊": Smile, "🤕": Frown, "😣": Frown, "😖": Frown, "🤢": Frown, "🚬": Cigarette, "➕": Cross,
};

const norm = (e: string) => e.replace(/️/g, "").trim();

export function iconFor(emoji?: string | null): LucideIcon | null {
  return emoji ? MAP[norm(emoji)] ?? null : null;
}

type Props = {
  /** the emoji stored in content/data */
  emoji?: string | null;
  /** used when `emoji` has no icon (keeps lists uniform) */
  fallback?: string;
  /** pixel size of the icon */
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function EmojiIcon({ emoji, fallback, size = 24, className = "", strokeWidth = 2 }: Props) {
  const C = iconFor(emoji) ?? iconFor(fallback);
  if (C) return <C size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" focusable="false" />;
  const raw = emoji || fallback;
  return raw ? <span className={className} aria-hidden="true" style={{ fontSize: size * 0.9, lineHeight: 1 }}>{raw}</span> : null;
}
