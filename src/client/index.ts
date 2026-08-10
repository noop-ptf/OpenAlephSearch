import { HttpClient } from './http';
import { FakeClient } from './fake';
import { type OpenAlephConstructor } from './endpoint';

// Provided by esbuild.config.mjs
declare const USE_FAKE_API: boolean;

export * from './endpoint';

export default function openAlephClientFactory(): OpenAlephConstructor {
	if (USE_FAKE_API) {
		console.info('using FAKE API');
	}
	return USE_FAKE_API ? FakeClient : HttpClient;
}
