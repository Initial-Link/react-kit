import { useContext } from "react";

import { PlayerContext } from "./PlayerContext";

export const usePlayer = () => useContext(PlayerContext);
