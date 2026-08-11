import { requestUrl } from 'obsidian';
import { SearchEndpoint } from './endpoint';
import { type SearchResult } from '../types';
import { BaseClient } from './base';

export class HttpClient extends BaseClient {
	REST_API = '/api/2';

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

	protected async instanceSearch(
		endpoint: SearchEndpoint,
		instanceId: string,
	): Promise<SearchResult> {
		// TODO: actually verify this somehow? openapi-ts would help here.
		return (await this.request(
			this.urlForEndpoint(endpoint, instanceId),
			instanceId,
		)) as SearchResult;
	}

	protected async fetchNextPage(
		nextUrl: string,
		instanceId: string,
	): Promise<SearchResult> {
		return (await this.request(
			new URL(nextUrl),
			instanceId,
		)) as SearchResult;
	}
}
