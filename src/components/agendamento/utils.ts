// Funções utilitárias do módulo de Agendamentos
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { DEFAULT_SESSION_MINUTES } from "./types";

// ===== Helpers de Status =====
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'agendado': return 'bg-primary/10 text-primary border-primary/20';
    case 'confirmado': return 'bg-primary/10 text-primary border-primary/20';
    case 'em_andamento': return 'bg-primary/10 text-primary border-primary/20';
    case 'concluido': return 'bg-success/10 text-success border-success/20';
    case 'cancelado': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'agendado': return 'Agendado';
    case 'confirmado': return 'Confirmado';
    case 'em_andamento': return 'Em Andamento';
    case 'concluido': return 'Concluído';
    case 'cancelado': return 'Cancelado';
    default: return 'Desconhecido';
  }
};

export const getStatusIconComponent = (status: string) => {
  switch (status) {
    case 'agendado': return Calendar;
    case 'confirmado': return CheckCircle;
    case 'em_andamento': return Clock;
    case 'concluido': return CheckCircle;
    case 'cancelado': return AlertCircle;
    default: return Calendar;
  }
};

// ===== Helpers de UUID =====
export const isUUID = (s: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

// ===== Helpers de Horário =====
export const normalizeTime = (time: string): string => {
  if (!time) return "";
  return time.slice(0, 5);
};

export const toMinutes = (time: string): number => {
  const [h, m] = normalizeTime(time).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
};

export const fromMinutes = (mins: number): string => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const addMinutes = (time: string, add: number): string => {
  const base = toMinutes(time);
  if (Number.isNaN(base)) return normalizeTime(time);
  return fromMinutes(base + add);
};

export const formatTimeInput = (raw: string): string => {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`.slice(0, 5);
};

export const clampTime = (time: string): string => {
  const [hStr = "", mStr = ""] = normalizeTime(time).split(":");
  let h = parseInt(hStr || "0", 10);
  let m = parseInt(mStr || "0", 10);
  if (Number.isNaN(h)) h = 0;
  if (Number.isNaN(m)) m = 0;
  h = Math.max(0, Math.min(23, h));
  m = Math.max(0, Math.min(59, m));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// ===== Helpers de Moeda =====
export const formatCurrencyBR = (value: number): string => {
  if (!isFinite(value)) return "";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const parseCurrencyInput = (input: string): number => {
  const digitsOnly = input.replace(/\D/g, "");
  const cents = parseInt(digitsOnly || "0", 10);
  return cents / 100;
};

// ===== Helpers de Data =====
export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const calculateEndTime = (startTime: string, durationMinutes: number = DEFAULT_SESSION_MINUTES): string => {
  return startTime ? addMinutes(startTime, durationMinutes) : '';
};

