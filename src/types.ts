import { App } from 'obsidian';
import { defaultModel } from '@opensanctions/followthemoney';
import { type Dispatch, type SetStateAction } from 'react';

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
	search(query: SearchEndpoint): Promise<FederatedSearchResults>;
	settingsById: { [id: string]: OpenAlephInstanceSettings };
	loadMoreForInstance(
		setter: Dispatch<SetStateAction<FederatedSearchResults | undefined>>,
		previousResults: FederatedSearchResults,
		instanceId: string,
	): Promise<void>;
}

export interface OpenAlephConstructor {
	new (settings: OpenAlephPluginSettings, app: App): OpenAlephClient;
}

type Method = 'GET' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface Endpoint {
	method(): Method;
	endpoint(): string;
	parameters(): URLSearchParams;
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

	parameters(): URLSearchParams {
		const params = new URLSearchParams();
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

export function groupEntitiesByDataset(
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
			dataset = {
				id: datasetId,
				name: entity.collection.name,
				instanceId,
			};
			seenDatasets.set(datasetId, dataset);
			result.set(dataset, []);
		}
		result.get(dataset)?.push(entity);
	}
	return result;
}
