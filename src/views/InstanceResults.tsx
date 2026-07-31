import { Entity } from './Entity';
import { SearchResult } from '../openaleph';

export const InstanceResults = ({
	name,
	results,
	writeNote,
	loadMore,
}: {
	name: string;
	results: SearchResult;
	writeNote: (entity: SearchResult['results'][0]) => void;
	loadMore: () => void;
}) => {
	return (
		<>
			{results.results.map((result) => (
				// TODO: add EntityImportButton as a parallel component here instead?
				<Entity
					key={result.id}
					instanceName={name}
					caption={result.caption || 'Unknown'}
					schema={result.schema?.toString() || 'Thing'}
					writeNote={() => writeNote(result)}
				/>
			))}
			{results.next && (
				<button onClick={() => loadMore()}>Load more</button>
			)}
		</>
	);
};
