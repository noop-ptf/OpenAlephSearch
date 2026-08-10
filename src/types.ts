import { defaultModel } from '@opensanctions/followthemoney';

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
