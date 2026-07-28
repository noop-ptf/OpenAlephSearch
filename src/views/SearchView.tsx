import { useState } from 'react';
export const SearchView = ({
	runSearch,
}: {
	runSearch: (query: string) => void;
}) => {
	// TODO: use placeholder pattern instead of predefined value?
	const [searchTerm, setSearchTerm] = useState('Vladimir Putin');
	return (
		<form
			className="openaleph-search-row"
			onSubmit={(event) => {
				event.preventDefault();
				runSearch(searchTerm.trim());
			}}
		>
			<input
				type="text"
				id="search-input"
				className="openaleph-search-input"
				value={searchTerm}
				onChange={(event) => {
					setSearchTerm(event.target.value);
				}}
			/>
			<button>Search</button>
		</form>
	);
};
