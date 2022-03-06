import {Event} from "../libs/Event";
import {wobbot} from "../wobbot";

export default new Event(wobbot, "ready", (): void => {
    console.log("Bot is ready!");
});