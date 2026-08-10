import { App, requestUrl } from 'obsidian';
import { type Dispatch, type SetStateAction } from 'react';
import {
	type OpenAlephClient,
	type OpenAlephInstanceSettings,
	type OpenAlephPluginSettings,
	type SearchResult,
	type FederatedSearchResults,
	type InstanceResults,
	SearchEndpoint,
	groupEntitiesByDataset,
} from '../types';

export class HttpClient implements OpenAlephClient {
	REST_API = '/api/2';
	METADATA_ENDPOINT = 'metadata';
	SEARCH_ENDPOINT = 'search';

	settingsById: { [id: string]: OpenAlephInstanceSettings };
	app: App;

	constructor(settings: OpenAlephPluginSettings, app: App) {
		this.app = app;
		this.settingsById = {};
		for (const instance of settings.instances) {
			this.settingsById[instance.id] = instance;
		}
	}

	async request(url: URL, instanceId: string): Promise<unknown> {
		const settings = this.settingsById[instanceId];
		if (settings === undefined) {
			return Promise.reject(
				Error(`Settings for ${instanceId} not properly configured`),
			);
		}
		const headers: Record<string, string> = { 'User-Agent': 'alephclient' };
		const apiKey = this.app.secretStorage.getSecret(settings.apiKeyName);
		if (apiKey !== null) {
			headers['Authorization'] = apiKey;
		}
		return (await requestUrl({ url: url.toString(), headers })).json;
	}

	urlForEndpoint(endpoint: SearchEndpoint, instanceId: string): URL {
		const settings = this.settingsById[instanceId];
		if (settings === undefined) {
			throw new Error(`Instance settings not found for ${instanceId}`);
		}
		const url = new URL(
			`${this.REST_API}/${endpoint.endpoint()}`,
			settings.instanceUrl,
		);
		endpoint.parameters().forEach((v, k) => url.searchParams.append(k, v));
		return url;
	}

	async instanceSearch(
		endpoint: SearchEndpoint,
		instanceId: string,
	): Promise<SearchResult> {
		// TODO: actually verify this somehow? openapi-ts would help here.
		return (await this.request(
			this.urlForEndpoint(endpoint, instanceId),
			instanceId,
		)) as SearchResult;
	}

	async search(endpoint: SearchEndpoint): Promise<FederatedSearchResults> {
		let total = 0;
		const resultsForInstance: { [id: string]: InstanceResults } = {};

		for (const [instanceId, settings] of Object.entries(this.settingsById)) {
			if (settings.enabled) {
				const results = await this.instanceSearch(endpoint, instanceId);
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
		const nextPage = (await this.request(
			new URL(nextUrl),
			instanceId,
		)) as SearchResult;
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
