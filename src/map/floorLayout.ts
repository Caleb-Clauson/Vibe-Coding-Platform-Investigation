export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RoomLabel {
  text: string;
  x: number;
  y: number;
}

export const WALLS: Wall[] = [
  { x1: 35, y1: 0, x2: 35, y2: 52 },
  { x1: 0, y1: 52, x2: 35, y2: 52 },
  { x1: 68, y1: 0, x2: 68, y2: 75 },
  { x1: 68, y1: 28, x2: 100, y2: 28 },
  { x1: 68, y1: 45, x2: 100, y2: 45 },
];

export const ROOM_LABELS: RoomLabel[] = [
  { text: 'FRONT COUNTER', x: 2, y: 2 },
  { text: 'DINING ROOM', x: 37, y: 2 },
  { text: 'BACK OFFICE', x: 70, y: 2 },
  { text: 'KITCHEN', x: 70, y: 47 },
  { text: 'STORAGE', x: 2, y: 54 },
  { text: 'PARKING LOT', x: 2, y: 76 },
];
