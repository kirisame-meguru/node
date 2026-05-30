import { createZodDto } from 'nestjs-zod';

import { GetUsersInboundsStatsCommand } from '@libs/contracts/commands';

export class GetUsersInboundsStatsRequestDto extends createZodDto(
    GetUsersInboundsStatsCommand.RequestSchema,
) {}
export class GetUsersInboundsStatsResponseDto extends createZodDto(
    GetUsersInboundsStatsCommand.ResponseSchema,
) {}
