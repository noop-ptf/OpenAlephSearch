export const Entity = ({
	instanceName,
	caption,
	schema,
	writeNote,
}: {
	instanceName: string;
	caption: string;
	schema: string;
	writeNote: () => void;
}) => {
	return (
		<>
			<div className="openaleph-source-heading">{instanceName}</div>
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
