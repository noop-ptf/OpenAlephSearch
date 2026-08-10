import { Entity } from './Entity';
import {
	InstanceResults as InstanceResultsType,
	OpenAlephEntity,
} from '../openaleph';
import { useState } from 'react';

export function InstanceResults({
	results,
	writeNote,
	loadMore,
}: {
	results: InstanceResultsType;
	writeNote: (entity: OpenAlephEntity) => void;
	loadMore: () => void;
}) {
	// console.log(JSON.stringify(results));
	const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

	const toggle = (id: string) =>
		setCollapsedIds((prev) => {
			console.log(`toggling ${id}`);
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	return (
		<>
			<div>{results.name}</div>
			{[...results.results.entries()].map(([dataset, entities]) => {
				const numEntities = entities.length;
				return (
					<div className="search-results-children" key={dataset.id}>
						<div
							style={{
								width: '1px',
								height: '0.1px',
								marginBottom: '0px',
							}}
						></div>
						<div className="tree-item search-result">
							<div
								className="tree-item-self search-result-file-title is-clickable"
								onClick={() => toggle(dataset.id)}
							>
								<div
									className={`tree-item-icon collapse-icon ${collapsedIds.has(dataset.id) ? 'is-collapsed' : undefined}`}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="svg-icon right-triangle"
									>
										<path d="M3 8L12 17L21 8"></path>
									</svg>
								</div>
								<div className="tree-item-inner">
									{dataset.name}
								</div>
								<div className="tree-item-flair-outer">
									<span className="tree-item-flair">
										{numEntities}
									</span>
								</div>
							</div>
							{!collapsedIds.has(dataset.id)
								? entities.map((entity) => (
										<Entity
											key={entity.id}
											entity={entity}
											writeNote={() => writeNote(entity)}
										/>
									))
								: undefined}
						</div>
					</div>
				);
			})}
			{results.next && (
				<button onClick={() => loadMore()}>Load more</button>
			)}
		</>
	);
}
