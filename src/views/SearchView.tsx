import { useState } from 'react';
import { FacetFilter } from './FacetFilter';

export const SearchView = ({
	runSearch,
	facets,
	facetLabels,
	handleFacetToggle,
}: {
	runSearch: (query: string) => void;
	facets: any;
	facetLabels: any;
	handleFacetToggle: any;
}) => {
	// TODO: use placeholder pattern instead of predefined value?
	const [searchTerm, setSearchTerm] = useState('');
	return (
		<div className="openaleph-search-row">
			<form
				className="openaleph-search-input-container"
				onSubmit={(event) => {
					event.preventDefault();
					runSearch(searchTerm.trim());
				}}
			>
				<div className="search-input-container global-search-input-container">
					<input
						enterKeyHint="search"
						type="search"
						spellCheck="false"
						placeholder="Search OpenAleph..."
						id="search-input"
						value={searchTerm}
						onChange={(event) => {
							setSearchTerm(event.target.value);
						}}
					/>
					<div
						className="search-input-clear-button"
						aria-label="Clear search"
						onClick={() => setSearchTerm('')}
					></div>
				</div>
			</form>
			<FacetFilter
				facets={facets}
				facetLabels={facetLabels}
				handleToggle={handleFacetToggle}
			/>
		</div>
	);
};
