import { IUserInboundStat } from './interfaces';

export class GetUsersInboundsStatsResponseModel {
    public usersInbounds: IUserInboundStat[];

    constructor(usersInbounds: IUserInboundStat[]) {
        this.usersInbounds = usersInbounds;
    }
}
