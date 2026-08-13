import { useRef, useEffect } from 'react';
import { setIcon } from 'obsidian';
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
	const iconRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (iconRef.current) {
			setIcon(iconRef.current, 'list-filter');
		}
	}, []);

	const openPopover = () => {
		const button = buttonRef.current;
		const popover = popoverRef.current;
		if (!button || !popover) return;

		const rect = button.getBoundingClientRect();
		popover.setCssProps({
			'--popover-top': `${rect.bottom + 4}px`,
			'--popover-left': `${rect.left}px`,
		});

		popover.showPopover();
	};

	const allSelected = Object.values(facets).every((value) => value);

	return (
		<>
			<div
				className="text-icon-button"
				ref={buttonRef}
				onClick={openPopover}
			>
				<span className="text-button-icon" ref={iconRef} />
			</div>

			<div ref={popoverRef} popover="auto" className="openaleph-facet-popover">
				<div className="menu-scroll openaleph-facet-list">
					<div className="bases-toolbar-menu-container">
						<div className="bases-toolbar-items">

							<label
								className="suggestion-item openaleph-facet-clear"
								htmlFor="select-all-facets"
							>
								<input
									type="checkbox"
									id="select-all-facets"
									checked={allSelected}
									onChange={(event) => {
										const value = event.target.checked;
										Object.keys(facets).forEach((key) =>
											handleToggle(key, value),
										);
									}}
								/>
								<div className="bases-toolbar-menu-item-info">
									<div className="bases-toolbar-menu-item-name">
										Select all
									</div>
								</div>
							</label>

							<hr className="openaleph-facet-divider" />

							{Object.keys(facets).map((key) => (
								<Facet
									key={key}
									label={facetLabels[key] ?? key}
									value={key}
									checked={facets[key] ?? false}
									handleToggle={handleToggle}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
