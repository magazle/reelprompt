export interface Script {
  id: string;
  title: string;
  body: string;        // HTML string (rich text)
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;  // soft delete timestamp — present means trashed
}

export interface TeleprompterSettings {
  speed: number;                            // 1–10
  fontSize: number;                         // px
  lineSpacing: number;                      // 1–2.5
  textWidth: number;                        // 50–100%
  position: "top" | "center" | "bottom";
  mirrorText: boolean;
  mirrorVideo: boolean;
  textBackground: "none" | "band" | "full";
  fontStyle: "serif" | "sans";
  textStroke: boolean;
  wpm: number | null;                       // null = not calibrated
  zoom: number;                             // 1.0–3.0, default 1.0
}

export const DEFAULT_SETTINGS: TeleprompterSettings = {
  speed: 3,
  fontSize: 32,
  lineSpacing: 1.6,
  textWidth: 85,
  position: "center",
  mirrorText: false,
  mirrorVideo: true,
  textBackground: "band",
  fontStyle: "serif",
  textStroke: false,
  wpm: null,
  zoom: 1.0,
};
