/**
 * Canvas Helper Utilities for High-Quality Print Rendering
 * Optimized for 300 DPI print output
 */

export interface CanvasConfig {
  width: number;
  height: number;
  dpi: number;
}

export const PRINT_CONFIG: CanvasConfig = {
  width: 2550,  // 8.5 inches @ 300 DPI
  height: 3300, // 11 inches @ 300 DPI
  dpi: 300,
};

/**
 * Draws a rounded rectangle with transparent background
 */
export function drawTransparentBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 26,
  backgroundColor: string = "rgba(0, 0, 0, 0.75)"
) {
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Enables high-quality text rendering
 */
export function enableHighQualityText(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
}

/**
 * Draws text with shadow for better readability
 */
export function drawTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  shadowColor: string = "rgba(0, 0, 0, 0.7)",
  shadowBlur: number = 12
) {
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  ctx.fillText(text, x, y);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Wraps long text to fit within a specified width
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + " " + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  
  lines.push(currentLine);
  return lines;
}
