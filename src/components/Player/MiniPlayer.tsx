import { useContext, useEffect, useState } from "react";
import { DEFAULT_MAX_DURATION, PlayerContext } from "./PlayerContext";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ProgressBar from "./ProgressBar";
import IconButton from "@mui/material/IconButton";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import FastForwardIcon from "@mui/icons-material/FastForward";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import RepeatIcon from "@mui/icons-material/Repeat";
import RepeatOneIcon from "@mui/icons-material/RepeatOne";
import Backdrop from "@mui/material/Backdrop";
import { Link } from "@mui/material";

export default function MiniPlayer() {
  const context = useContext(PlayerContext);
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    if (
      !location.pathname.startsWith("/app/watch/") &&
      context.playing.value &&
      context.settings.value.allowMiniPlayer
    ) {
      context.miniPlayer.set(true);
    } else if (location.pathname.startsWith("/app/watch/")) {
      context.miniPlayer.set(false);
    } else if (context.playing.value) {
      context.playing.set(false);
    }
  }, [location]);
  if (!context.miniPlayer.value) return <div></div>;
  const isOpenAndAllowed = isOpen && context.miniPlayerVisible.value;
  return (
    <>
      <Backdrop
        sx={{ zIndex: (theme) => theme.zIndex.drawer }}
        open={isOpenAndAllowed}
        onClick={() => {
          setOpen(false);
        }}
      />
      <Box
        sx={(theme) => ({
          position: "fixed",
          bottom: context.miniPlayerVisible.value ? 0 : "-100px",
          right: 0,
          maxWidth: "400px",
          width: "100%",
          maxHeight: isOpenAndAllowed ? "400px" : "64px",
          transition:
            "max-height 250ms ease-out, background 125ms, bottom 250ms",
          height: "100%",
          background: isOpenAndAllowed
            ? theme.palette.background.default
            : theme.palette.background.paper,
          padding: theme.spacing(1, 1, 0, 1),
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(1),
          zIndex: theme.zIndex.drawer + 1,
        })}
      >
        <Box sx={{ display: "flex" }}>
          <Button onClick={() => setOpen(!isOpen)} fullWidth>
            MiniPlayer
          </Button>
          <Button
            onClick={() => {
              if (!context.playerData.value) return;
              context.navigate(context.playerData.value);
            }}
            sx={{ width: "140px" }}
            endIcon={<OndemandVideoIcon />}
          >
            Resume
          </Button>
        </Box>

        <Box>
          <ProgressBar
            current={context.currentPosition.value}
            bufferAudio={context.audioBuffer.value}
            bufferVideo={null}
            max={context.maxDuration.value}
            onStartDragging={() => {}}
            onEndDragging={(newCurrent) => {
              if (isOpenAndAllowed) context.syncAll(newCurrent, true); // true due to buggy behavior
            }}
          />
        </Box>
        <Box
          sx={(theme) => ({
            width: "100%",
            display: "flex",
            flexDirection: "row",
            gap: theme.spacing(1),
          })}
        >
          {context.playlistContent.value.length > 1 ? (
            <IconButton
              onClick={() => {
                var currentID = 0;
                for (let i = 0; i < context.playlistContent.value.length; i++) {
                  const video = context.playlistContent.value[i];
                  if (
                    context.playerData.value?.files.audio === video.files.audio
                  ) {
                    currentID = i;
                  }
                }
                const previous =
                  currentID === 0
                    ? context.playlistContent.value.length - 1
                    : currentID - 1;
                const videoData = context.playlistContent.value[previous];
                context.playerData.set(videoData);

                context.touchHistory(videoData);
              }}
            >
              <FastRewindIcon />
            </IconButton>
          ) : (
            <></>
          )}
          <IconButton
            onClick={() => {
              context.playing.set(!context.playing.value);
            }}
          >
            {context.playing.value ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>

          {context.playlistContent.value.length > 1 ? (
            <IconButton
              onClick={() => {
                var currentID = 0;
                for (let i = 0; i < context.playlistContent.value.length; i++) {
                  const video = context.playlistContent.value[i];
                  if (
                    context.playerData.value?.files.audio === video.files.audio
                  ) {
                    currentID = i;
                  }
                }
                const next =
                  currentID === context.playlistContent.value.length - 1
                    ? 0
                    : currentID + 1;
                const videoData = context.playlistContent.value[next];
                context.playerData.set(videoData);
                if (context.playerData.value !== videoData)
                  context.maxDuration.set(DEFAULT_MAX_DURATION);
                context.touchHistory(videoData);
              }}
            >
              <FastForwardIcon />
            </IconButton>
          ) : (
            <></>
          )}
          <div style={{ flex: 1 }} />
          <IconButton
            onClick={() => {
              context.muted.set(!context.muted.value);
            }}
          >
            {context.muted.value ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
          <IconButton
            onClick={() => {
              context.singleLoop.set(!context.singleLoop.value);
            }}
          >
            {context.singleLoop.value ? <RepeatOneIcon /> : <RepeatIcon />}
          </IconButton>
        </Box>
        {context.playerData.value ? (
          <Link
            sx={{
              overflow: "hidden",
              minHeight: "20px",
            }}
            // href={context.playerData.value, playlistMeta}
          >
            <Typography>Resume: {context.playerData.value.title}</Typography>
          </Link>
        ) : (
          <></>
        )}
      </Box>
    </>
  );
}
