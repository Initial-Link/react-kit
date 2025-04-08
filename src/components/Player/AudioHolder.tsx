import { useContext } from "react";

import { PlayerContext } from "./PlayerContext";

export default function AudioHolder() {
  const context = useContext(PlayerContext);
  return (
    <div style={{ display: "none" }}>
      {context.playerData.value ? (
        <audio
          // eslint-disable-next-line
          ref={context.refAudio as any}
          src={
            context.audioControlled
              ? context.sourceOverride.value
                ? context.sourceOverride.value
                : context.playerData.value.files.audio
                  ? context.playerData.value.files.audio
                  : undefined
              : undefined
          }
          muted={
            context.muted.value
              ? true
              : context.audioOnly.value
                ? false
                : context.playerData.value.files.audio === null
                  ? context.miniPlayer.value
                    ? false
                    : true
                  : false
          }
          onEnded={context.audioControlled ? context.actionOnEnded : undefined}
          onLoadStart={
            context.audioControlled ? context.actionOnLoadStart : undefined
          }
          onDurationChange={
            context.audioControlled ? context.actionOnDurationChange : undefined
          }
          onTimeUpdate={
            context.audioControlled
              ? (e) => context.actionOnTimeUpdate(e, "audio")
              : undefined
          }
          onError={context.audioControlled ? context.actionOnError : undefined}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
