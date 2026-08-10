import { Entity } from './Entity';
import { EntityByDataset } from '../openaleph';
import { Entity as FtMEntity } from '@opensanctions/followthemoney';
import { useState } from 'react';

export function InstanceResults({
	name,
	results,
	writeNote,
	loadMore,
}: {
	name: string;
	results: EntityByDataset;
	writeNote: (entity: FtMEntity) => void;
	loadMore: () => void;
}) {
	// console.log(JSON.stringify(results));
	const [collapsedIds, setCollapsedIds] = useState(new Set());

	const toggle = (id) =>
		setCollapsedIds((prev) => {
			console.log(`toggling ${id}`);
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	return (
		<>
			{[...results.entries()].map(([dataset, entities]) => {
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
									{dataset.name} ({name})
								</div>
								<div className="tree-item-flair-outer">
									<span className="tree-item-flair">
										{numEntities}
									</span>
								</div>
							</div>
							{!collapsedIds.has(dataset.id)
								? entities.map((entity) => (
										<div
											className="search-result-file-matches"
											key={entity.id}
										>
											<div
												style={{
													width: '1px',
													height: '0.1px',
													marginBottom: '0px',
												}}
											></div>
											<div
												className="search-result-file-match tappable"
												onClick={() =>
													console.log(
														'Importing note...',
													)
												}
											>
												<div className="openaleph-result-title">
													{entity.caption}
												</div>
												<div className="openaleph-result-snippet">
													{entity.schema?.toString()}
												</div>
											</div>
										</div>
									))
								: undefined}
						</div>
					</div>
				);
				// TODO: add EntityImportButton as a parallel component here instead?
				/*
				<Entity
					key={entity.id}
					entity={entity}
					instanceName={name}
					writeNote={() => writeNote(entity)}
				/>
				*/
			})}
			{/* {results.next && ( */}
			{/* 	<button onClick={() => loadMore()}>Load more</button> */}
			{/* )} */}
		</>
	);
}
