// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import type { Plugin, ResolvedConfig } from "vite";

function mcpPluginWithWindowsRoot(): Plugin {
  const plugin = mcpPlugin();
  const configResolved = plugin.configResolved;

  if (typeof configResolved !== "function") {
    return plugin;
  }

  return {
    ...plugin,
    configResolved(config: ResolvedConfig) {
      // @lovable.dev/mcp-js 0.20.0 compares paths with the native Windows separator.
      const mcpConfig =
        process.platform === "win32"
          ? ({ ...config, root: config.root.replace(/\//g, "\\") } as ResolvedConfig)
          : config;

      return configResolved(mcpConfig);
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [mcpPluginWithWindowsRoot()],
  },
});

