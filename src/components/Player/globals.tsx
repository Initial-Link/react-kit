import { PlayerVideoMetaOverwrite } from "./PlayerContext";

export type videoHeatmap = {
  id: string;
  start_time: number;
  end_time: number;
  value_time: number;
};
export type videoChapters = {
  start_time: number;
  title: string;
  end_time: number;
};
/**
 * You can append custom metadata to entries by overwriting the internal interface
 *
 * @example
 * declare module "@initial-link/react-kit" {
 *   export interface PlayerVideoMetaOverwrite {
 *     uploadTime: number
 *     anythingElse: any
 *   }
 * }
 *
 */
export type videoData = {
  id: string;
  title: string;
  files: {
    video: string;
    audio: string | null;
    subtitles: string | null;
    thumbnail: string;
  };
  meta: PlayerVideoMetaOverwrite;
};
