import { handleRequest, type WorkerEnv } from "./api/router";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			return await handleRequest(request, env as WorkerEnv, ctx);
		} catch (err) {
			console.error(
				JSON.stringify({
					event: "unhandled_error",
					message: err instanceof Error ? err.message : "unknown",
				}),
			);
			return new Response("Internal Server Error", { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
