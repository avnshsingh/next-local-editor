"use client";
import React from "react";
import { useSubtitleStyles } from "@/hooks/sub/useSubtitleStyles";

type SubtitleStyleProps = {
  // Style values
  selectedStyle?: string;
  primaryColor?: string;
  outlineColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  fontSize?: number;
  marginV?: number;
  outlineWidth?: number;
  bold?: number;
  italic?: number;
  underline?: number;
  strikeOut?: number;
  scaleX?: number;
  scaleY?: number;
  spacing?: number;
  angle?: number;
  borderStyle?: 1 | 3;
  shadow?: number;
  alignment?: number;
  marginL?: number;
  marginR?: number;

  // Setters
  setPrimaryColor?: (value: string) => void;
  setOutlineColor?: (value: string) => void;
  setBackgroundColor?: (value: string) => void;
  setBackgroundOpacity?: (value: number) => void;
  setFontSize?: (value: number) => void;
  setMarginV?: (value: number) => void;
  setOutlineWidth?: (value: number) => void;
  setBold?: (value: number) => void;
  setItalic?: (value: number) => void;
  setUnderline?: (value: number) => void;
  setStrikeOut?: (value: number) => void;
  setScaleX?: (value: number) => void;
  setScaleY?: (value: number) => void;
  setSpacing?: (value: number) => void;
  setAngle?: (value: number) => void;
  setBorderStyle?: (value: 1 | 3) => void;
  setShadow?: (value: number) => void;
  setAlignment?: (value: number) => void;
  setMarginL?: (value: number) => void;
  setMarginR?: (value: number) => void;
  applyStylePreset?: (preset: string) => void;
};

const SubStyle = (props: SubtitleStyleProps) => {
  // Use the hook if no props are provided, otherwise use the props
  const styles = useSubtitleStyles();

  // Determine whether to use props or hook values
  const {
    selectedStyle = props.selectedStyle || styles.selectedStyle,
    primaryColor = props.primaryColor || styles.primaryColor,
    outlineColor = props.outlineColor || styles.outlineColor,
    backgroundColor = props.backgroundColor || styles.backgroundColor,
    backgroundOpacity = props.backgroundOpacity || styles.backgroundOpacity,
    fontSize = props.fontSize || styles.fontSize,
    marginV = props.marginV || styles.marginV,
    outlineWidth = props.outlineWidth || styles.outlineWidth,
    bold = props.bold || styles.bold,
    italic = props.italic || styles.italic,
    underline = props.underline || styles.underline,
    strikeOut = props.strikeOut || styles.strikeOut,
    scaleX = props.scaleX || styles.scaleX,
    scaleY = props.scaleY || styles.scaleY,
    spacing = props.spacing || styles.spacing,
    angle = props.angle || styles.angle,
    borderStyle = props.borderStyle || styles.borderStyle,
    shadow = props.shadow || styles.shadow,
    alignment = props.alignment || styles.alignment,
    marginL = props.marginL || styles.marginL,
    marginR = props.marginR || styles.marginR,

    // Setters
    setPrimaryColor = props.setPrimaryColor || styles.setPrimaryColor,
    setOutlineColor = props.setOutlineColor || styles.setOutlineColor,
    setBackgroundColor = props.setBackgroundColor || styles.setBackgroundColor,
    setBackgroundOpacity = props.setBackgroundOpacity ||
      styles.setBackgroundOpacity,
    setFontSize = props.setFontSize || styles.setFontSize,
    setMarginV = props.setMarginV || styles.setMarginV,
    setOutlineWidth = props.setOutlineWidth || styles.setOutlineWidth,
    setBold = props.setBold || styles.setBold,
    setItalic = props.setItalic || styles.setItalic,
    setUnderline = props.setUnderline || styles.setUnderline,
    setStrikeOut = props.setStrikeOut || styles.setStrikeOut,
    setScaleX = props.setScaleX || styles.setScaleX,
    setScaleY = props.setScaleY || styles.setScaleY,
    setSpacing = props.setSpacing || styles.setSpacing,
    setAngle = props.setAngle || styles.setAngle,
    setBorderStyle = props.setBorderStyle || styles.setBorderStyle,
    setShadow = props.setShadow || styles.setShadow,
    setAlignment = props.setAlignment || styles.setAlignment,
    setMarginL = props.setMarginL || styles.setMarginL,
    setMarginR = props.setMarginR || styles.setMarginR,
    applyStylePreset = props.applyStylePreset || styles.applyStylePreset,
  } = props.primaryColor ? props : styles;

  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold mb-6">
        Subtitle Style Customization
      </h2>

      {/* Style Preset Selector */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Style Preset</label>
        <select
          value={selectedStyle}
          onChange={e => applyStylePreset(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="tiktok">TikTok Style</option>
        </select>
      </div>

      {/* Basic Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Basic Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded border"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-24"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {borderStyle === 1 ? "Outline Color" : "Background Color"}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={outlineColor}
                onChange={e => setOutlineColor(e.target.value)}
                className="w-10 h-10 rounded border"
              />
              <input
                type="text"
                value={outlineColor}
                onChange={e => setOutlineColor(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-24"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={e => setBackgroundColor(e.target.value)}
                className="w-10 h-10 rounded border"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={e => setBackgroundColor(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-24"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Background Opacity</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                value={backgroundOpacity}
                onChange={e => setBackgroundOpacity(Number(e.target.value))}
                min="0"
                max="1"
                step="0.1"
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
              />
              <span className="text-sm font-medium w-12 text-right">
                {Math.round(backgroundOpacity * 100)}%
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Font Size</label>
            <input
              type="number"
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              min="12"
              max="72"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Outline Width</label>
            <input
              type="number"
              value={outlineWidth}
              onChange={e => setOutlineWidth(Number(e.target.value))}
              min="0"
              max="4"
              step="0.1"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
      </div>
      {/* Advanced Settings */}
      <h1 className="text-primary text-2xl">Advance Settings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-card rounded-lg border mt-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Text Alignment</label>
          <select
            value={alignment}
            onChange={e => setAlignment(Number(e.target.value))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="1">Bottom Left</option>
            <option value="2">Bottom Center</option>
            <option value="3">Bottom Right</option>
            <option value="4">Middle Left</option>
            <option value="5">Middle Center</option>
            <option value="6">Middle Right</option>
            <option value="7">Top Left</option>
            <option value="8">Top Center</option>
            <option value="9">Top Right</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Border Style</label>
          <select
            value={borderStyle}
            onChange={e => setBorderStyle(Number(e.target.value) as 1 | 3)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="1">Outline</option>
            <option value="3">Opaque Box</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Shadow Distance</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={shadow}
              onChange={e => setShadow(Number(e.target.value))}
              min="0"
              max="4"
              step="0.5"
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            />
            <input
              type="number"
              value={shadow}
              onChange={e => setShadow(Number(e.target.value))}
              min="0"
              max="4"
              step="0.5"
              className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Vertical Margin</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={marginV}
              onChange={e => setMarginV(Number(e.target.value))}
              min="0"
              max="200"
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            />
            <input
              type="number"
              value={marginV}
              onChange={e => setMarginV(Number(e.target.value))}
              min="0"
              max="200"
              className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Left Margin</label>
          <input
            type="number"
            value={marginL}
            onChange={e => setMarginL(Number(e.target.value))}
            min="0"
            max="200"
            className="w-20 px-2 py-1 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Right Margin</label>
          <input
            type="number"
            value={marginR}
            onChange={e => setMarginR(Number(e.target.value))}
            min="0"
            max="200"
            className="w-20 px-2 py-1 border rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default SubStyle;
