import { z } from 'zod';

import { REST_API } from '../../api';
export namespace GetUsersInboundsStatsCommand {
    export const url = REST_API.STATS.GET_USERS_INBOUNDS_STATS;

    export const RequestSchema = z.object({
        reset: z.boolean(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            usersInbounds: z.array(
                z.object({
                    username: z.string(),
                    inboundTag: z.string(),
                    downlink: z.number(),
                    uplink: z.number(),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
