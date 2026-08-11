import { SearchEndpoint } from './endpoint';
import { type SearchResult } from '../types';
import { BaseClient } from './base';
import {
	moriartyPageOne,
	moriartyPageTwo,
	searchMockData,
} from '../openalephMock';

export class FakeClient extends BaseClient {
	protected async instanceSearch(
		_endpoint: SearchEndpoint,
		instanceId: string,
	): Promise<SearchResult> {
		if (instanceId.startsWith('f1cd')) {
			return moriartyPageOne();
		}
		return searchMockData();
	}

	protected async fetchNextPage(
		_nextUrl: string,
		_instanceId: string,
	): Promise<SearchResult> {
		return moriartyPageTwo();
	}
}
