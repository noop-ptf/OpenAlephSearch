import { App } from 'obsidian';
import { type Dispatch, type SetStateAction } from 'react';
import {
	isSchemaType,
	type OpenAlephInstanceSettings,
	type FederatedSearchResults,
	type OpenAlephPluginSettings,
} from '../types';

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
