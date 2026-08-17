import { Entity } from './Entity';
import {
	InstanceResults as InstanceResultsType,
	OpenAlephEntity,
} from '../openaleph';
import { useState } from 'react';
import { setIcon } from 'obsidian';

export function InstanceResults({
	results,
	writeNote,
	loadMore,
}: {
	results: InstanceResultsType;
	writeNote: (entity: OpenAlephEntity) => void;
	loadMore: () => void;
}) {
	const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
	const [instanceCollapsed, setInstanceCollapsed] = useState(false);

	const toggle = (id: string) =>
		setCollapsedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const hasResults = [...results.results.values()].some(
		(entities) => entities.length > 0,
	);

	if (!hasResults) {
		return null;
	}

	return (
		<>
			<div
				className="tree-item-self search-result-file-title is-clickable"
				onClick={() => setInstanceCollapsed((el) => !el)}
			>
				<div
					className={`tree-item-icon collapse-icon ${instanceCollapsed ? 'is-collapsed' : ''}`}
				>
					<span
						ref={(el) => {
							if (el) setIcon(el, 'chevron-down');
						}}
					/>
				</div>
				<div className="tree-item-inner openaleph-instance-name">{results.name}</div>
			</div>
			{!instanceCollapsed && (
				<>
					{[...results.results.entries()].map(([dataset, entities]) => {
						const numEntities = entities.length;
						return (
							<div className="search-results-children" key={dataset.id}>
								<div className="tree-item search-result">
									<div
										className="tree-item-self search-result-file-title is-clickable"
										onClick={() => toggle(dataset.id)}
									>
										<div
											className={`tree-item-icon collapse-icon ${collapsedIds.has(dataset.id) ? 'is-collapsed' : ''}`}
										>
											<span
												ref={(el) => {
													if (el) setIcon(el, 'chevron-down');
												}}
											/>
										</div>
										<div className="tree-item-inner">
											{dataset.label}
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
			)}
		</>
	);
}