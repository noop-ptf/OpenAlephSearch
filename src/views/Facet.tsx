interface FacetProps {
	label: string;
	value: string;
	checked: boolean;
	handleToggle: (key: string, value: boolean) => void;
}

export function Facet({ label, value, checked, handleToggle }: FacetProps) {
	return (
		<label
			className="suggestion-item bases-toolbar-menu-item mod-implicit"
			htmlFor={value}
		>
			<input
				type="checkbox"
				id={value}
				value={value}
				checked={checked}
				onChange={(event) => handleToggle(value, event.target.checked)}
			/>
			<div className="bases-toolbar-menu-item-info">
				<div className="bases-toolbar-menu-item-name">{label}</div>
			</div>
		</label>
	);
}
