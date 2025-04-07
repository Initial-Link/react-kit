import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Popover,
  Skeleton,
  styled,
  TooltipProps,
  Typography,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { useContext, useEffect, useRef, useState } from "react";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FastForwardIcon from "@mui/icons-material/FastForward";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import MusicOffIcon from "@mui/icons-material/MusicOff";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import MovieIcon from "@mui/icons-material/Movie";
import RepeatIcon from "@mui/icons-material/Repeat";
import RepeatOneIcon from "@mui/icons-material/RepeatOne";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import SubtitlesOffIcon from "@mui/icons-material/SubtitlesOff";

import { DEFAULT_MAX_DURATION } from "./PlayerContextProvider";
import { PlayerContext } from "./PlayerContext";
import ProgressBar from "./ProgressBar";
import { parseTimeDuration } from "./convertor";
import { videoChapters, videoData, videoHeatmap } from "./globals";

const HIDE_INTERFACE_AFTER_MS = 2000;
const HIDE_INTERFACE_AFTER_MS_SHORT = 1400;

const quickEnough = [false, false, false, false, false, false, false];
const timeout: ReturnType<typeof setTimeout>[] = [];
function createDoubleClickListener(
  single: () => void,
  double: () => void,
  id: number,
  time: number = 200,
) {
  const clear = (extended = false) => {
    clearTimeout(timeout?.[id]);
    timeout[id] = setTimeout(() => {
      quickEnough[id] = false;
      if (!extended) single();
    }, time);
  };
  return () => {
    clear();
    if (quickEnough[id]) {
      clear(true);
      if (quickEnough[id]) {
        double();
      }
    }
    quickEnough[id] = true;
  };
}
export const ERROR_RANGE_SECONDS_RESET = 1;
const ERROR_RANGE_SECONDS_WARNING = 0.5;
const ERROR_RANGE_SECONDS_MESSAGE = 0.25;
// var lastClick = 0;
let lastKnownY = 0;

const ThemedTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: `rgba(${theme.palette.primary.main} / 0.75)`,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: `rgba(${theme.palette.primary.main} / 0.75)`,
  },
}));
const SPEED_MAX = 2;
const SPEED_MIN = 0.25;
interface position {
  x: number;
  y: number;
}
export default function VideoPlayer(props: {
  videoData?: videoData;
  isPlaylist: boolean;
  errorDisplay?: string;
  subtitles: string[];
  chapters: videoChapters[];
  heatmap: Required<videoHeatmap>[];
  ScrollTriggerDistance?: number;
  showInlineTitle?: boolean;
}) {
  const ScrollTriggerDistance = props.ScrollTriggerDistance ?? 64;
  const context = useContext(PlayerContext);
  const [fullscreen, setFullscreen] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [isSubtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [lastAction, setLastAction] = useState(0);
  const [forcedVolumeWidth, setForcedVolumeWidth] = useState("0px");
  const [deSyncMessage, setDeSyncMessage] = useState("");
  const [durationError, setDurationError] = useState("");
  const [hideVideoErrors, setHideVideoErrors] = useState(false);
  const [forcedVolumePadding, setForcedVolumePadding] = useState("0px");
  const [dodgeNav, setDodgeNav] = useState(true);

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<position>({
    x: 0,
    y: 0,
  });

  const canvas = useRef<HTMLCanvasElement>(null);
  const ctx = canvas.current?.getContext("2d");

  const uniqueID = props.videoData?.id;
  const thumbnail = context.playerData.value?.files.thumbnail;
  useEffect(() => {
    if (!uniqueID) return;
    if (uniqueID !== context.playerData.value?.id) {
      context.maxDuration.set(DEFAULT_MAX_DURATION);
      context.currentPosition.set(0);
      context.audioBuffer.set(0);
    }
    context.videoBuffer.set(0);
    context.playerData.set(props.videoData);
    if (context.settings.value.autoPlay) {
      context.playing.set(true);
    }
  }, [uniqueID]);
  useEffect(() => {
    if (props.chapters.length === 0) return;
    context.chapters.set(props.chapters);
  }, [props.chapters]);

  useEffect(() => {
    if (props.heatmap.length === 0) return;
    context.heatmap.set(props.heatmap);
  }, [props.heatmap]);
  useEffect(() => {
    if (props.isPlaylist) return;
    context.playlistContent.set([]);
  }, [props.isPlaylist]);
  useEffect(() => {
    const fullScreenChanger = () => {
      if (document.fullscreenElement) {
        setFullscreen(true);
      } else {
        setFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", fullScreenChanger);
    return () => {
      document.removeEventListener("fullscreenchange", fullScreenChanger);
    };
  }, []);
  useEffect(() => {
    if (
      !context.playing.value ||
      context.audioOnly.value ||
      !context.settings.value.videoBackgroundBloom
    )
      return;
    const backScreenDrawerInterval = setInterval(() => {
      if (!ctx || !context.refVideo.current) return;
      ctx.globalAlpha = 0.1;
      ctx.drawImage(context.refVideo.current, 0, 0, 110, 75);
    }, 250);
    return () => clearInterval(backScreenDrawerInterval);
  }, [
    context.refVideo.current,
    ctx,
    context.playing.value,
    context.audioOnly.value,
    context.settings.value.videoBackgroundBloom,
  ]);
  useEffect(() => {
    const backdropChanger = () => {
      const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
      if (lastKnownY > scrollPosition + ScrollTriggerDistance) {
        setDodgeNav(false);
        lastKnownY = scrollPosition;
        return;
      }
      if (lastKnownY < scrollPosition - ScrollTriggerDistance) {
        setDodgeNav(true);
        lastKnownY = scrollPosition;
        return;
      }
    };
    document.addEventListener("scroll", backdropChanger);
    return () => {
      document.removeEventListener("scroll", backdropChanger);
    };
  }, [dodgeNav]);
  const togglePlay = () => {
    context.playing.set(!context.playing.value);
  };
  const moveVideoPointer = (time: number, expectedPlayState: boolean) => {
    setLastAction(Date.now() - HIDE_INTERFACE_AFTER_MS_SHORT);
    setHideControls(false);
    if (context.audioOnly.value) {
      if (context.refAudio.current)
        context.refAudio.current.currentTime += time;
    } else if (context.targetControllerRef.current) {
      context.playing.set(expectedPlayState);
      context.syncAll(
        context.targetControllerRef.current.currentTime + time,
        expectedPlayState,
      );
    }
  };
  useEffect(() => {
    const onOrientationChange = () => {
      if (screen.orientation.type.match(/\w+/)?.[0] === "landscape") {
        void document.body.requestFullscreen();
      } else {
        void document.exitFullscreen();
      }
    };
    screen.orientation.addEventListener("change", onOrientationChange);
    return () => {
      screen.orientation.removeEventListener("change", onOrientationChange);
    };
  }, [context.playing.value]);
  const subtitleSync = (isSubtitlesEnabledParam: boolean) => {
    if (isSubtitlesEnabledParam) {
      if (!context.playerData.value?.files.subtitles) return;
      const track = document.createElement("track");
      track.kind = "captions";
      track.label = "English";
      track.srclang = "en";
      track.src = context.playerData.value.files.subtitles;
      if (context.refVideo.current) context.refVideo.current.innerHTML = "";
      if (context.refVideo.current) context.refVideo.current.appendChild(track);
      if (context.refVideo.current)
        context.refVideo.current.textTracks[0].mode = "showing";
    } else {
      if (
        context.refVideo.current &&
        context.refVideo.current.textTracks.length > 0
      )
        context.refVideo.current.textTracks[0].mode = "hidden";
      if (context.refVideo.current) context.refVideo.current.innerHTML = "";
    }
  };
  useEffect(() => {
    subtitleSync(isSubtitlesEnabled);
  }, [context.refVideo.current?.src]);
  const generalClick = (forced: boolean) => {
    if (forced || document.body.offsetWidth > 1200) {
      if (!hideControls) togglePlay();
      setHideControls(false);
    } else {
      setHideControls(!hideControls);
    }
    setLastAction(Date.now());
  };
  const processedSpeed = Math.floor(context.playSpeed.value * 100) / 100;
  return (
    <Box
      tabIndex={0}
      sx={(theme) => ({
        width: "100%",
        paddingTop: "56.25%",
        position: "relative",
        gridArea: "video",
        [theme.breakpoints.down("sm")]: {
          position: "sticky",
          top: dodgeNav ? 0 : "72px",
          transition: "top 1s",
          zIndex: fullscreen ? 10 : 5,
        },
        "&::before": {
          backdropFilter: "blur(5px)",
          content: "no-open-quote",
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
        },
      })}
      onContextMenu={(event) => {
        event.preventDefault();
        setShowContextMenu(true);
        setContextMenuPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.shiftKey) return;
        switch (event.code) {
          case "Digit9":
          case "Digit0":
          case "Minus":
          case "Equal":
          case "BracketRight":
          case "BracketLeft":
          case "KeyK":
          case "Space":
          case "ArrowLeft":
          case "KeyJ":
          case "ArrowRight":
          case "KeyL":
          case "Period":
          case "Comma":
          case "KeyM":
            break;
          default:
            return;
        }
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyUp={(event) => {
        if (event.altKey || event.ctrlKey || event.shiftKey) return;
        switch (event.code) {
          case "Digit9": {
            const lowerVolume = Math.max(0, context.volume.value * 0.8);
            context.volume.set(lowerVolume);
            setForcedVolumeWidth("100px !important");
            setForcedVolumePadding("0px 8px");
            setLastAction(Date.now() - HIDE_INTERFACE_AFTER_MS_SHORT);
            setHideControls(false);
            if (context.refAudio.current)
              context.refAudio.current.volume = lowerVolume;
            if (context.refVideo.current)
              context.refVideo.current.volume = lowerVolume;
            break;
          }
          case "Digit0": {
            const higherVolume = Math.min(1, context.volume.value * 1.2);
            context.volume.set(higherVolume);
            setForcedVolumeWidth("100px !important");
            setForcedVolumePadding("0px 8px");
            setLastAction(Date.now() - HIDE_INTERFACE_AFTER_MS_SHORT);
            setHideControls(false);
            if (context.refAudio.current)
              context.refAudio.current.volume = higherVolume;
            if (context.refVideo.current)
              context.refVideo.current.volume = higherVolume;
            break;
          }
          case "BracketLeft":
            context.playSpeed.set(
              Math.max(
                SPEED_MIN,
                Math.round(context.playSpeed.value * 90) / 100,
              ),
            );
            setLastAction(Date.now() - HIDE_INTERFACE_AFTER_MS_SHORT);
            setHideControls(false);
            break;
          case "BracketRight":
            context.playSpeed.set(
              Math.min(
                SPEED_MAX,
                Math.round(context.playSpeed.value * 110) / 100,
              ),
            );
            setLastAction(Date.now() - HIDE_INTERFACE_AFTER_MS_SHORT);
            setHideControls(false);
            break;
          case "Minus":
            context.playSpeed.set(
              Math.max(SPEED_MIN, context.playSpeed.value - 0.06),
            );
            setLastAction(Date.now() - HIDE_INTERFACE_AFTER_MS_SHORT);
            setHideControls(false);
            break;
          case "Equal":
            context.playSpeed.set(
              Math.min(SPEED_MAX, context.playSpeed.value + 0.06),
            );
            setLastAction(Date.now() - HIDE_INTERFACE_AFTER_MS_SHORT);
            setHideControls(false);
            break;
          case "KeyM":
            context.muted.set(!context.muted.value);
            break;
          case "KeyK":
          case "Space":
            if (context.playing.value) {
              setLastAction(Date.now());
              setHideControls(false);
            } else {
              setLastAction(0);
              setHideControls(true);
            }
            togglePlay();
            break;
          case "ArrowLeft":
          case "KeyJ":
            moveVideoPointer(-5, context.playing.value);
            break;
          case "ArrowRight":
          case "KeyL":
            moveVideoPointer(5, context.playing.value);
            break;
          case "Period":
            moveVideoPointer(1 / 60, false);
            break;
          case "Comma":
            moveVideoPointer(-1 / 60, false);
            break;
          default:
            return;
        }
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div />
      {!context.playerData.value ? (
        <Skeleton
          sx={{
            position: "absolute",
            top: 0,
            borderRadius: "16px",
          }}
          variant="rectangular"
          width="100%"
          height="100%"
        />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: "-3% -5%",
              backgroundSize: "contain",
              filter: "blur(150px)",
              pointerEvents: "none",
              ...(props.videoData ? { opacity: 0.5, zIndex: -1 } : {}),
            }}
          >
            <canvas
              ref={canvas}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: context.audioOnly.value ? 0 : 1,
                transition: "opacity 5s",
              }}
              width="110"
              height="75"
            />
            <img
              src={thumbnail}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: context.audioOnly.value ? 1 : 0,
                transition: "opacity 5s",
              }}
            />
          </div>
          <Box
            sx={(theme) =>
              fullscreen
                ? {
                    position: "fixed",
                    inset: 0,
                    background: "black",
                    zIndex: 2147483647,
                    cursor: hideControls ? "none" : "auto",
                  }
                : {
                    position: "absolute",
                    display: "flex",
                    top: 0,
                    background: "rgba(0,0,0,1)",
                    height: "100%",
                    width: "100%",
                    overflow: "hidden",
                    cursor: hideControls ? "none" : "auto",
                    [theme.breakpoints.up("md")]: {
                      borderRadius: "16px",
                    },
                  }
            }
            onMouseMove={() => {
              const now = Date.now();
              if (lastAction + 500 < now) {
                setLastAction(now);
                setHideControls(false);
              }
            }}
            onMouseLeave={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const leftOut = box.left > event.clientX;
              const rightOut = box.right < event.clientX;
              const topOut = box.top > event.clientY;
              const bottomOut = box.bottom < event.clientY;
              const wasRightClick = event.clientY < 0 || event.clientX < 0;
              if (
                context.playing.value &&
                !wasRightClick &&
                (leftOut || rightOut || bottomOut || topOut)
              ) {
                setLastAction(0);
                setHideControls(true);
              }
            }}
            onTouchMove={() => {
              const now = Date.now();
              if (lastAction + 500 < now) {
                setLastAction(now);
                setHideControls(false);
              }
            }}
          >
            {context.playerData.value ? (
              <>
                <video
                  id="Player"
                  ref={context.refVideo}
                  muted={
                    context.audioOnly.value
                      ? true
                      : context.playerData.value.files.audio !== null
                        ? true
                        : context.muted.value
                  }
                  src={
                    context.sourceOverride.value
                      ? context.sourceOverride.value
                      : context.audioOnly.value
                        ? "unload"
                        : context.playerData.value.files.video
                  }
                  poster={context.audioOnly.value ? thumbnail : undefined}
                  style={{
                    height: "100%",
                    width: "100%",
                    objectFit: context.audioOnly.value ? "cover" : undefined,

                    ...(fullscreen
                      ? {
                          position: "fixed",
                          inset: 0,
                          margin: "auto",
                        }
                      : {}),
                  }}
                  width="100%"
                  onEnded={
                    context.audioControlled ? undefined : context.actionOnEnded
                  }
                  onLoadStart={
                    context.audioControlled
                      ? undefined
                      : context.actionOnLoadStart
                  }
                  onDurationChange={
                    context.audioControlled
                      ? (e) => {
                          if (
                            context.maxDuration.value !==
                              DEFAULT_MAX_DURATION &&
                            context.maxDuration.value !== 0 &&
                            Math.floor(context.maxDuration.value) !==
                              Math.floor(e.currentTarget.duration) &&
                            e.currentTarget.duration !== 0
                          ) {
                            setDurationError(
                              `Video seek is unavailable for this video`,
                            );
                          } else {
                            setDurationError("");
                          }
                        }
                      : context.actionOnDurationChange
                  }
                  onTimeUpdate={
                    context.audioControlled
                      ? (e) => {
                          if (
                            document.hidden &&
                            !context.audioOnly.value &&
                            context.settings.value.autoAudioOnly
                          ) {
                            context.audioOnly.set(true);
                          }
                          const bufferedEnd: number =
                            e.currentTarget.buffered.end(
                              e.currentTarget.buffered.length - 1,
                            );
                          context.videoBuffer.set(bufferedEnd);

                          if (lastAction < Date.now() - HIDE_INTERFACE_AFTER_MS)
                            setHideControls(true);

                          if (!context.refAudio.current) return;
                          const deSyncGap = Math.abs(
                            e.currentTarget.currentTime -
                              context.refAudio.current?.currentTime,
                          );
                          //   if (deSyncGap > 2) {}
                          if (deSyncGap > ERROR_RANGE_SECONDS_RESET) {
                            context.syncAll(
                              context.refAudio.current.currentTime,
                              context.playing.value,
                              true,
                            );
                            setDeSyncMessage(
                              `DeSync: ${Math.floor(deSyncGap * 100) / 100}s (Synchronizing...)`,
                            );
                          } else if (deSyncGap > ERROR_RANGE_SECONDS_WARNING) {
                            setDeSyncMessage(
                              `DeSync: ${
                                Math.floor(deSyncGap * 100) / 100
                              }s (Auto Sync at ${ERROR_RANGE_SECONDS_RESET}s)`,
                            );
                          } else if (deSyncGap > ERROR_RANGE_SECONDS_MESSAGE) {
                            setDeSyncMessage(
                              `DeSync: ${Math.floor(deSyncGap * 1000)}ms`,
                            );
                          } else if (deSyncMessage !== "") {
                            setDeSyncMessage("");
                          }
                        }
                      : (e) => {
                          if (lastAction < Date.now() - HIDE_INTERFACE_AFTER_MS)
                            setHideControls(true);

                          context.actionOnTimeUpdate(e, "video");
                        }
                  }
                  onError={
                    context.audioControlled ? undefined : context.actionOnError
                  }
                />
                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    inset: 0,
                    width: "auto",
                    minHeight: "auto",
                    display: "flex",
                    flexDirection: "row",
                    transition: theme.transitions.create("bottom"),
                  })}
                >
                  <div
                    style={{ height: "100%", width: "25%" }}
                    onClick={createDoubleClickListener(
                      () => generalClick(false),
                      () => moveVideoPointer(-10, context.playing.value),
                      0,
                    )}
                  />
                  <div
                    style={{ height: "100%", width: "50%" }}
                    onClick={createDoubleClickListener(
                      () => generalClick(false),
                      () =>
                        document
                          .exitFullscreen()
                          .catch(() => document.body.requestFullscreen()),
                      1,
                    )}
                  >
                    <Box
                      style={{
                        position: "absolute",
                        margin: "auto",
                        inset: 0,
                        height: "80px",
                        width: "80px",
                        borderRadius: "80px",
                        opacity:
                          hideControls && !context.synchronizing.value
                            ? 0
                            : context.playing.value
                              ? 0.3
                              : 1,
                        transition: "opacity 200ms",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        generalClick(true);
                      }}
                    >
                      <Box
                        style={{
                          position: "absolute",
                          margin: "auto",
                          inset: 0,
                          height: "80px",
                          width: "80px",
                          borderRadius: "80px",
                          background: "#000000bf",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {context.synchronizing.value ? (
                          <CircularProgress />
                        ) : context.playing.value ? (
                          <PauseIcon
                            style={{ fontSize: "46px", color: "white" }}
                          />
                        ) : (
                          <PlayArrowIcon
                            style={{ fontSize: "46px", color: "white" }}
                          />
                        )}
                      </Box>
                    </Box>
                  </div>
                  <div
                    style={{ height: "100%", width: "25%" }}
                    onClick={createDoubleClickListener(
                      () => generalClick(false),
                      () => moveVideoPointer(10, context.playing.value),
                      2,
                    )}
                  />
                </Box>
                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    bottom: hideControls ? "-100px" : 0,
                    left: 0,
                    right: 0,
                    width: "100%",
                    pointerEvents: "none",
                    minHeight: "100px",
                    opacity: 0.6,
                    background: `linear-gradient(#00000000, #000000FF)`,
                    display: "flex",
                    transition: theme.transitions.create("bottom"),
                  })}
                />
                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    top: hideControls ? "-100px" : 0,
                    left: 0,
                    right: 0,
                    width: "100%",
                    pointerEvents: "none",
                    minHeight: "100px",
                    opacity: 0.6,
                    background: `linear-gradient(#000000FF, #00000000)`,
                    display: "flex",
                    transition: theme.transitions.create("top"),
                  })}
                />

                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    top: !hideControls && fullscreen ? "40px" : 0,
                    /*
                      hideControls fullscreen 0
                      !hideControls fullscreen 40
                      hideControls !fullscreen 0
                      !hideControls !fullscreen 0
                      */
                    opacity: hideVideoErrors
                      ? 0
                      : hideControls /*||context.audioOnly.value*/
                        ? 0.3
                        : 1,
                    left: 0,
                    right: 0,
                    width: "100%",
                    padding: theme.spacing(1),
                    transition: theme.transitions.create(["top", "opacity"]),
                    pointerEvents: "none",
                  })}
                  onClick={() => setLastAction(Date.now())}
                  onContextMenu={(event) => event.stopPropagation()}
                >
                  <Typography fontSize="12px" margin="auto" color="red">
                    {`${deSyncMessage}${deSyncMessage !== "" && durationError !== "" ? " | " : ""}${durationError}`}
                  </Typography>
                </Box>
                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    top: hideControls ? "-72px" : 0,
                    left: 0,
                    right: 0,
                    color: theme.palette.text.primary,
                    // width: "100%",
                    // minHeight: "100%",
                    padding: theme.spacing(1),
                    display: "flex",
                    flexDirection: "column-reverse",
                    gap: theme.spacing(1),
                    transition: theme.transitions.create("top"),
                  })}
                  onClick={() => setLastAction(Date.now())}
                  onContextMenu={(event) => event.stopPropagation()}
                >
                  <Box
                    sx={(theme) => ({
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      gap: theme.spacing(1),
                    })}
                  >
                    <div>
                      {fullscreen || props.showInlineTitle ? (
                        <Typography fontSize="24px" margin="auto" color="white">
                          {context.playerData.value.title}
                        </Typography>
                      ) : undefined}
                    </div>
                    <div style={{ flex: 1 }} />
                    <IconButton
                      style={{ color: "white" }}
                      onClick={() => {
                        context.playSpeed.set(
                          Math.max(SPEED_MIN, context.playSpeed.value - 0.06),
                        );
                      }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                      onClick={() => context.playSpeed.set(1)}
                    >
                      <Typography
                        sx={(theme) => ({
                          color: "white",
                          [theme.breakpoints.down("sm")]: {
                            fontSize: "12px",
                          },
                        })}
                      >
                        {((processedSpeed + "").length === 1
                          ? `${processedSpeed}.00`
                          : (processedSpeed + "").length === 3
                            ? `${processedSpeed}0`
                            : processedSpeed
                        ).toString()}
                      </Typography>
                    </Box>
                    <IconButton
                      style={{ color: "white" }}
                      onClick={() => {
                        context.playSpeed.set(
                          Math.min(SPEED_MAX, context.playSpeed.value + 0.06),
                        );
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                    <ThemedTooltip title="Pitch Shift" placement="bottom">
                      <IconButton
                        style={{ color: "white" }}
                        onClick={() => {
                          context.distortAudio.set(!context.distortAudio.value);
                        }}
                      >
                        {context.distortAudio.value ? (
                          <MusicNoteIcon />
                        ) : (
                          <MusicOffIcon />
                        )}
                      </IconButton>
                    </ThemedTooltip>
                  </Box>
                </Box>
                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    bottom: hideControls ? "-72px" : 0,
                    left: 0,
                    right: 0,
                    color: theme.palette.text.primary,
                    // width: "100%",
                    // minHeight: "100%",
                    padding: theme.spacing(1),
                    display: "flex",
                    flexDirection: "column-reverse",
                    gap: theme.spacing(1),
                    transition: theme.transitions.create("bottom"),
                  })}
                  onClick={() => setLastAction(Date.now())}
                  onContextMenu={(event) => event.stopPropagation()}
                >
                  <Box
                    sx={(theme) => ({
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      gap: theme.spacing(1),
                    })}
                  >
                    <IconButton onClick={togglePlay} style={{ color: "white" }}>
                      {context.playing.value ? (
                        <PauseIcon />
                      ) : (
                        <PlayArrowIcon />
                      )}
                    </IconButton>
                    {context.playlistContent.value.length > 0 ? (
                      <IconButton style={{ color: "white" }}>
                        <FastForwardIcon
                          onClick={() => {
                            let currentID = 0;
                            for (
                              let i = 0;
                              i < context.playlistContent.value.length;
                              i++
                            ) {
                              const video = context.playlistContent.value[i];
                              if (
                                context.playerData.value?.files.audio ===
                                video?.files.audio
                              ) {
                                currentID = i;
                              }
                            }
                            const next =
                              currentID ===
                              context.playlistContent.value.length - 1
                                ? 0
                                : currentID + 1;
                            const videoData =
                              context.playlistContent.value[next];
                            context.playerData.set(videoData);
                            if (context.miniPlayer.value) {
                              // Load video without navigate

                              context.touchHistory(videoData);
                            } else {
                              context.navigate(videoData);
                            }
                          }}
                        />
                      </IconButton>
                    ) : undefined}
                    <Box
                      sx={(theme) => ({
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        "&:hover > .VolumeBar": {
                          padding: theme.spacing(0, 1),
                          width: "100px",
                        },
                      })}
                    >
                      <IconButton
                        style={{ color: "white" }}
                        onClick={() => {
                          context.muted.set(!context.muted.value);
                        }}
                      >
                        {context.muted.value ? (
                          <VolumeOffIcon />
                        ) : (
                          <VolumeUpIcon />
                        )}
                      </IconButton>

                      <Box
                        className="VolumeBar"
                        sx={{
                          padding: forcedVolumePadding,
                          width: forcedVolumeWidth,
                          transition: "width 200ms, padding 200ms",
                        }}
                      >
                        <ProgressBar
                          //Math.log(Math.log((context.refAudio.current?.volume ?? 0) + 1) / Math.log(2) + 1) /
                          current={Math.abs(
                            Math.exp(
                              Math.log(
                                1 -
                                  (context.targetControllerRef.current
                                    ?.volume ?? 0),
                              ) * Math.log(10),
                            ) - 1,
                          )}
                          bufferAudio={1}
                          bufferVideo={1}
                          max={1}
                          onStartDragging={() => {
                            setForcedVolumeWidth("100px !important");
                            setForcedVolumePadding("0px 8px");
                          }}
                          onEndDragging={(newCurrent) => {
                            if (!context.targetControllerRef.current) return;
                            setForcedVolumeWidth("0px");
                            setForcedVolumePadding("0px");
                            context.muted.set(false);
                            //const val = Math.exp(Math.log(2) * (Math.exp(Math.log(2) * newCurrent) - 1)) - 1;
                            const val =
                              1 -
                              Math.exp(
                                Math.log(1 - Math.abs(newCurrent)) /
                                  Math.log(10),
                              );
                            //Math.abs(Math.exp(Math.log(1 - val) * Math.log(10)) - 1);
                            context.volume.set(val);
                            context.targetControllerRef.current.volume = val;
                          }}
                        />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={(theme) => ({
                          color: "white",
                          [theme.breakpoints.down("sm")]: {
                            fontSize: "12px",
                          },
                        })}
                      >
                        {`${parseTimeDuration(
                          context.currentPosition.value,
                        )} / ${parseTimeDuration(context.maxDuration.value)}`}
                      </Typography>
                    </Box>
                    <div style={{ flex: 1 }} />
                    {context.playerData.value.files.subtitles !== null ? (
                      <ThemedTooltip title="Subtitles" placement="top">
                        <IconButton
                          style={{
                            color: "white",
                            display:
                              props.subtitles.length === 0 ? "none" : undefined,
                          }}
                          onClick={() => {
                            subtitleSync(!isSubtitlesEnabled);
                            setSubtitlesEnabled(!isSubtitlesEnabled);
                          }}
                        >
                          {isSubtitlesEnabled ? (
                            <SubtitlesIcon />
                          ) : (
                            <SubtitlesOffIcon />
                          )}
                        </IconButton>
                      </ThemedTooltip>
                    ) : undefined}
                    <ThemedTooltip title="Loop" placement="top">
                      <IconButton
                        style={{ color: "white" }}
                        onClick={() => {
                          context.singleLoop.set(!context.singleLoop.value);
                        }}
                      >
                        {context.singleLoop.value ? (
                          <RepeatOneIcon />
                        ) : (
                          <RepeatIcon />
                        )}
                      </IconButton>
                    </ThemedTooltip>
                    {context.playerData.value.files.audio !== null ? (
                      <ThemedTooltip title="Toggle video" placement="top">
                        <IconButton
                          style={{ color: "white" }}
                          onClick={() => {
                            context.audioOnly.set(!context.audioOnly.value);
                          }}
                        >
                          {context.audioOnly.value ? (
                            <MovieIcon />
                          ) : (
                            <HeadphonesIcon />
                          )}
                        </IconButton>
                      </ThemedTooltip>
                    ) : undefined}
                    <IconButton
                      style={{ color: "white" }}
                      onClick={async () => {
                        try {
                          await document.exitFullscreen();
                        } catch {
                          await document.body.requestFullscreen();
                        }
                      }}
                    >
                      {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>
                  </Box>
                  <Box
                    sx={(theme) => ({
                      // width: "100%",
                      padding:
                        hideControls && !fullscreen ? 0 : theme.spacing(0, 2),
                      marginBottom: hideControls && !fullscreen ? "9px" : 0,
                      opacity: hideControls && !fullscreen ? 0.25 : 1,
                      pointerEvents:
                        hideControls && !fullscreen ? "none" : undefined,
                      transition: theme.transitions.create([
                        "margin-bottom",
                        "padding",
                        "opacity",
                      ]),
                    })}
                  >
                    <ProgressBar
                      current={context.currentPosition.value}
                      bufferAudio={
                        context.audioOnly.value
                          ? context.audioBuffer.value
                          : null
                      }
                      bufferVideo={
                        context.audioOnly.value
                          ? null
                          : context.videoBuffer.value
                      }
                      max={context.maxDuration.value}
                      onStartDragging={() => {}}
                      main
                      chapters={context.chapters.value}
                      heatmap={context.heatmap.value}
                      minimized={hideControls}
                      onEndDragging={(newCurrent) => {
                        if (context.audioOnly.value) {
                          if (context.refAudio.current)
                            context.refAudio.current.currentTime = newCurrent;
                        } else if (context.targetControllerRef.current) {
                          context.syncAll(newCurrent, context.playing.value);
                        }
                      }}
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <></>
            )}
          </Box>
        </>
      )}

      <Popover
        open={showContextMenu}
        onClose={() => {
          setShowContextMenu(false);
        }}
        anchorReference="anchorPosition"
        anchorPosition={{
          top: contextMenuPosition.y,
          left: contextMenuPosition.x,
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{
          zIndex: 2147483647 + 1,
        }}
        onContextMenu={(event) => event.stopPropagation()}
      >
        <Paper
          sx={(theme) => ({
            padding: theme.spacing(1),
            display: "flex",
            flexDirection: "column",
          })}
        >
          <Typography variant="h5">Video Options</Typography>
          <hr style={{ width: "100%" }} />

          <Button
            startIcon={<InfoIcon />}
            onClick={() => {
              setHideVideoErrors(!hideVideoErrors);
            }}
            sx={{ justifyContent: "left" }}
          >
            {`${hideVideoErrors ? "Show" : "Hide"} Errors`}
          </Button>
          <Button
            startIcon={
              context.singleLoop.value ? <RepeatOneIcon /> : <RepeatIcon />
            }
            onClick={() => {
              context.singleLoop.set(!context.singleLoop.value);
            }}
            sx={{ justifyContent: "left" }}
          >
            Toggle Loop
          </Button>
          <Button
            startIcon={
              context.muted.value ? <VolumeOffIcon /> : <VolumeUpIcon />
            }
            onClick={() => {
              context.muted.set(!context.muted.value);
            }}
            sx={{ justifyContent: "left" }}
          >
            Toggle Mute
          </Button>
          {context.playerData.value?.files.audio !== null ? (
            <>
              <hr style={{ width: "100%" }} />
              <Button
                startIcon={
                  context.audioOnly.value ? <MovieIcon /> : <HeadphonesIcon />
                }
                onClick={() => {
                  context.audioOnly.set(!context.audioOnly.value);
                }}
                sx={{ justifyContent: "left" }}
              >
                Toggle Audio Only
              </Button>
              <Button
                startIcon={
                  isSubtitlesEnabled ? <SubtitlesIcon /> : <SubtitlesOffIcon />
                }
                onClick={() => {
                  subtitleSync(!isSubtitlesEnabled);
                  setSubtitlesEnabled(!isSubtitlesEnabled);
                }}
                sx={{
                  justifyContent: "left",
                  display: props.subtitles.length === 0 ? "none" : undefined,
                }}
              >
                Toggle Subtitles
              </Button>
            </>
          ) : undefined}
          <hr style={{ width: "100%" }} />
          <Button
            startIcon={fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            onClick={async () => {
              try {
                await document.exitFullscreen();
              } catch {
                await document.body.requestFullscreen();
              }
            }}
            sx={{ justifyContent: "left" }}
          >
            Toggle Fullscreen
          </Button>
        </Paper>
      </Popover>
    </Box>
  );
}
