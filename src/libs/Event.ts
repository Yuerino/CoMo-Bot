import {ClientEvents} from "discord.js";
import {EventOptions} from "./types";

export class Event<Key extends keyof ClientEvents> {
    constructor(eventOptions: EventOptions<Key>) {
        Object.assign(this, eventOptions);
    }
}