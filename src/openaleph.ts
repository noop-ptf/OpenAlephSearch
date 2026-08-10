import { App, Notice, requestUrl, stringifyYaml } from 'obsidian';
import OpenAlephPlugin from './main';
import { defaultModel } from '@opensanctions/followthemoney';
import { type Dispatch, type SetStateAction } from 'react';
import {
	moriartyPageOne,
	moriartyPageTwo,
	searchMockData,
} from './openalephMock';

const SCHEMA_TYPE_SET = new Set(Object.keys(defaultModel.schemata));
export const SCHEMA_TYPES = Array.from(Object.keys(defaultModel.schemata));

export function isSchemaType(value: string): boolean {
	return SCHEMA_TYPE_SET.has(value);
}

interface Collection {
	id: string;
	name: string;
}

interface Links {
	self: string;
	expand: string;
	tags?: string;
	ui?: string;
}

export interface OpenAlephEntity {
	id: string;
	caption: string;
	schema: string;
	properties: Record<string, string[]>;
	collection: Collection;
	links: Links;
	dataset?: string;
	referents?: string[];
}

export type FacetState = Record<string, boolean>;

// TODO: Use OpenAleph API Spec + openapi-typescript instead?
// seems this could also build us a client:
// https://openapi-ts.dev/openapi-fetch/
export interface SearchResult {
	status: string;
	results: OpenAlephEntity[];
	total: number;
	next: URL;
}

export interface Dataset {
	id: string;
	name: string;
	instanceId: string;
}

export type EntityByDataset = Map<Dataset, OpenAlephEntity[]>;

export interface InstanceResults {
	name: string;
	results: EntityByDataset;
	next: URL;
}

export interface FederatedSearchResults {
	resultsForInstance: { [id: string]: InstanceResults };
	total: number;
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
	loadMoreForInstance(
		setter: Dispatch<SetStateAction<FederatedSearchResults | undefined>>,
		previousResults: FederatedSearchResults,
		instanceId: string,
	): Promise<void>;
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

function groupEntitiesByDataset(
	entities: OpenAlephEntity[],
	instanceId: string,
	existing?: EntityByDataset,
): EntityByDataset {
	const result: EntityByDataset = existing ?? new Map();
	const seenDatasets = new Map<string, Dataset>(
		[...(existing?.keys() ?? [])].map((d) => [d.id, d]),
	);
	for (const entity of entities) {
		const datasetId = entity.collection.id;
		let dataset = seenDatasets.get(datasetId);
		if (dataset === undefined) {
			dataset = { id: datasetId, name: entity.collection.name, instanceId };
			seenDatasets.set(datasetId, dataset);
			result.set(dataset, []);
		}
		result.get(dataset)?.push(entity);
	}
	return result;
}

class HttpClient implements OpenAlephClient {
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
		let resultsForInstance: { [id: string]: InstanceResults } = {};

		for (const [instanceId, settings] of Object.entries(
			this.settingsById,
		)) {
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
		setter((prev: FederatedSearchResults | undefined) => {
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

	async instanceSearch(instanceId: string): Promise<SearchResult> {
		if (instanceId.startsWith('f1cd')) {
			return (await moriartyPageOne()) as SearchResult;
		}
		return (await searchMockData()) as SearchResult;
	}

	async search(_query: SearchEndpoint): Promise<FederatedSearchResults> {
		let total = 0;
		let resultsForInstance: { [id: string]: InstanceResults } = {};

		for (const [instanceId, settings] of Object.entries(
			this.settingsById,
		)) {
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
		setter((prev: FederatedSearchResults | undefined) => {
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

export function yamlifyEntity(entity: OpenAlephEntity): string {
	const flatEntity: Record<string, string | string[]> = {
		schema: entity.schema,
		id: entity.id,
	};
	for (const [k, v] of Object.entries(entity.properties)) {
		if (v.length === 0) {
			flatEntity[k] = '';
		} else if (v.length === 1) {
			flatEntity[k] = v[0] ?? '';
		} else {
			flatEntity[k] = v;
		}
	}
	return `---\n${stringifyYaml(flatEntity)}---\n`;
}

export function entityImportPath(
	entity: OpenAlephEntity,
	ftmdFolder: string,
	instanceFolder: string,
): string {
	const dataset = entity.dataset ?? 'unknown';
	return `${ftmdFolder}/${instanceFolder}/${dataset}`;
}

// Note export
export async function writeNote(
	entity: OpenAlephEntity,
	ftmdFolder: string,
	instanceFolder: string,
	plugin: OpenAlephPlugin,
) {
	const path = entityImportPath(entity, ftmdFolder, instanceFolder);
	plugin.app.vault.createFolder(path).catch((err) => {
		console.log('[debug] Folder already existed. All good.');
	});

	const fileContent = yamlifyEntity(entity);

	// TODO: if id matches, force to overwrite it, for now? => so we need to read it first!
	try {
		const targetFile = await plugin.app.vault.create(
			`${path}/${entity.caption}.md`,
			fileContent,
		);
		const activeLeaf = plugin.app.workspace.getLeaf(false);
		if (!activeLeaf) {
			new Notice('Could not open note: no active leaf');
			return;
		}
		await activeLeaf.openFile(targetFile, { state: { mode: 'source' } });
	} catch (_err) {
		new Notice('A note for this entity already exists.');
	}
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
