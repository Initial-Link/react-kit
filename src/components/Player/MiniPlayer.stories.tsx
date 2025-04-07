import { useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { Button } from "@mui/material";

import { PlayerContextProvider } from "./PlayerContextProvider";
import AudioHolder from "./AudioHolder";
import VideoPlayer from "./VideoPlayer";
import MiniPlayer from "./MiniPlayer";

const meta: Meta<typeof MiniPlayer> = {
  component: MiniPlayer,
  parameters: {
    docs: {
      description: {
        component: "Mini controller for Player Context",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MiniPlayer>;

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
        )}
      </div>
    </>
  );
}
export const ConstantMiniPlayer: Story = {
  parameters: {
    docs: {
      description: {
        story: `App wide \`<MiniPlayer />\` can be created by inserting it at the root of your application.`,
      },
    },
  },
  render: () => (
    <PlayerContextProvider
      touchHistory={(video) => console.info(`touchHistory`, video)}
      navigate={(video) => console.info(`navigate`, video)}
    >
      <App />
      <AudioHolder />
      <MiniPlayer />
    </PlayerContextProvider>
  ),
};
