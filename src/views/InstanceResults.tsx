import { Entity } from './Entity';
import { SearchResult } from '../openaleph';

export function InstanceResults({
	name,
	results,
	writeNote,
	loadMore,
}: {
	name: string;
	results: SearchResult;
	writeNote: (entity: SearchResult['results'][0]) => void;
	loadMore: () => void;
}) {
	// console.log(JSON.stringify(results));
	return (
		<>
			{results.results.map((entity) => (
				// TODO: add EntityImportButton as a parallel component here instead?
				<Entity
					key={entity.id}
					entity={entity}
					instanceName={name}
					writeNote={() => writeNote(entity)}
				/>
			))}
			{results.next && (
				<button onClick={() => loadMore()}>Load more</button>
			)}
		</>
	);
}
