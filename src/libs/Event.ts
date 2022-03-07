import {ClientEvents} from "discord.js";
import {CoMoBot} from "./CoMoBot";

export class Event<Key extends keyof ClientEvents> {
    constructor(
        public readonly client: CoMoBot,
        public readonly event: Key,
        public readonly run: (...args: ClientEvents[Key]) => void
    ) {
    }
}