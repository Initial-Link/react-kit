import { useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { Box, Button } from "@mui/material";

import { PlayerContextProvider } from "./PlayerContextProvider";
import { usePlayer } from "./usePlayer";
import { videoData } from "./globals";
import AudioHolder from "./AudioHolder";
import VideoPlayer from "./VideoPlayer";

const meta: Meta<typeof VideoPlayer> = {
  component: VideoPlayer,
  parameters: {
    docs: {
      description: {
        component: "Universal Video and Audio Player",
      },
    },
  },
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
    meta: {},
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
    meta: {},
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
          VideoPlayer Unload
        </Button>
        <Button variant="contained" onClick={() => setPage(1)}>
          VideoPlayer Load
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
export const AutoLoad: Story = {
  parameters: {
    docs: {
      description: {
        story: `By passing \`videoData\` parameter you can instantly load the entry on component mount.`,
      },
    },
  },
  render: () => (
    <PlayerContextProvider>
      <VideoPlayer
        videoData={{
          files: {
            video: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4`,
            // Audio should point to complementary audio file like mp3 or m4a instead
            audio: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4`,
            subtitles: null,
            thumbnail: `https://picsum.photos/id/62/1280/720`,
          },
          id: "fd30eac4-3417-4425-a507-edefde365406",
          title: "Big Buck Bunny",
          meta: {},
        }}
        isPlaylist={false}
        subtitles={[]}
        chapters={[]}
        heatmap={[]}
        showInlineTitle
      />
      <AudioHolder />
    </PlayerContextProvider>
  ),
};
export const UnRenderPlay: Story = {
  parameters: {
    docs: {
      description: {
        story: `As long as \`<AudioHolder />\` stays loaded, the audio will keep on playing and when player is loaded back, it will attempt to sync back`,
      },
    },
  },
  render: () => (
    <PlayerContextProvider>
      <App />
      <AudioHolder />
    </PlayerContextProvider>
  ),
};
export const StickyMobilePlayer: Story = {
  parameters: {
    docs: {
      description: {
        story: `As long as \`<AudioHolder />\` stays loaded, the audio will keep on playing and when player is loaded back, it will attempt to sync back`,
      },
    },
  },
  render: () => (
    <PlayerContextProvider
      settings={{
        autoAudioOnly: false,
        autoPlay: false,
        videoBackgroundBloom: true,
        allowMiniPlayer: true,
        sticky: true, // changed
        stickySpacing: 0,
        stickyTriggerDistance: 0,
      }}
    >
      <Box sx={{ height: "200vh" }}>
        <VideoPlayer
          videoData={{
            files: {
              video: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4`,
              // Audio should point to complementary audio file like mp3 or m4a instead
              audio: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4`,
              subtitles: null,
              thumbnail: `https://picsum.photos/id/62/1280/720`,
            },
            id: "fd30eac4-3417-4425-a507-edefde365406",
            title: "Big Buck Bunny",
            meta: {},
          }}
          isPlaylist={false}
          subtitles={[]}
          chapters={[]}
          heatmap={[]}
          showInlineTitle
        />
      </Box>
      <AudioHolder />
    </PlayerContextProvider>
  ),
};
