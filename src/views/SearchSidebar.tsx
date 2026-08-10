import { useState } from 'react';
import { App, Notice } from 'obsidian';
import { SearchView } from './SearchView';
import { SearchResults } from './SearchResults';
import OpenAlephPlugin from '../main';
import {
	SearchEndpoint as OpenAlephSearch,
	default as openAlephClientFactory,
	OpenAlephEntity,
	writeNote,
	yamlifyEntity,
	entityImportPath,
	OpenAlephPluginSettings,
	FederatedSearchResults,
	SCHEMA_TYPES as FTM_SCHEMA_TYPES,
} from '../openaleph';
import { ConfirmNoteModal } from '../modals';

const initialFacets = Object.fromEntries(
	FTM_SCHEMA_TYPES.map((k) => [k, false]),
);
// TODO: get the actual labels from FtM
const facetLabels = Object.fromEntries(FTM_SCHEMA_TYPES.map((k) => [k, k]));

export const SearchSidebar = ({
	pluginSettings,
	app,
	plugin,
}: {
	pluginSettings: OpenAlephPluginSettings;
	app: App;
	plugin: OpenAlephPlugin;
}) => {
	const [searchResults, setSearchResults] =
		useState<FederatedSearchResults>();
	const [facets, setFacets] = useState(initialFacets);
	async function runSearch(query: string) {
		console.log(`running search with query: "${query}"`);
		const ClientFactory = openAlephClientFactory();
		const apiClient = new ClientFactory(pluginSettings, app);
		const search = new OpenAlephSearch(query);
		const chosenFacets = Object.entries(facets).filter(
			([_key, value]) => value,
		);
		console.log({ chosenFacets });
		for (const [key, _val] of chosenFacets) {
			search.filter(key);
		}
		console.log(search);
		try {
			const results = await apiClient.search(search);
			setSearchResults(results);
		} catch (err) {
			console.error(err);
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- This is in proper sentence case.
			new Notice('OpenAleph search failed. See log for details');
		}
	}

	async function loadMore(instanceId: string) {
		const ClientFactory = openAlephClientFactory();
		const apiClient = new ClientFactory(pluginSettings, app);
		if (searchResults !== undefined) {
			await apiClient.loadMoreForInstance(
				setSearchResults,
				searchResults,
				instanceId,
			);
		}
	}

	function handleFacetToggle(key: string, value: boolean) {
		setFacets({ ...facets, [key]: value });
	}

	return (
		<>
			<SearchView
				runSearch={runSearch}
				facets={facets}
				facetLabels={facetLabels}
				handleFacetToggle={handleFacetToggle}
			/>
			{searchResults && (
				<SearchResults
					results={searchResults}
					writeNote={(entity: OpenAlephEntity) => {
						const instanceHostname = new URL(entity.links.self)
							.hostname;
						new ConfirmNoteModal(
							app,
							entity.caption || 'Unknown',
							entityImportPath(
								entity,
								pluginSettings.importFolder,
								instanceHostname,
							),
							yamlifyEntity(entity),
							() => {
								writeNote(
									entity,
									pluginSettings.importFolder,
									instanceHostname,
									plugin,
								);
							},
						).open();
					}}
					loadMore={loadMore}
				/>
			)}
		</>
	);
};
