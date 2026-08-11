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

export async function writeNote(
	entity: OpenAlephEntity,
	ftmdFolder: string,
	instanceFolder: string,
	plugin: OpenAlephPlugin,
): Promise<void> {
	const path = entityImportPath(entity, ftmdFolder, instanceFolder);
	const filePath = `${path}/${entity.caption}.md`;
	const fileContent = yamlifyEntity(entity);

	plugin.app.vault.createFolder(path).catch(() => {
		// folder already exists, ignore
	});

	const existingFile = plugin.app.vault.getFileByPath(filePath);
	const targetFile = existingFile
		? await plugin.app.vault.modify(existingFile, fileContent).then(() => existingFile)
		: await plugin.app.vault.create(filePath, fileContent);

	const activeLeaf = plugin.app.workspace.getLeaf(false);
	if (!activeLeaf) {
		new Notice('Could not open note: no active leaf');
		return;
	}
	await activeLeaf.openFile(targetFile, { state: { mode: 'source' } });
}
