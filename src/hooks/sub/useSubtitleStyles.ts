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
  borderStyle: number;
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
  const [primaryColor, setPrimaryColor] = useState(
    subtitlePresets[initialPreset].primaryColor
  );
  const [outlineColor, setOutlineColor] = useState(
    subtitlePresets[initialPreset].outlineColor
  );
  const [backgroundColor, setBackgroundColor] = useState(
    subtitlePresets[initialPreset].backgroundColor
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    subtitlePresets[initialPreset].backgroundOpacity
  );
  const [fontSize, setFontSize] = useState(
    subtitlePresets[initialPreset].fontSize
  );
  const [marginV, setMarginV] = useState(
    subtitlePresets[initialPreset].marginV
  );
  const [outlineWidth, setOutlineWidth] = useState(
    subtitlePresets[initialPreset].outlineWidth
  );
  const [bold, setBold] = useState(subtitlePresets[initialPreset].bold);
  const [italic, setItalic] = useState(subtitlePresets[initialPreset].italic);
  const [underline, setUnderline] = useState(
    subtitlePresets[initialPreset].underline
  );
  const [strikeOut, setStrikeOut] = useState(
    subtitlePresets[initialPreset].strikeOut
  );
  const [scaleX, setScaleX] = useState(subtitlePresets[initialPreset].scaleX);
  const [scaleY, setScaleY] = useState(subtitlePresets[initialPreset].scaleY);
  const [spacing, setSpacing] = useState(
    subtitlePresets[initialPreset].spacing
  );
  const [angle, setAngle] = useState(subtitlePresets[initialPreset].angle);
  const [borderStyle, setBorderStyle] = useState(
    subtitlePresets[initialPreset].borderStyle
  );
  const [shadow, setShadow] = useState(subtitlePresets[initialPreset].shadow);
  const [alignment, setAlignment] = useState(
    subtitlePresets[initialPreset].alignment
  );
  const [marginL, setMarginL] = useState(
    subtitlePresets[initialPreset].marginL
  );
  const [marginR, setMarginR] = useState(
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
