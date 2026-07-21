import { App, requestUrl, stringifyYaml } from 'obsidian';
import { Entity, Model, defaultModel } from '@opensanctions/followthemoney';
import { searchMockData } from './openalephMock';

const SCHEMA_TYPE_SET = new Set(Object.keys(defaultModel.schemata));

export function isSchemaType(value: string): boolean {
	return SCHEMA_TYPE_SET.has(value);
}

// TODO: Use OpenAleph API Spec + openapi-typescript instead?
// seems this could also build us a client:
// https://openapi-ts.dev/openapi-fetch/
export interface SearchResult {
	status: string;
	results: Entity[];
	total: number;
	next: URL;
}

export interface FederatedSearchResults {
	resultsForInstance: { [id: string]: SearchResult };
	total: number;
}

export interface Paginated<T> {
	next(): Promise<Paginated<T>>;
}

export interface OpenAlephPluginSettings {
	importFolder: string;
	instances: OpenAlephInstanceSettings[];
}

export interface OpenAlephInstanceSettings {
	id: string;
	name: string;
	instanceUrl: string;
	apiKeyName: string;
	enabled: boolean;
	connectionValid: boolean;
}

export interface OpenAlephClient {
	// request(url: URL): Promise<any>;
	search(query: SearchEndpoint): Promise<FederatedSearchResults>;
	// instanceStatus(): Promise<string>;
	settingsById: { [id: string]: OpenAlephInstanceSettings };
}

type Method = 'GET' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface Endpoint {
	// The HTTP method to use for the endpoint.
	method(): Method;

	// The path to the endpoint.
	endpoint(): string;

	/// Query parameters for the endpoint.
	parameters(): URLSearchParams;

	/// The body for the endpoint.
	///
	/// Returns the `Content-Encoding` header for the data as well as the data itself.
	body(): object;
}

export class SearchEndpoint implements Endpoint {
	query: string;
	schemaFilter: string[];

	constructor(query: string) {
		this.query = query;
		this.schemaFilter = [];
	}

	filter(schema: string) {
		if (!isSchemaType(schema)) {
			throw Error(`Not a valid schema type: ${schema}`);
		}
		this.schemaFilter.push(schema);
	}

	method(): Method {
		return 'GET';
	}
	endpoint(): string {
		return 'entities';
	}

	/// Query parameters for the endpoint.
	parameters(): URLSearchParams {
		let params = new URLSearchParams();
		params.append('q', this.query);
		this.schemaFilter.forEach((schema) =>
			params.append('filter:schema', schema),
		);
		return params;
	}

	body(): object {
		return {};
	}
}

// export class PaginatedSearchResult implements Paginated<SearchResult> {
// 	client: OpenAlephClient;
// 	result: SearchResult;
//
// 	constructor(client: OpenAlephClient, result: SearchResult) {
// 		this.client = client;
// 		this.result = result;
// 	}
//
// 	async next(): Promise<PaginatedSearchResult> {
// 		return new PaginatedSearchResult(
// 			this.client,
// 			(await this.client.request(this.result.next)) as SearchResult,
// 		);
// 	}
// }

class HttpClient implements OpenAlephClient {
	REST_API = '/api/2/';
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
		let headers: Record<string, string> = {
			'User-Agent': 'alephclient',
		};
		const apiKey = this.app.secretStorage.getSecret(settings.apiKeyName);
		if (apiKey !== null) {
			headers['Authorization'] = apiKey;
		}
		const request = {
			url: url.toString(),
			headers,
		};
		return (await requestUrl(request)).json;
	}

	urlForEndpoint(endpoint: Endpoint, instanceId: string): URL {
		const settings = this.settingsById[instanceId];
		if (settings === undefined) {
			throw new Error(`Instance settings not found for ${instanceId}`);
		}
		let url = new URL(
			`${this.REST_API}/${endpoint.endpoint()}`,
			settings.instanceUrl,
		);
		// Append all Endpoint query params
		endpoint.parameters().forEach((v, k) => url.searchParams.append(k, v));
		return url;
	}

	async instanceSearch(
		endpoint: SearchEndpoint,
		instanceId: string,
	): Promise<SearchResult> {
		// TODO: actually verify this somehow? The idea of using
		// openapi-ts above would help, but maybe we don't need
		// this level of verification for the prototype.
		return (await this.request(
			this.urlForEndpoint(endpoint, instanceId),
			instanceId,
		)) as SearchResult;
	}

	async search(endpoint: SearchEndpoint): Promise<FederatedSearchResults> {
		let total = 0;
		let resultsForInstance: { [id: string]: SearchResult } = {};

		for (let [instanceId, settings] of Object.entries(this.settingsById)) {
			if (settings.enabled) {
				const results = await this.instanceSearch(endpoint, instanceId);
				total += results.total;
				resultsForInstance[instanceId] = results;
			}
		}
		return {
			total,
			resultsForInstance,
		};
	}

	// metadataUrl(instanceId): URL {
	// 	return new URL(
	// 		`${this.REST_API}/${this.METADATA_ENDPOINT}`,
	// 		this.instanceUrl,
	// 	);
	// }
	//
	// async instanceStatus(): Promise<string> {
	// 	const headers = { 'User-Agent': 'alephclient' };
	// 	let request = {
	// 		url: this.metadataUrl().toString(),
	// 		headers,
	// 	};
	// 	return requestUrl(request)
	// 		.then((response) =>
	// 			response.status === 200 ? 'available' : 'bad status',
	// 		)
	// 		.catch((err) => {
	// 			console.error(err);
	// 			return 'connection failed';
	// 		});
	// }
}

class FakeClient implements OpenAlephClient {
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

	async instanceSearch(): Promise<SearchResult> {
		return (await searchMockData()) as SearchResult;
	}

	async search(_query: SearchEndpoint): Promise<FederatedSearchResults> {
		let total = 0;
		let resultsForInstance: { [id: string]: SearchResult } = {};

		for (let [instanceId, settings] of Object.entries(this.settingsById)) {
			if (settings.enabled) {
				const results = await this.instanceSearch();
				total += results.total;
				resultsForInstance[instanceId] = results;
			}
		}
		return {
			total,
			resultsForInstance,
		};
	}
}

// Note export
export async function writeNote(
	entity: Entity,
	ftmdFolder: string,
	instanceFolder: string,
	plugin,
) {
	// TODO: entity.dataset isn't part of Entity, if I get it right, because Entity is a StatementEntity,
	// whereas the search results from OpenAleph are of type ValueEntity.
	//
	// How to deal with this inconsistency on the typing side?
	const dataset = entity.dataset ?? 'unknown';
	const path = `${ftmdFolder}/${instanceFolder}/${dataset}`;
	plugin.app.vault.createFolder(path).catch((err) => {
		console.log('[debug] Folder already existed. All good.');
	});

	// Flattening the parts of entity that are interesting to us.
	//
	// TODO: This code is super hacky and it shows that the FtM entity
	// hasn't been parsed correctly. Maybe we don't need to do that, but
	// I'll think about that some other time.
	let flatEntity = {
		schema: entity.schema,
		id: entity.id,
	};
	for (const [k, v] of Object.entries(entity.properties)) {
		if (v.length === 0) {
			flatEntity[k] = '';
		} else if (v.length === 1) {
			if (typeof v[0] === 'string') {
				flatEntity[k] = v[0];
			}
		} else {
			// TODO: make sure we only have string types in v
			flatEntity[k] = v;
		}
	}
	const fileContent = `---\n${stringifyYaml(flatEntity)}---\n`;

	// TODO: if id matches, force to overwrite it, for now? => so we need to read it first!
	const targetFile = await plugin.app.vault
		.create(`${path}/${entity.caption}.md`, fileContent)
		.catch((_err) =>
			console.log('[debug] File already exists. Doing nothing for now.'),
		);
	const activeLeaf = plugin.app.workspace.getLeaf(false);
	if (!activeLeaf) {
		console.warn('MDB | no active leaf, not opening newly created note');
	}
	await activeLeaf.openFile(targetFile, {
		state: { mode: 'source' },
	});
}

// Configures whether we want a fake static result for development or the real thing
// Defaults to false in development unless you set FAKE_API=false in the environment.
//
// Provided by esbuild.config.mjs
declare const USE_FAKE_API: boolean;

export interface OpenAlephConstructor {
	new (settings: OpenAlephPluginSettings, app: App): OpenAlephClient;
}

export default function openAlephClientFactory(): OpenAlephConstructor {
	if (USE_FAKE_API) {
		console.info('using FAKE API');
	}
	return USE_FAKE_API ? FakeClient : HttpClient;
}
