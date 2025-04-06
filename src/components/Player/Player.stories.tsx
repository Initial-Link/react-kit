import React, { useState } from "react";

import { Meta, StoryObj } from "@storybook/react";
import AudioHolder from "./AudioHolder";
import { PlayerContextProvider, usePlayer } from "./PlayerContext";
import VideoPlayer from "./VideoPlayer";
import { Button } from "@mui/material";
import { videoData } from "./globals";

const meta: Meta<typeof VideoPlayer> = {
  component: VideoPlayer,
};

export default meta;
type Story = StoryObj<typeof VideoPlayer>;

const exampleVideos: videoData[] = [
  {
    files: {
      video: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_10mb.mp4`,
      audio: `https://sample-videos.com/audio/mp3/wave.mp3`,
      subtitles: null,
      thumbnail: `https://picsum.photos/id/704/1280/720`,
    },
    id: "95da84f7-7fe8-4f0f-a6aa-8b1c97e3fe5f",
    title: "Rain Sounds",
    uploader: "User",
  },
  {
    files: {
      video: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4`,
      // Audio should point to complementary audio file like mp3 or m4a instead
      audio: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4`,
      subtitles: null,
      thumbnail: `https://picsum.photos/id/62/1280/720`,
    },
    id: "fd30eac4-3417-4425-a507-edefde365406",
    title: "Big Buck Bunny",
    uploader: "User",
  },
];
function PageWithPlayer() {
  const player = usePlayer();
  return (
    <div>
      <div
        style={{
          width: "80%",
          maxWidth: "1280px",
        }}
      >
        {exampleVideos.map((entry) => (
          <Button
            onClick={() => {
              player.playerData.set(entry);
            }}
            key={entry.id}
          >
            {entry.title}
          </Button>
        ))}
        {player.playerData.value !== null && (
          <Button
            onClick={() => {
              player.playlistContent.set(exampleVideos);
            }}
          >
            Load All (playlist)
          </Button>
        )}
        <VideoPlayer
          isPlaylist={false}
          subtitles={[]}
          chapters={[]}
          heatmap={[]}
          showInlineTitle
        />
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState(0);

  return (
    <>
      <div>
        <Button variant="contained" onClick={() => setPage(0)}>
          View Page without VideoPlayer
        </Button>
        <Button variant="contained" onClick={() => setPage(1)}>
          View Video Player
        </Button>
      </div>
      <div
        style={{
          width: "100%",
        }}
      >
        {page === 0 ? (
          <p>VideoPlayer does not exist on the page</p>
        ) : (
          <PageWithPlayer />
        )}
      </div>
    </>
  );
}

export const ContextUsage: Story = {
  render: () => (
    <PlayerContextProvider
      touchHistory={(video) => {
        console.log(`touchHistory`, video);
      }}
      navigate={(video) => {
        console.log(`navigate`, video);
      }}
    >
      <App />
      <AudioHolder />
    </PlayerContextProvider>
  ),
};
