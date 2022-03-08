import {DMChannel, Message, ThreadChannel, User} from "discord.js";
import {TicketOptions} from "./types";

export class ReportTicket {
    public readonly id: number;
    public readonly user: User;
    public userDMChannel: DMChannel;
    public userDescription?: string;
    public case?: "report" | "emergency";
    private readonly createByReaction: boolean = false;
    public readonly createTime: Date = new Date();
    public ticketThread?: ThreadChannel;

    constructor(ticketOptions: TicketOptions) {
        this.id = this.createTime.getTime();
        this.user = ticketOptions.user;
        this.userDMChannel = ticketOptions.userDMChannel;
        if (ticketOptions.message) this.message = ticketOptions.message;
        if (ticketOptions.createByReaction) this.createByReaction = ticketOptions.createByReaction;
    }

    private _message!: Message;

    public get message() {
        return this._message;
    }

    public set message(m: Message) {
        this._message = m;
        this._reportedUser = m.author;
        this._messageContent = m.cleanContent;
    }

    private _messageContent: string = "";

    public get messageContent() {
        return this._messageContent;
    }

    private _reportedUser?: User;

    public get reportedUser() {
        return this._reportedUser;
    }

    public isEmergency() {
        if (!this.case) return false;
        return this.case === "emergency";
    }

    public isByReaction() {
        return this.createByReaction;
    }
}