import {WobBot} from "./libs/WobBot";
import {WobBotConfig} from "./libs/types";

const config: WobBotConfig = require("../config.json")

export const wobbot = new WobBot(config);

(async (): Promise<void> => {
    await wobbot.start();
})();
