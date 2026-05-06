import * as hono_hono_base from 'hono/hono-base';
import * as hono_utils_http_status from 'hono/utils/http-status';
import * as hono_types from 'hono/types';
import { Hono } from 'hono';

declare const app: Hono<hono_types.BlankEnv, hono_types.BlankSchema, "/">;
declare const routes: hono_hono_base.HonoBase<hono_types.BlankEnv, hono_types.BlankSchema | hono_types.MergeSchemaPath<{
    "/": {
        $get: {
            input: {};
            output: {
                id: string;
                userId: string;
                label: string | null;
                cardNumber: string;
                brandId: string | null;
                createdAt: string;
            }[];
            outputFormat: "json";
            status: hono_utils_http_status.ContentfulStatusCode;
        };
    };
} & {
    "/": {
        $post: {
            input: {
                json: {
                    userId: string;
                    cardNumber: string;
                    label?: string | null | undefined;
                    brandId?: string | null | undefined;
                };
            };
            output: {
                id: string;
                createdAt: string;
                userId: string;
                label: string | null;
                cardNumber: string;
                brandId: string | null;
            };
            outputFormat: "json";
            status: 201;
        } | {
            input: {
                json: {
                    userId: string;
                    cardNumber: string;
                    label?: string | null | undefined;
                    brandId?: string | null | undefined;
                };
            };
            output: {
                error: string;
            };
            outputFormat: "json";
            status: 409;
        } | {
            input: {
                json: {
                    userId: string;
                    cardNumber: string;
                    label?: string | null | undefined;
                    brandId?: string | null | undefined;
                };
            };
            output: {
                error: string;
            };
            outputFormat: "json";
            status: 400;
        };
    };
} & {
    "/:id": {
        $get: {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                error: string;
            };
            outputFormat: "json";
            status: 404;
        } | {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                id: string;
                userId: string;
                label: string | null;
                cardNumber: string;
                brandId: string | null;
                createdAt: string;
            };
            outputFormat: "json";
            status: hono_utils_http_status.ContentfulStatusCode;
        };
    };
} & {
    "/:id": {
        $put: {
            input: {
                param: {
                    id: string;
                };
            } & {
                json: {
                    userId: string;
                    cardNumber: string;
                    label?: string | null | undefined;
                    brandId?: string | null | undefined;
                };
            };
            output: {
                error: string;
            };
            outputFormat: "json";
            status: 404;
        } | {
            input: {
                param: {
                    id: string;
                };
            } & {
                json: {
                    userId: string;
                    cardNumber: string;
                    label?: string | null | undefined;
                    brandId?: string | null | undefined;
                };
            };
            output: {
                id: string;
                userId: string;
                label: string | null;
                cardNumber: string;
                brandId: string | null;
                createdAt: string;
            };
            outputFormat: "json";
            status: hono_utils_http_status.ContentfulStatusCode;
        } | {
            input: {
                param: {
                    id: string;
                };
            } & {
                json: {
                    userId: string;
                    cardNumber: string;
                    label?: string | null | undefined;
                    brandId?: string | null | undefined;
                };
            };
            output: {
                error: string;
            };
            outputFormat: "json";
            status: 409;
        } | {
            input: {
                param: {
                    id: string;
                };
            } & {
                json: {
                    userId: string;
                    cardNumber: string;
                    label?: string | null | undefined;
                    brandId?: string | null | undefined;
                };
            };
            output: {
                error: string;
            };
            outputFormat: "json";
            status: 400;
        };
    };
} & {
    "/:id": {
        $delete: {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                error: string;
            };
            outputFormat: "json";
            status: 404;
        } | {
            input: {
                param: {
                    id: string;
                };
            };
            output: null;
            outputFormat: "body";
            status: 204;
        };
    };
}, "/v1/cards">, "/", "/">;

type AppType = typeof routes;

export { app as default };
export type { AppType };
