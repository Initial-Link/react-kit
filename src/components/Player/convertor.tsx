import { DEFAULT_MAX_DURATION } from "./PlayerContext";
function padZero(number: number): string {
  return `${number < 10 ? "0" : ""}${number}`;
}
/**
 * Example
 * @param time 134
 * @returns "2:14"
 */
export function parseTimeDuration(time: number | string) {
  const number = parseInt(time as string);
  if (number === DEFAULT_MAX_DURATION) return "--:--";
  if (Number.isNaN(number)) return null;
  const h = Math.floor(number / 3600);
  const m = Math.floor((number % 3600) / 60);
  const s = number % 60;
  if (m + h === 0) return `0:${padZero(s)}`;
  if (h === 0) return `${m}:${padZero(s)}`;
  return `${h}:${padZero(m)}:${padZero(s)}`;
}
