export interface Script {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeleprompterSettings {
  speed: number; // 1-10
  fontSize: number; // px
  lineSpacing: number; // 1-3
  textWidth: number; // 50-100%
  position: "top" | "center" | "bottom";
  mirrorText: boolean;
  mirrorVideo: boolean;
}

export const DEFAULT_SETTINGS: TeleprompterSettings = {
  speed: 3,
  fontSize: 32,
  lineSpacing: 1.6,
  textWidth: 85,
  position: "center",
  mirrorText: false,
  mirrorVideo: true,
};
