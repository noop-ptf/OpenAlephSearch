import { OpenAlephEntity } from '../openaleph';

export const Entity = ({
	entity,
	writeNote,
}: {
	entity: OpenAlephEntity;
	writeNote: () => void;
}) => {
	const caption = entity.caption || 'Unknown';
	const schema = entity.schema?.toString() || 'Thing';
	return (
		<>
			<div className="search-result-file-matches">
				<div
					style={{
						width: '1px',
						height: '0.1px',
						marginBottom: '0px',
					}}
				></div>
				<div
					className="search-result-file-match tappable"
					onClick={() => writeNote()}
				>
					<div className="openaleph-result-title">{caption}</div>
					<div className="openaleph-result-snippet">{schema}</div>
				</div>
			</div>
		</>
	);
};
