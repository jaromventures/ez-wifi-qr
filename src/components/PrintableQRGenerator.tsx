/**
 * PrintableQRGenerator - 8.5x11 inch print-ready QR code generator
 * Generates high-quality 2550x3300px canvas at 300 DPI
 */

import QRCode from "qrcode";
import { 
  PRINT_CONFIG, 
  drawTransparentBox, 
  enableHighQualityText, 
  drawTextWithShadow 
} from "@/utils/canvasHelpers";

export interface WiFiConfig {
  ssid: string;
  password: string;
  encryption: string;
  customTitle?: string;
  showTitleInPdf?: boolean;
  backgroundImage?: string;
}

// Layout zones for 8.5x11 page
const TOP_ZONE_END = 825;        // Top 25% for title
const MIDDLE_ZONE_START = 825;   // Middle 50% for QR
const MIDDLE_ZONE_END = 2475;
const BOTTOM_ZONE_START = 2475;  // Bottom 25% for credentials

const QR_SIZE = 1200; // Large, high-quality QR code

export async function generatePrintableCanvas(
  config: WiFiConfig
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = PRINT_CONFIG.width;
  canvas.height = PRINT_CONFIG.height;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  enableHighQualityText(ctx);

  // Step 1: Draw background
  if (config.backgroundImage) {
    await drawBackground(ctx, config.backgroundImage);
  } else {
    // Default gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, PRINT_CONFIG.height);
    gradient.addColorStop(0, "#f8f9fa");
    gradient.addColorStop(1, "#e9ecef");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
  }

  // Step 2: Draw title in top zone
  if (config.showTitleInPdf !== false) {
    drawTitle(ctx, config.customTitle || "Your WiFi QR Code");
  }

  // Step 3: Generate and draw QR code in middle zone
  await drawQRCode(ctx, config);

  // Step 4: Draw credentials in bottom zone
  drawCredentials(ctx, config);

  return canvas;
}

async function drawBackground(
  ctx: CanvasRenderingContext2D,
  backgroundImage: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
      resolve();
    };
    
    img.onerror = () => {
      console.warn("Background image failed to load, using gradient fallback");
      const gradient = ctx.createLinearGradient(0, 0, 0, PRINT_CONFIG.height);
      gradient.addColorStop(0, "#f8f9fa");
      gradient.addColorStop(1, "#e9ecef");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, PRINT_CONFIG.width, PRINT_CONFIG.height);
      resolve();
    };
    
    img.src = backgroundImage;
  });
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string) {
  const centerX = PRINT_CONFIG.width / 2;
  const titleBoxY = 250;
  const titleBoxWidth = 1900;
  const titleBoxHeight = 180;

  // Draw transparent box
  drawTransparentBox(
    ctx,
    centerX - titleBoxWidth / 2,
    titleBoxY,
    titleBoxWidth,
    titleBoxHeight,
    30,
    "rgba(0, 0, 0, 0.65)"
  );

  // Draw title text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 120px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  drawTextWithShadow(ctx, title, centerX, titleBoxY + titleBoxHeight / 2);
}

async function drawQRCode(
  ctx: CanvasRenderingContext2D,
  config: WiFiConfig
): Promise<void> {
  // Generate WiFi connection string
  const wifiString =
    config.encryption === "nopass"
      ? `WIFI:T:nopass;S:${config.ssid};;`
      : `WIFI:T:${config.encryption};S:${config.ssid};P:${config.password};;`;

  // Generate QR code on temporary canvas
  const qrCanvas = document.createElement("canvas");
  
  try {
    await QRCode.toCanvas(qrCanvas, wifiString, {
      width: QR_SIZE,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });

    // Calculate centered position in middle zone
    const centerX = PRINT_CONFIG.width / 2;
    const middleZoneHeight = MIDDLE_ZONE_END - MIDDLE_ZONE_START;
    const qrY = MIDDLE_ZONE_START + (middleZoneHeight - QR_SIZE) / 2;

    // Draw white background for QR code
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(centerX - QR_SIZE / 2 - 20, qrY - 20, QR_SIZE + 40, QR_SIZE + 40);

    // Draw QR code
    ctx.drawImage(qrCanvas, centerX - QR_SIZE / 2, qrY, QR_SIZE, QR_SIZE);
  } catch (error) {
    console.error("QR code generation failed:", error);
    throw error;
  }
}

function drawCredentials(ctx: CanvasRenderingContext2D, config: WiFiConfig) {
  const centerX = PRINT_CONFIG.width / 2;
  const credBoxWidth = 1900;
  const credBoxHeight = 130;

  // Network name box
  const networkY = 2550;
  drawTransparentBox(
    ctx,
    centerX - credBoxWidth / 2,
    networkY,
    credBoxWidth,
    credBoxHeight,
    30,
    "rgba(0, 0, 0, 0.75)"
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 85px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Network: ${config.ssid}`, centerX, networkY + credBoxHeight / 2);

  // Password box (or "Open Network")
  const passwordY = networkY + credBoxHeight + 30;
  drawTransparentBox(
    ctx,
    centerX - credBoxWidth / 2,
    passwordY,
    credBoxWidth,
    credBoxHeight,
    30,
    "rgba(0, 0, 0, 0.75)"
  );

  if (config.encryption === "nopass") {
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Open Network (No Password)", centerX, passwordY + credBoxHeight / 2);
  } else {
    ctx.fillStyle = "#ef4444"; // Red for password
    ctx.fillText(`Password: ${config.password}`, centerX, passwordY + credBoxHeight / 2);
  }

  // Footer branding
  const footerY = 3150;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "50px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("Generated by EZ-WI-FI", centerX, footerY);
}
