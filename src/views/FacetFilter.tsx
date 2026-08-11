import { useRef } from 'react';
import { Facet } from './Facet';
import { type FacetState } from '../openaleph';

interface FacetFilterProps {
	facets: FacetState;
	facetLabels: Record<string, string>;
	handleToggle: (key: string, value: boolean) => void;
}

export function FacetFilter({ facets, facetLabels, handleToggle }: FacetFilterProps) {
	const buttonRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);

	const openPopover = () => {
		const button = buttonRef.current;
		const popover = popoverRef.current;
		if (!button || !popover) return;

		const rect = button.getBoundingClientRect();
		popover.setCssProps({
			'--popover-top': `${rect.bottom + 4}px`,
			'--popover-left': `${rect.left}px`,
		});

		popover.showPopover(); // or togglePopover()
	};

	return (
		<>
			<div
				className="text-icon-button"
				ref={buttonRef}
				onClick={openPopover}
			>
				<span className="text-button-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						className="svg-icon lucide-list-filter"
					>
						<path d="M2 5h20"></path>
						<path d="M6 12h12"></path>
						<path d="M9 19h6"></path>
					</svg>
				</span>
				<span className="text-button-label">Filter</span>
				<span
					className="flair toolbar-badge"
					style={{ display: 'none' }}
				>
					0
				</span>
			</div>

			<div ref={popoverRef} popover="auto" className="my-popover">
				<div className="menu">
					<div className="bases-toolbar-menu-container openaleph-scroll">
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
									label={facetLabels[key] ?? key}
									value={key}
									checked={facets[key] ?? false}
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
