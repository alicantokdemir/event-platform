"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTicketTypeSchema = exports.CreateTicketTypeSchema = exports.UpdateEventSchema = exports.CreateEventSchema = exports.TicketKindSchema = exports.SalesChannelSchema = void 0;
const zod_1 = require("zod");
exports.SalesChannelSchema = zod_1.z.enum(['online', 'box_office', 'partners']);
exports.TicketKindSchema = zod_1.z.enum(['FULL', 'HALF']);
exports.CreateEventSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    location: zod_1.z.string().min(1),
    total_capacity: zod_1.z.number().int().nonnegative(),
    sales_channels: zod_1.z.array(exports.SalesChannelSchema).min(1),
});
exports.UpdateEventSchema = exports.CreateEventSchema.partial();
exports.CreateTicketTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    kind: exports.TicketKindSchema,
    price_cents: zod_1.z.number().int().nonnegative(),
    capacity: zod_1.z.number().int().nonnegative(),
});
exports.UpdateTicketTypeSchema = exports.CreateTicketTypeSchema.partial();
//# sourceMappingURL=index.js.map