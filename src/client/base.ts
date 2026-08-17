import { App, Notice } from 'obsidian';
import { type Dispatch, type SetStateAction } from 'react';
import { SearchEndpoint, type OpenAlephClient } from './endpoint';
import {
	type OpenAlephInstanceSettings,
	type OpenAlephPluginSettings,
	type SearchResult,
	type FederatedSearchResults,
	type InstanceResults,
	groupEntitiesByDataset,
} from '../types';

export abstract class BaseClient implements OpenAlephClient {
	private settings: OpenAlephPluginSettings;
	app: App;

	constructor(settings: OpenAlephPluginSettings, app: App) {
		this.app = app;
		this.settings = settings;
	}

	get settingsById(): { [id: string]: OpenAlephInstanceSettings } {
		const map: { [id: string]: OpenAlephInstanceSettings } = {};
		for (const instance of this.settings.instances) {
			map[instance.id] = instance;
		}
		return map;
	}

	protected abstract instanceSearch(
		endpoint: SearchEndpoint,
		instanceId: string,
	): Promise<SearchResult>;

	protected abstract fetchNextPage(
		nextUrl: string,
		instanceId: string,
	): Promise<SearchResult>;

	async search(endpoint: SearchEndpoint): Promise<FederatedSearchResults> {
		let total = 0;
		const resultsForInstance: { [id: string]: InstanceResults } = {};

		for (const [instanceId, settings] of Object.entries(
			this.settingsById,
		)) {
			if (settings.enabled) {
				try {
					const results = await this.instanceSearch(
						endpoint,
						instanceId,
					);
					total += results.total;
					resultsForInstance[instanceId] = {
						name: settings.name,
						results: groupEntitiesByDataset(
							results.results,
							instanceId,
						),
						next: results.next,
					};
				} catch {
					new Notice(
						`Search failed for "${settings.name}". Skipping this instance.`,
					);
				}
			}
		}
		return { total, resultsForInstance };
	}

	async loadMoreForInstance(
		setter: Dispatch<SetStateAction<FederatedSearchResults | undefined>>,
		previousResults: FederatedSearchResults,
		instanceId: string,
	): Promise<void> {
		const nextUrl = previousResults?.resultsForInstance[instanceId]?.next;
		if (nextUrl === null || nextUrl === undefined) {
			return;
		}
		const nextPage = await this.fetchNextPage(nextUrl, instanceId);
		setter((prev) => {
			if (prev === undefined) return prev;
			const prevInstanceResult = prev.resultsForInstance[instanceId];
			if (prevInstanceResult === undefined) return prev;
			return {
				...prev,
				resultsForInstance: {
					...prev.resultsForInstance,
					[instanceId]: {
						...prevInstanceResult,
						results: groupEntitiesByDataset(
							nextPage.results,
							instanceId,
							prevInstanceResult.results,
						),
						next: nextPage.next,
					},
				},
			};
		});
	}
}
