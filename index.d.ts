declare global {
    namespace Express {
        interface Request {
            user?: Record<string, unknown>;
        }
    }
}
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=index.d.ts.map