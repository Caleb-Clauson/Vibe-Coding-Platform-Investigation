type Rgb = readonly [number, number, number];

const HEAT_STOPS: readonly { signalDbm: number; rgb: Rgb }[] = [
  { signalDbm: -40, rgb: [21, 128, 61] },
  { signalDbm: -60, rgb: [132, 204, 22] },
  { signalDbm: -67, rgb: [250, 204, 21] },
  { signalDbm: -72, rgb: [249, 115, 22] },
  { signalDbm: -85, rgb: [220, 38, 38] },
];

function toCss([r, g, b]: readonly number[]): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export function heatColor(signalDbm: number): string {
  const first = HEAT_STOPS[0];
  const last = HEAT_STOPS[HEAT_STOPS.length - 1];
  if (signalDbm >= first.signalDbm) return toCss(first.rgb);
  if (signalDbm <= last.signalDbm) return toCss(last.rgb);

  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const strong = HEAT_STOPS[i];
    const weak = HEAT_STOPS[i + 1];
    if (signalDbm <= strong.signalDbm && signalDbm >= weak.signalDbm) {
      const t = (strong.signalDbm - signalDbm) / (strong.signalDbm - weak.signalDbm);
      return toCss(strong.rgb.map((channel, k) => channel + (weak.rgb[k] - channel) * t));
    }
  }
  return toCss(last.rgb);
}
