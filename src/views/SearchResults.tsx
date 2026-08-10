import { InstanceResults } from './InstanceResults';
import { FederatedSearchResults } from '../openaleph';
import { Entity } from '@opensanctions/followthemoney';

export const SearchResults = ({
	results,
	writeNote,
	loadMore,
}: {
	results: FederatedSearchResults;
	writeNote: (entity: Entity) => void;
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
