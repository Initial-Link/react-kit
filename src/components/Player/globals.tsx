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
export type videoData = {
  id: string;
  uploader: string;
  title: string;
  files: {
    video: string;
    audio: string | null;
    subtitles: string | null;
    thumbnail: string;
  };
};
