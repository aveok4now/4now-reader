import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { copyFile, mkdir } from "node:fs/promises";
import { watch as fsWatch } from "node:fs";
import { join } from "node:path";

const prod = process.argv[2] === "production";

async function deploy(files) {
	const dir = process.env.OBSIDIAN_PLUGIN_DIR;
	if (!dir) return;
	try {
		await mkdir(dir, { recursive: true });
		for (const f of files) {
			await copyFile(f, join(dir, f)).catch(() => {});
		}
		console.log(`[deploy] ${files.join(", ")} → ${dir}`);
	} catch (err) {
		console.error("[deploy] failed:", err);
	}
}

const deployPlugin = {
	name: "deploy-to-vault",
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0) return;
			await deploy(["main.js", "manifest.json", "styles.css"]);
		});
	},
};

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	jsx: "automatic",
	jsxImportSource: "react",
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	plugins: [deployPlugin],
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	// Non-bundled assets aren't in esbuild's watch graph — watch them ourselves
	// so dev edits to styles.css and manifest.json propagate to the vault too.
	for (const asset of ["styles.css", "manifest.json"]) {
		let debounce = null;
		fsWatch(asset, (eventType) => {
			if (eventType !== "change") return;
			if (debounce) clearTimeout(debounce);
			debounce = setTimeout(() => deploy([asset]), 100);
		});
	}
	await context.watch();
}
