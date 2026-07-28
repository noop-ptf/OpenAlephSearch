import { useState } from 'react';
import { App, Notice } from 'obsidian';
import { SearchView } from './SearchView';
import { SearchResults } from './SearchResults';
import OpenAlephPlugin from '../main';
import {
	SearchEndpoint as OpenAlephSearch,
	default as openAlephClientFactory,
	SearchResult,
	writeNote,
	OpenAlephPluginSettings,
	FederatedSearchResults,
} from '../openaleph';

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
	async function runSearch(query: string) {
		console.log(`running search with query: "${query}"`);
		// const filterForPerson = this.personFilterCheckbox.checked;
		// if (!query) return;
		//
		// // const enabledInstances = this.plugin.settings.instances.filter(
		// // 	(instance) => instance.enabled,
		// // );
		// // if (enabledInstances.length === 0) {
		// // 	new Notice('There are no enabled OpenAleph instances.');
		// // 	return;
		// // }
		//
		const ClientFactory = openAlephClientFactory();
		const apiClient = new ClientFactory(pluginSettings, app);
		const search = new OpenAlephSearch(query);
		// if (filterForPerson) {
		// 	search.filter('Person');
		// }
		try {
			const results = await apiClient.search(search);
			setSearchResults(results);
		} catch (err) {
			console.error(err);
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- This is in proper sentence case.
			new Notice('OpenAleph search failed. See log for details');
		}
	}
	return (
		<>
			<SearchView runSearch={runSearch} />
			{searchResults && (
				<SearchResults
					results={searchResults}
					writeNote={(
						// TODO: have a nicer type here
						entity: SearchResult['results'][0],
					) =>
						writeNote(
							entity,
							pluginSettings.importFolder,
							// TODO: change this from being hard-coded
							'search.openaleph.org',
							plugin,
						)
					}
				/>
			)}
		</>
	);
};
