import {
	createExecutionContext,
	env,
	SELF,
	waitOnExecutionContext,
} from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Kota Pixel worker", () => {
	it("serves health JSON", async () => {
		const request = new IncomingRequest("http://example.com/health");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const body = await response.json<{ ok: boolean; endpoint: string }>();
		expect(body.ok).toBe(true);
		expect(body.endpoint).toContain("/v1/city/");
	});

	it("rejects invalid usernames with fallback svg", async () => {
		const response = await SELF.fetch("https://example.com/v1/city/bad_user!!.svg");
		expect(response.status).toBe(400);
		expect(response.headers.get("content-type")).toContain("image/svg+xml");
		const text = await response.text();
		expect(text).toContain("<svg");
	});

	it("rejects out-of-range limit", async () => {
		const response = await SELF.fetch(
			"https://example.com/v1/city/octocat.svg?limit=99",
		);
		expect(response.status).toBe(400);
	});
});
