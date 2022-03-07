import {DMChannel, Message, PartialMessage, PartialUser, User} from "discord.js";

export class ReportTicket {
    public user?: User;
    public message?: Message;
    public id?: number;
    public case?: "report" | "emergency";
    public userDMChannel?: DMChannel;
    public userDescription: string = "Empty";
    public reportedUser?: User;
    public messageContent?: string = "";
    private readonly _isByReaction: boolean = false;

    constructor(isByReaction: boolean = false) {
        this._isByReaction = isByReaction;
    }

    public async createTicket(
        reporterUser: User | PartialUser,
        reportedMessage?: Message | PartialMessage
    ): Promise<ReportTicket> {
        this.id = this.getNewID();

        if (reporterUser.partial) reporterUser = await reporterUser.fetch();
        this.user = reporterUser;
        this.userDMChannel = await this.user.createDM();

        if (reportedMessage) {
            if (reportedMessage.partial) reportedMessage = await reportedMessage.fetch();
            this.message = reportedMessage;
            this.reportedUser = this.message.author;
            this.messageContent = this.message.content;
        }
        return this;
    }

    public async setMessage(reportedMessage: Message | PartialMessage): Promise<void> {
        if (reportedMessage.partial) reportedMessage = await reportedMessage.fetch();
        this.message = reportedMessage;
        this.reportedUser = this.message.author;
        this.messageContent = this.message.content;
    }

    public isEmergency(): boolean {
        if (!this.case) return false;
        return this.case === "emergency";
    }

    public isByReaction(): boolean {
        return this._isByReaction;
    }

    private getNewID(): number {
        return 42;
    }
}