import {CoMoBot} from "./libs/CoMoBot";
import {CoMoBotConfig} from "./libs/types";

const config: CoMoBotConfig = require("../config.json")

export const comobot = new CoMoBot(config);

(async (): Promise<void> => {
    await comobot.start();
})();

comobot.on("error", (err) => {
    console.log(err);
});

process.on('unhandledRejection', (error: Error, promise) => {
    console.error(`Unhandled promise rejection: Promise ${promise}`);
    console.dir(error.stack);
});
