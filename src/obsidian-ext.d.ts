export {};

declare module "obsidian" {
	interface WorkspaceLeaf {
		updateHeader(): void;
	}
}