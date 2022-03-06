import {ClientEvents} from "discord.js";
import {WobBot} from "./WobBot";

export class Event<Key extends keyof ClientEvents> {
    constructor(
        public readonly client: WobBot,
        public readonly event: Key,
        public readonly run: (...args: ClientEvents[Key]) => void
    ) {
    }
}