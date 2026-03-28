import { useMemo } from 'react';

type ProvisioningQrProps = {
  value: string;
  size?: number;
  className?: string;
};

const MODULES = 29;

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createMatrix(value: string) {
  const matrix = Array.from({ length: MODULES }, () => Array.from({ length: MODULES }, () => false));
  const reserved = Array.from({ length: MODULES }, () => Array.from({ length: MODULES }, () => false));

  const markReserved = (row: number, col: number, width = 1, height = 1) => {
    for (let r = row; r < row + height; r += 1) {
      for (let c = col; c < col + width; c += 1) {
        if (r >= 0 && r < MODULES && c >= 0 && c < MODULES) {
          reserved[r][c] = true;
        }
      }
    }
  };

  const drawFinder = (offsetRow: number, offsetCol: number) => {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const isBorder = row === 0 || row === 6 || col === 0 || col === 6;
        const isCenter = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        matrix[offsetRow + row][offsetCol + col] = isBorder || isCenter;
        markReserved(offsetRow + row, offsetCol + col);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, MODULES - 7);
  drawFinder(MODULES - 7, 0);

  for (let index = 8; index < MODULES - 8; index += 1) {
    const bit = index % 2 === 0;
    matrix[6][index] = bit;
    matrix[index][6] = bit;
    markReserved(6, index);
    markReserved(index, 6);
  }

  const seed = hashString(value);
  const random = mulberry32(seed);

  for (let row = 0; row < MODULES; row += 1) {
    for (let col = 0; col < MODULES; col += 1) {
      if (reserved[row][col]) continue;
      const noise = random() > 0.5;
      const charInfluence = value.charCodeAt((row * MODULES + col) % Math.max(1, value.length)) ?? 0;
      matrix[row][col] = noise || ((charInfluence + row + col + seed) % 7 === 0);
    }
  }

  return matrix;
}

export function ProvisioningQr({ value, size = 192, className }: ProvisioningQrProps) {
  const matrix = useMemo(() => createMatrix(value), [value]);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${MODULES} ${MODULES}`}
      role="img"
      aria-label="Provisioning QR code"
      shapeRendering="crispEdges"
    >
      <title>Provisioning QR code</title>
      <rect x="0" y="0" width={MODULES} height={MODULES} fill="#ffffff" rx="2" />
      {matrix.map((row, rowIndex) => row.map((filled, colIndex) => (
        filled ? (
          <rect
            key={`${rowIndex}-${colIndex}`}
            x={colIndex}
            y={rowIndex}
            width="1"
            height="1"
            fill="#111827"
          />
        ) : null
      )))}
      <rect x="0" y="0" width={MODULES} height={MODULES} fill="none" stroke="#111827" strokeWidth="0.35" opacity="0.25" />
    </svg>
  );
}

export default ProvisioningQr;
