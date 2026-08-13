import { defaultModel } from '@opensanctions/followthemoney';

const SCHEMA_TYPE_SET = new Set(Object.keys(defaultModel.schemata));
// We aren't interested in these specific Schema Types in Obsidian, due to their size/shape/unstructuredness.
export const EXCLUDED_SCHEMA_TYPES = new Set([
	'Article',
	'Audio',
	'Email',
	'File',
	'Folder',
	'HyperText',
	'Image',
	'Page',
	'Pages',
	'Table',
	'Video',
	'Workbook',
]);
export const SCHEMA_TYPES = Array.from(
	Object.keys(defaultModel.schemata),
).filter((k) => !EXCLUDED_SCHEMA_TYPES.has(k));

export function isSchemaType(value: string): boolean {
	return SCHEMA_TYPE_SET.has(value);
}

interface Collection {
	id: string;
	label: string;
	[key: string]: unknown;
}

interface Links {
	self: string;
	expand: string;
	[key: string]: unknown;
}

export interface OpenAlephEntity {
	id: string;
	caption: string;
	schema: string;
	// Values can be strings or nested entity objects for linked properties.
	properties: Record<string, unknown[]>;
	collection: Collection;
	links: Links;
	dataset?: string;
	referents?: string[];
	[key: string]: unknown;
}

export type FacetState = Record<string, boolean>;

// TODO: Use OpenAleph API Spec + openapi-typescript instead?
// seems this could also build us a client:
// https://openapi-ts.dev/openapi-fetch/
export interface SearchResult {
	status: string;
	results: OpenAlephEntity[];
	total: number;
	next: string | null;
	[key: string]: unknown;
}

export interface Dataset {
	id: string;
	label: string;
	instanceId: string;
}

export type EntityByDataset = Map<Dataset, OpenAlephEntity[]>;

export interface InstanceResults {
	name: string;
	results: EntityByDataset;
	next: string | null;
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
	const result: EntityByDataset =
		existing ?? new Map<Dataset, OpenAlephEntity[]>();
	const seenDatasets = new Map<string, Dataset>(
		[...(existing?.keys() ?? [])].map((d) => [d.id, d]),
	);
	for (const entity of entities) {
		const datasetId = entity.collection.id;
		let dataset = seenDatasets.get(datasetId);
		if (dataset === undefined) {
			dataset = {
				id: datasetId,
				label: entity.collection.label,
				instanceId,
			};
			seenDatasets.set(datasetId, dataset);
			result.set(dataset, []);
		}
		result.get(dataset)?.push(entity);
	}
	return result;
}
