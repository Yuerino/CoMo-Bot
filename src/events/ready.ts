import {Event} from "../libs/Event";
import {comobot} from "../comobot";

export default new Event(comobot, "ready", (): void => {
    console.log("Bot is ready!");
});