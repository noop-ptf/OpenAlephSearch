import { StrictMode } from 'react';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { SearchSidebar } from './views/SearchSidebar';
import OpenAlephPlugin from './main';

export const VIEW_TYPE_OPENALEPH_SEARCH = 'openaleph-search-view';

export class OpenAlephSearchView extends ItemView {
	private plugin: OpenAlephPlugin;
	private root: Root | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: OpenAlephPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_OPENALEPH_SEARCH;
	}

	getDisplayText(): string {
		// eslint-disable-next-line obsidianmd/ui/sentence-case -- This is in proper sentence case.
		return 'Federated OpenAleph search';
	}

	getIcon(): string {
		return 'binoculars';
	}

	async onOpen(): Promise<void> {
		const container = this.contentEl;
		this.root = createRoot(container);
		this.root.render(
			<StrictMode>
				<SearchSidebar
					pluginSettings={this.plugin.settings}
					app={this.app}
					plugin={this.plugin}
				/>
			</StrictMode>,
		);
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
	}
}
