import { useState, useCallback, useRef } from 'react';
import { App, Notice } from 'obsidian';
import {
	SearchEndpoint,
	default as openAlephClientFactory,
	type OpenAlephPluginSettings,
	type FederatedSearchResults,
	type FacetState,
	SCHEMA_TYPES,
} from '../openaleph';
import { LoadingModal } from '../modals';

export function useOpenAlephSearch(
	pluginSettings: OpenAlephPluginSettings,
	app: App,
) {
	const [searchResults, setSearchResults] =
		useState<FederatedSearchResults>();
	const [facets, setFacets] = useState<FacetState>(() =>
		Object.fromEntries(SCHEMA_TYPES.map((k) => [k, true])),
	);

	// TODO: get the actual labels from FtM
	const facetLabels = Object.fromEntries(SCHEMA_TYPES.map((k) => [k, k]));

	const clientRef = useRef(
		(() => {
			const Factory = openAlephClientFactory();
			return new Factory(pluginSettings, app);
		})(),
	);

	const runSearch = useCallback(
		async (query: string) => {
			const search = new SearchEndpoint(query);
			for (const [key, active] of Object.entries(facets)) {
				if (active) search.filter(key);
			}
			const loadingModal = new LoadingModal(app);
			loadingModal.open();
			try {
				const results = await clientRef.current.search(search);
				setSearchResults(results);
			} catch {
				// eslint-disable-next-line obsidianmd/ui/sentence-case -- This is in proper sentence case.
				new Notice('OpenAleph search failed. See log for details');
			} finally {
				loadingModal.close();
			}
		},
		[facets],
	);

	const loadMore = useCallback(
		async (instanceId: string) => {
			if (searchResults !== undefined) {
				await clientRef.current.loadMoreForInstance(
					setSearchResults,
					searchResults,
					instanceId,
				);
			}
		},
		[searchResults],
	);

	const handleFacetToggle = useCallback((key: string, value: boolean) => {
		setFacets((prev) => ({ ...prev, [key]: value }));
	}, []);

	return {
		searchResults,
		facets,
		facetLabels,
		runSearch,
		loadMore,
		handleFacetToggle,
	};
}
