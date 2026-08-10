import { App } from 'obsidian';
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
import {
	moriartyPageOne,
	moriartyPageTwo,
	searchMockData,
} from '../openalephMock';

export class FakeClient implements OpenAlephClient {
	app: App;
	settingsById: { [id: string]: OpenAlephInstanceSettings };

	// TODO: find a way without repeating this code?
	constructor(settings: OpenAlephPluginSettings, app: App) {
		this.app = app;
		this.settingsById = {};
		for (const instance of settings.instances) {
			this.settingsById[instance.id] = instance;
		}
	}

	async instanceSearch(instanceId: string): Promise<SearchResult> {
		if (instanceId.startsWith('f1cd')) {
			return (await moriartyPageOne()) as SearchResult;
		}
		return (await searchMockData()) as SearchResult;
	}

	async search(_query: SearchEndpoint): Promise<FederatedSearchResults> {
		let total = 0;
		const resultsForInstance: { [id: string]: InstanceResults } = {};

		for (const [instanceId, settings] of Object.entries(this.settingsById)) {
			if (settings.enabled) {
				const results = await this.instanceSearch(instanceId);
				total += results.total;
				resultsForInstance[instanceId] = {
					name: settings.name,
					results: groupEntitiesByDataset(results.results, instanceId),
					next: results.next,
				};
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
		const nextPage = (await moriartyPageTwo()) as SearchResult;
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
