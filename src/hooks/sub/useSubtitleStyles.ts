import { useState } from "react";

export interface SubtitleStyle {
  primaryColor: string;
  outlineColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  fontSize: number;
  marginV: number;
  outlineWidth: number;
  bold: number;
  italic: number;
  underline: number;
  strikeOut: number;
  scaleX: number;
  scaleY: number;
  spacing: number;
  angle: number;
  borderStyle: 1 | 3;
  shadow: number;
  alignment: number;
  marginL: number;
  marginR: number;
}

export const subtitlePresets = {
  tiktok: {
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    backgroundColor: "#000000",
    backgroundOpacity: 0.5,
    fontSize: 14,
    marginV: 10,
    outlineWidth: 1,
    bold: 0,
    italic: 0,
    underline: 0,
    strikeOut: 0,
    scaleX: 100,
    scaleY: 100,
    spacing: 0,
    angle: 0,
    borderStyle: 1,
    shadow: 0,
    alignment: 2,
    marginL: 10,
    marginR: 10,
  },
} as const;

export function useSubtitleStyles(
  initialPreset: keyof typeof subtitlePresets = "tiktok"
) {
  const [selectedStyle, setSelectedStyle] =
    useState<keyof typeof subtitlePresets>(initialPreset);
  const [primaryColor, setPrimaryColor] = useState<string>(
    subtitlePresets[initialPreset].primaryColor
  );
  const [outlineColor, setOutlineColor] = useState<string>(
    subtitlePresets[initialPreset].outlineColor
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(
    subtitlePresets[initialPreset].backgroundColor
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(
    subtitlePresets[initialPreset].backgroundOpacity
  );
  const [fontSize, setFontSize] = useState<number>(
    subtitlePresets[initialPreset].fontSize
  );
  const [marginV, setMarginV] = useState<number>(
    subtitlePresets[initialPreset].marginV
  );
  const [outlineWidth, setOutlineWidth] = useState<number>(
    subtitlePresets[initialPreset].outlineWidth
  );
  const [bold, setBold] = useState<number>(subtitlePresets[initialPreset].bold);
  const [italic, setItalic] = useState<number>(
    subtitlePresets[initialPreset].italic
  );
  const [underline, setUnderline] = useState<number>(
    subtitlePresets[initialPreset].underline
  );
  const [strikeOut, setStrikeOut] = useState<number>(
    subtitlePresets[initialPreset].strikeOut
  );
  const [scaleX, setScaleX] = useState<number>(
    subtitlePresets[initialPreset].scaleX
  );
  const [scaleY, setScaleY] = useState<number>(
    subtitlePresets[initialPreset].scaleY
  );
  const [spacing, setSpacing] = useState<number>(
    subtitlePresets[initialPreset].spacing
  );
  const [angle, setAngle] = useState<number>(
    subtitlePresets[initialPreset].angle
  );
  const [borderStyle, setBorderStyle] = useState(
    subtitlePresets[initialPreset].borderStyle
  );
  const [shadow, setShadow] = useState<number>(
    subtitlePresets[initialPreset].shadow
  );
  const [alignment, setAlignment] = useState<number>(
    subtitlePresets[initialPreset].alignment
  );
  const [marginL, setMarginL] = useState<number>(
    subtitlePresets[initialPreset].marginL
  );
  const [marginR, setMarginR] = useState<number>(
    subtitlePresets[initialPreset].marginR
  );

  const applyStylePreset = (presetKey: keyof typeof subtitlePresets) => {
    const preset = subtitlePresets[presetKey];
    setSelectedStyle(presetKey);
    setPrimaryColor(preset.primaryColor);
    setOutlineColor(preset.outlineColor);
    setBackgroundColor(preset.backgroundColor);
    setBackgroundOpacity(preset.backgroundOpacity);
    setFontSize(preset.fontSize);
    setMarginV(preset.marginV);
    setOutlineWidth(preset.outlineWidth);
    setBold(preset.bold);
    setItalic(preset.italic);
    setUnderline(preset.underline);
    setStrikeOut(preset.strikeOut);
    setScaleX(preset.scaleX);
    setScaleY(preset.scaleY);
    setSpacing(preset.spacing);
    setAngle(preset.angle);
    setBorderStyle(preset.borderStyle);
    setShadow(preset.shadow);
    setAlignment(preset.alignment);
    setMarginL(preset.marginL);
    setMarginR(preset.marginR);
  };

  const getCurrentStyles = (): SubtitleStyle => ({
    primaryColor,
    outlineColor,
    backgroundColor,
    backgroundOpacity,
    fontSize,
    marginV,
    outlineWidth,
    bold,
    italic,
    underline,
    strikeOut,
    scaleX,
    scaleY,
    spacing,
    angle,
    borderStyle,
    shadow,
    alignment,
    marginL,
    marginR,
  });

  return {
    // Current style values
    selectedStyle,
    primaryColor,
    outlineColor,
    backgroundColor,
    backgroundOpacity,
    fontSize,
    marginV,
    outlineWidth,
    bold,
    italic,
    underline,
    strikeOut,
    scaleX,
    scaleY,
    spacing,
    angle,
    borderStyle,
    shadow,
    alignment,
    marginL,
    marginR,

    // Setters
    setPrimaryColor,
    setOutlineColor,
    setBackgroundColor,
    setBackgroundOpacity,
    setFontSize,
    setMarginV,
    setOutlineWidth,
    setBold,
    setItalic,
    setUnderline,
    setStrikeOut,
    setScaleX,
    setScaleY,
    setSpacing,
    setAngle,
    setBorderStyle,
    setShadow,
    setAlignment,
    setMarginL,
    setMarginR,

    // Utility functions
    applyStylePreset,
    getCurrentStyles,
  };
}
