import { InstanceResults } from './InstanceResults';
import { FederatedSearchResults, OpenAlephEntity } from '../openaleph';

export const SearchResults = ({
	results,
	writeNote,
	loadMore,
}: {
	results: FederatedSearchResults;
	writeNote: (entity: OpenAlephEntity) => void;
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
