import { Notice, stringifyYaml } from 'obsidian';
import OpenAlephPlugin from './main';
import { type OpenAlephEntity } from './types';

export function yamlifyEntity(entity: OpenAlephEntity): string {
	const flatEntity: Record<string, string | string[]> = {
		schema: entity.schema,
		id: entity.id,
	};
	for (const [k, v] of Object.entries(entity.properties)) {
		if (v.length === 0) {
			flatEntity[k] = '';
		} else if (v.length === 1) {
			flatEntity[k] = v[0] ?? '';
		} else {
			flatEntity[k] = v;
		}
	}
	return `---\n${stringifyYaml(flatEntity)}---\n`;
}

export function entityImportPath(
	entity: OpenAlephEntity,
	ftmdFolder: string,
	instanceFolder: string,
): string {
	const dataset = entity.dataset ?? 'unknown';
	return `${ftmdFolder}/${instanceFolder}/${dataset}`;
}

// TODO: if id matches, force to overwrite it => read first, then overwrite
export async function writeNote(
	entity: OpenAlephEntity,
	ftmdFolder: string,
	instanceFolder: string,
	plugin: OpenAlephPlugin,
): Promise<void> {
	const path = entityImportPath(entity, ftmdFolder, instanceFolder);
	plugin.app.vault.createFolder(path).catch(() => {
		console.log('[debug] Folder already existed. All good.');
	});

	const fileContent = yamlifyEntity(entity);

	try {
		const targetFile = await plugin.app.vault.create(
			`${path}/${entity.caption}.md`,
			fileContent,
		);
		const activeLeaf = plugin.app.workspace.getLeaf(false);
		if (!activeLeaf) {
			new Notice('Could not open note: no active leaf');
			return;
		}
		await activeLeaf.openFile(targetFile, { state: { mode: 'source' } });
	} catch (_err) {
		new Notice('A note for this entity already exists.');
	}
}
