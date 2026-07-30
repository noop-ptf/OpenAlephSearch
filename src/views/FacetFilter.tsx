import { useRef } from 'react';
import { Facet } from './Facet';

export function FacetFilter({ facets, facetLabels, handleToggle }) {
	const buttonRef = useRef(null);
	const popoverRef = useRef(null);

	const openPopover = () => {
		const rect = buttonRef.current.getBoundingClientRect();
		const popover = popoverRef.current;

		// position it ourselves — popover attribute doesn't do this part
		popover.style.position = 'fixed';
		popover.style.top = `${rect.bottom + 4}px`;
		popover.style.left = `${rect.left}px`;

		popover.showPopover(); // or togglePopover()
	};

	return (
		<>
			<button ref={buttonRef} onClick={openPopover}>
				Filter
			</button>

			<div ref={popoverRef} popover="auto" className="my-popover">
				<div className="menu">
					<div className="bases-toolbar-menu-container">
						{/*<div className="search-input-container mod-raised">
							<input
								enterKeyHint="search"
								type="search"
								spellCheck="false"
								placeholder="Find or create..."
							></input>
						</div>*/}
						<fieldset>
							<legend>Select Schema filters:</legend>
							{Object.keys(facets).map((key) => (
								<Facet
									key={key}
									label={facetLabels[key]}
									value={key}
									checked={facets[key]}
									handleToggle={handleToggle}
								/>
							))}
						</fieldset>
					</div>
				</div>
			</div>
		</>
	);
}
