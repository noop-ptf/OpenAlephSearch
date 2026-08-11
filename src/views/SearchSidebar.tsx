import { App } from 'obsidian';
import { SearchView } from './SearchView';
import { SearchResults } from './SearchResults';
import OpenAlephPlugin from '../main';
import {
	type OpenAlephEntity,
	type OpenAlephPluginSettings,
	writeNote,
	yamlifyEntity,
	entityImportPath,
} from '../openaleph';
import { ConfirmNoteModal } from '../modals';
import { useOpenAlephSearch } from '../hooks/useOpenAlephSearch';

export const SearchSidebar = ({
	pluginSettings,
	app,
	plugin,
}: {
	pluginSettings: OpenAlephPluginSettings;
	app: App;
	plugin: OpenAlephPlugin;
}) => {
	const {
		searchResults,
		facets,
		facetLabels,
		runSearch,
		loadMore,
		handleFacetToggle,
	} = useOpenAlephSearch(pluginSettings, app);

	return (
		<>
			<SearchView
				runSearch={(q) => { void runSearch(q); }}
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
								void writeNote(
									entity,
									pluginSettings.importFolder,
									instanceHostname,
									plugin,
								);
							},
						).open();
					}}
					loadMore={(instanceId) => { void loadMore(instanceId); }}
				/>
			)}
		</>
	);
};
