import { batfellow, breakfast, duffo, pullAll, pvp } from "./common";
import { ascendedToday } from "../lib";
import { LoopQuest } from "../engine/engine";
import { chosenStrategy } from "../strategies/strategy";

export function aftercoreQuest(): LoopQuest {
  return {
    name: "Aftercore",
    completed: () => ascendedToday(),
    tasks: [
      pullAll(),
      ...breakfast(),
      ...duffo(),
      ...batfellow(),
      ...chosenStrategy.tasks(true),
      ...pvp(),
    ],
  };
}
