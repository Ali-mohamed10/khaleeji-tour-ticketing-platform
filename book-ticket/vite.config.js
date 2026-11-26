import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/**
 * Dev Plugin to handle local serverless endpoints in Vite dev mode
 * before they are deployed to Vercel production.
 */
function manualBookingDevPlugin() {
	return {
		name: "manual-booking-dev-plugin",
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const url = req.url ? req.url.split("?")[0] : "";
				if (url !== "/api/manual-booking") {
					return next();
				}

				if (req.method === "OPTIONS") {
					res.setHeader("Access-Control-Allow-Origin", "*");
					res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
					res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
					res.statusCode = 204;
					return res.end();
				}

				if (req.method !== "POST") {
					res.statusCode = 405;
					res.setHeader("Content-Type", "application/json");
					return res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
				}

				try {
					const chunks = [];
					for await (const chunk of req) {
						chunks.push(chunk);
					}
					const rawBody = Buffer.concat(chunks).toString("utf8");
					req.body = rawBody ? JSON.parse(rawBody) : {};

					// Mock Express res methods for serverless handler
					res.status = function (code) {
						this.statusCode = code;
						return this;
					};
					res.json = function (data) {
						this.setHeader("Content-Type", "application/json");
						this.end(JSON.stringify(data));
						return this;
					};

					const handleManualBooking = require("../api/manual-booking");
					await handleManualBooking(req, res);
				} catch (err) {
					console.error("[Dev /api/manual-booking error]:", err);
					res.statusCode = 500;
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: false, error: err.message || "Internal dev error" }));
				}
			});
		},
	};
}

// https://vite.dev/config/
export default defineConfig({
	base: "/",
	plugins: [manualBookingDevPlugin(), react(), tailwindcss()],
	server: {
		proxy: {
			"/api": {
				target: "https://book-ticket-sigma.vercel.app",
				changeOrigin: true,
				secure: true,
			},
		},
	},
});
