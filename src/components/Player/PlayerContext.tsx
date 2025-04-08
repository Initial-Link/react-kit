import { createContext } from "react";

import { videoChapters, videoData, videoHeatmap } from "./globals";

export type settings = {
  /**
   * @default false
   */
  autoAudioOnly: boolean;
  /**
   * @default true
   */
  videoBackgroundBloom: boolean;
  /**
   * @default false
   */
  autoPlay: boolean;
  /**
   * @default true
   */
  allowMiniPlayer: boolean;
  /**
   * @default false
   */
  sticky: boolean;
  /**
   * @default 0
   */
  stickySpacing: number;
  /**
   * @default 0
   */
  stickyTriggerDistance: number;
};

type contextState<k> = {
  value: k;
  set: React.Dispatch<React.SetStateAction<k>>;
};
// eslint-disable-next-line
export interface PlayerPlaylistMetaOverwrite {}
// eslint-disable-next-line
export interface PlayerVideoMetaOverwrite {}
type PlayerContextProps = {
  refVideo: React.RefObject<HTMLVideoElement | null>;
  refAudio: React.RefObject<HTMLAudioElement | null>;
  syncAll: (time: number, playing: boolean, wasDeSync?: boolean) => void;
  synchronizing: contextState<boolean>;
  playSpeed: contextState<number>;
  volume: contextState<number>;
  sourceOverride: contextState<string>;
  distortAudio: contextState<boolean>;
  playerData: contextState<videoData | undefined>;
  audioOnly: contextState<boolean>;
  playing: contextState<boolean>;
  currentPosition: contextState<number>;
  maxDuration: contextState<number>;
  miniPlayer: contextState<boolean>;
  miniPlayerVisible: contextState<boolean>;
  muted: contextState<boolean>;
  videoBuffer: contextState<number>;
  audioBuffer: contextState<number>;
  singleLoop: contextState<boolean>;
  /**
   * You can append custom metadata to entries by overwriting the internal interface
   *
   * @example
   * declare module "@initial-link/react-kit" {
   *   export interface PlayerPlaylistMetaOverwrite {
   *     uploadTime: number
   *     anythingElse: any
   *   }
   * }
   *
   */
  playlistMeta: contextState<PlayerPlaylistMetaOverwrite | undefined>;
  playlistContent: contextState<videoData[]>;
  chapters: contextState<videoChapters[]>;
  heatmap: contextState<videoHeatmap[]>;
  audioControlled: boolean;
  settings: contextState<settings>;
  touchHistory: (video: videoData) => void;
  navigate: (link: videoData) => void;
  actionOnEnded: (
    event: React.SyntheticEvent<HTMLAudioElement, Event>,
  ) => Promise<void>;
  actionOnLoadStart: (
    event: React.SyntheticEvent<HTMLAudioElement, Event>,
  ) => void;
  actionOnDurationChange: (
    event: React.SyntheticEvent<HTMLAudioElement, Event>,
  ) => void;
  actionOnTimeUpdate: (
    event: React.SyntheticEvent<HTMLAudioElement, Event>,
    type: "audio" | "video",
  ) => void;
  actionOnError: () => void;
  targetControllerRef:
    | React.RefObject<HTMLAudioElement | null>
    | React.RefObject<HTMLVideoElement | null>;
};

export const PlayerContext = createContext<PlayerContextProps>(
  // For now lets not consider edge case for when context is not initialized
  {} as unknown as PlayerContextProps,
);
