import { PropsWithChildren, useEffect, useRef, useState } from "react";

import { videoChapters, videoData, videoHeatmap } from "./globals";
import { PlayerContext, settings } from "./PlayerContext";

export const DEFAULT_MAX_DURATION = 356400;
const ALLOWED_DE_SYNC_PER_SECOND = 10;
let performedDeSyncs = 0;
setInterval(() => (performedDeSyncs = 0), 2000);
export const PlayerContextProvider = (
  props: PropsWithChildren<{
    touchHistory: (video: videoData) => void;
    navigate: (link: videoData) => void;
  }>,
) => {
  const refVideo = useRef<HTMLVideoElement>(null);
  const refAudio = useRef<HTMLAudioElement>(null);
  const [settings, setSettings] = useState<settings>({
    autoAudioOnly: false,
    autoPlay: true,
    videoBackgroundBloom: true,
    allowMiniPlayer: true,
  });
  const [audioOnly, setAudioOnly] = useState(false);
  const [sourceOverride, setSourceOverride] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playlistContent, setPlaylistContent] = useState<videoData[]>([]);
  const [muted, setMuted] = useState(false);
  const [synchronizing, setSynchronizing] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [distortAudio, setDistortAudio] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentVideoBuffer, setCurrentVideoBuffer] = useState(0);
  const [currentAudioBuffer, setCurrentAudioBuffer] = useState(0);
  const [maxDuration, setMaxDuration] = useState(DEFAULT_MAX_DURATION);
  const [chapters, setChapters] = useState<videoChapters[]>([]);
  const [heatmap, setHeatmap] = useState<Required<videoHeatmap>[]>([]);
  const [playerData, setPlayerData] = useState<videoData | undefined>(
    undefined,
  );
  const [miniPlayer, setMiniPlayer] = useState(true);
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(true);
  const [singleLoop, setSingleLoop] = useState(true);

  const audioControlled =
    playerData?.files.audio !== null || miniPlayer || audioOnly;
  const targetControllerRef: typeof refAudio | typeof refVideo = audioControlled
    ? refAudio
    : refVideo;
  useEffect(() => {
    const storeAudioOnly = localStorage.getItem(
      "@initial-link/react-kit PlayerContext.audioOnly",
    );
    const storeVolume = localStorage.getItem(
      "@initial-link/react-kit PlayerContext.volume",
    );
    if (storeAudioOnly) setAudioOnly(storeAudioOnly === "true");
    if (storeVolume) setVolume(parseFloat(storeVolume));
  }, []);
  const isPlaylist = playlistContent.length === 0;
  useEffect(() => {
    if (isPlaylist) setSingleLoop(false);
    else setSingleLoop(true);
  }, [isPlaylist]);
  const syncAll = (time: number, playing: boolean, wasDeSync?: boolean) => {
    if (audioControlled) {
      if (!refAudio.current) return;
      if (performedDeSyncs >= ALLOWED_DE_SYNC_PER_SECOND) {
        // console.log(
        //   "performedDeSyncs >= ALLOWED_DE_SYNC_PER_SECOND",
        //   performedDeSyncs >= ALLOWED_DE_SYNC_PER_SECOND,
        // );
        setAudioOnly(true);
        setSynchronizing(false);
        performedDeSyncs = 0;
        if (playing) {
          void refAudio.current?.play();
        }
        return;
      }
      let toSync = 2;
      setSynchronizing(true);
      if (wasDeSync) {
        console.warn("performedDeSyncs", performedDeSyncs);
        performedDeSyncs++;
      }
      const attemptSync = () => {
        toSync--;
        if (toSync < 0) return alert("Memory leak at context<player>.syncTo()");
        if (toSync !== 0) return;
        if (playing) {
          void refVideo.current?.play();
          void refAudio.current?.play();
        }
        setSynchronizing(false);
        refAudio.current?.removeEventListener("canplay", attemptSync);
        refVideo.current?.removeEventListener("canplay", attemptSync);
      };
      refVideo.current?.pause();
      refAudio.current.pause();
      refAudio.current.currentTime = time;
      if (refVideo.current && !audioOnly) {
        refVideo.current.currentTime = time;
        refVideo.current?.addEventListener("canplay", attemptSync);
      } else {
        toSync--;
      }
      refAudio.current.addEventListener("canplay", attemptSync);
    } else {
      if (!refVideo.current) return alert("refVideo missing on SyncAll");
      setSynchronizing(true);
      refVideo.current.currentTime = time;
      const selfRef = () => {
        if (playing) {
          void refVideo.current?.play();
        }
        setSynchronizing(false);
        refVideo.current?.removeEventListener("canplay", selfRef);
      };
      refVideo.current?.addEventListener("canplay", selfRef);
    }
  };
  useEffect(() => {
    const memoryVolume = parseFloat(localStorage?.player_volume ?? "1");
    setVolume(memoryVolume);
    if (refAudio.current) refAudio.current.volume = memoryVolume;
    if (refVideo.current) refVideo.current.volume = memoryVolume;
  }, [refAudio.current, refVideo.current]);
  useEffect(() => {
    if (refAudio.current) refAudio.current.preservesPitch = !distortAudio;
    if (refVideo.current) refVideo.current.preservesPitch = !distortAudio;
  }, [distortAudio]);

  useEffect(() => {
    if (refAudio.current) refAudio.current.playbackRate = playSpeed;
    if (refVideo.current) refVideo.current.playbackRate = playSpeed;
  }, [playSpeed]);
  useEffect(() => {
    if (!playing) return;
    if (audioOnly) {
      refVideo.current?.pause();
    } else if (targetControllerRef.current) {
      performedDeSyncs = 0;
      syncAll(targetControllerRef.current.currentTime, playing);
    }
  }, [audioOnly]);
  useEffect(() => {
    if (audioControlled) {
      if (!refAudio.current) return;

      if (playing) {
        if (!audioOnly /* && !miniPlayer */) {
          if (refVideo.current && refAudio.current) {
            refAudio.current.playbackRate = playSpeed;
            refVideo.current.playbackRate = playSpeed;
            refAudio.current.volume = volume;
            refVideo.current.volume = volume;
            refAudio.current.preservesPitch = !distortAudio;
            refVideo.current.preservesPitch = !distortAudio;
            syncAll(refAudio.current.currentTime, playing);
          }
        } else {
          void refAudio.current.play();
          refAudio.current.playbackRate = playSpeed;
          refAudio.current.volume = volume;
          refAudio.current.preservesPitch = !distortAudio;
        }
      } else {
        if (!audioOnly) refVideo.current?.pause();
        refAudio.current.pause();
      }
    } else {
      if (!refVideo.current) return;
      if (playing) {
        refVideo.current.playbackRate = playSpeed;
        refVideo.current.volume = volume;
        refVideo.current.preservesPitch = !distortAudio;
        syncAll(refVideo.current.currentTime, playing);
      } else {
        refVideo.current.pause();
      }
    }

    return;
  }, [refVideo.current, refAudio.current, playing, playerData, miniPlayer]);

  return (
    <PlayerContext.Provider
      value={{
        targetControllerRef,
        refVideo,
        refAudio,
        navigate: props.navigate,
        touchHistory: props.touchHistory,
        volume: {
          value: volume,
          set: (e) => {
            localStorage.setItem(
              "@initial-link/react-kit PlayerContext.volume",
              String(e),
            );
            setVolume(e);
          },
        },
        syncAll,
        sourceOverride: { value: sourceOverride, set: setSourceOverride },
        synchronizing: { value: synchronizing, set: setSynchronizing },
        playSpeed: { value: playSpeed, set: setPlaySpeed },
        distortAudio: { value: distortAudio, set: setDistortAudio },
        playerData: { value: playerData, set: setPlayerData },
        settings: { value: settings, set: setSettings },
        audioOnly: {
          value: audioOnly,
          set: (state) => {
            localStorage.setItem(
              "@initial-link/react-kit PlayerContext.audioOnly",
              state ? "true" : "false",
            );
            setAudioOnly(state);
          },
        },
        playing: { value: playing, set: setPlaying },
        playlistContent: { value: playlistContent, set: setPlaylistContent },
        muted: { value: muted, set: setMuted },
        currentPosition: { value: currentPosition, set: setCurrentPosition },
        maxDuration: { value: maxDuration, set: setMaxDuration },
        miniPlayer: { value: miniPlayer, set: setMiniPlayer },
        miniPlayerVisible: {
          value: miniPlayerVisible,
          set: setMiniPlayerVisible,
        },
        videoBuffer: { value: currentVideoBuffer, set: setCurrentVideoBuffer },
        audioBuffer: { value: currentAudioBuffer, set: setCurrentAudioBuffer },
        singleLoop: { value: singleLoop, set: setSingleLoop },
        chapters: { value: chapters, set: setChapters },
        heatmap: { value: heatmap, set: setHeatmap },

        audioControlled,

        actionOnEnded: async () => {
          if (singleLoop) {
            refVideo.current?.pause();
            refAudio.current?.pause();
            if (refVideo.current) refVideo.current.currentTime = 0;
            if (refAudio.current) refAudio.current.currentTime = 0;
            await Promise.all([
              refVideo.current?.play(),
              refAudio.current?.play(),
            ]);
          } else {
            if (playlistContent.length > 0) {
              setMaxDuration(DEFAULT_MAX_DURATION);
              setCurrentAudioBuffer(0);
              setCurrentVideoBuffer(0);
              setCurrentPosition(0);
              let currentID = 0;
              for (let i = 0; i < playlistContent.length; i++) {
                const video = playlistContent[i];
                if (playerData?.files.audio === video.files.audio) {
                  currentID = i;
                }
              }
              if (playlistContent.length === 1) {
                refVideo.current?.pause();
                refAudio.current?.pause();
                if (refVideo.current) refVideo.current.currentTime = 0;
                if (refAudio.current) refAudio.current.currentTime = 0;
                await Promise.all([
                  refVideo.current?.play(),
                  refAudio.current?.play(),
                ]);
              } else {
                const next =
                  currentID === playlistContent.length - 1 ? 0 : currentID + 1;
                const video = playlistContent[next];
                setPlayerData(video);
                if (miniPlayer) {
                  // Load video without navigate
                  props.touchHistory(video);
                } else {
                  props.navigate(video);
                }
              }
            } else {
              setPlaying(false);
            }
          }
        },
        actionOnLoadStart: (e) => {
          e.currentTarget.volume = volume;
          e.currentTarget.preservesPitch = !distortAudio;
          syncAll(0, playing);

          // setProcessing(false);
          // e.currentTarget.volume =
          //   1 - Math.exp(Math.log(1 - Math.abs(playerVolume.value)) / Math.log(10));
          // e.currentTarget.currentTime = playerPosition.value;
        },
        actionOnDurationChange: (e) => {
          setMaxDuration(e.currentTarget.duration);
        },
        actionOnTimeUpdate: (e, type) => {
          const bufferedEnd: number = e.currentTarget.buffered.end(
            e.currentTarget.buffered.length - 1,
          );
          setCurrentPosition(e.currentTarget.currentTime);
          if (type === "video") {
            setCurrentVideoBuffer(bufferedEnd);
          } else {
            setCurrentAudioBuffer(bufferedEnd);
            if (
              !audioOnly &&
              refVideo.current !== null &&
              refVideo.current.paused !== e.currentTarget.paused
            ) {
              if (e.currentTarget.paused) void refVideo.current.pause();
              else void refVideo.current.play();
            }
          }
        },
        actionOnError: () => {
          // if (/** On error option */ false) {
          //   // context.sourceOverride.set(
          //   //   // HTTPS URL
          //   // );
          // }
        },
      }}
    >
      {props.children}
    </PlayerContext.Provider>
  );
};
