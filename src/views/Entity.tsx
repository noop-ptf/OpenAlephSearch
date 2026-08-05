export const Entity = ({
	entity,
	instanceName,
	writeNote,
}: {
	entity: any;
	instanceName: string;
	writeNote: () => void;
}) => {
	const caption = entity.caption || 'Unknown';
	const schema = entity.schema?.toString() || 'Thing';
	return (
		<>
			<div className="openaleph-source-heading">{entity.dataset}</div>
			<div className="openaleph-result-item">
				<div className="openaleph-result-title">{caption}</div>
				<div className="openaleph-result-snippet">{schema}</div>
				<div className="openaleph-result-actions">
					<button onClick={() => writeNote()}>Import as note</button>
				</div>
			</div>
		</>
	);
};
