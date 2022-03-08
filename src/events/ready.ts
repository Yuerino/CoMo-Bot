import {Event} from "../libs/Event";

export default new Event({
    event: "ready",
    run: () => {
        console.log("Bot is ready!");
    }
});