import { InstanceResults } from './InstanceResults';
import { FederatedSearchResults, SearchResult } from '../openaleph';

export const SearchResults = ({
	results,
	writeNote,
	loadMore,
}: {
	results: FederatedSearchResults;
	writeNote: (
		// TODO: have a nicer type here
		entity: SearchResult['results'][0],
	) => void;
	loadMore: (instanceId: string) => void;
}) => {
	return (
		<>
			<div className="openaleph-results">
				<div className="openaleph-results-total">
					Found {results.total} results
				</div>
				{Object.entries(results.resultsForInstance).map(
					([instanceId, instanceResults]) => (
						<InstanceResults
							key={`${instanceId}-results`}
							name={
								// TODO: there must be a better way to get the instance name :D
								results.instanceMetadata[instanceId]?.name ||
								'unknown instance'
							}
							results={instanceResults}
							writeNote={writeNote}
							loadMore={() => loadMore(instanceId)}
						/>
					),
				)}
			</div>
		</>
	);
};
