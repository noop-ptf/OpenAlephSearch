/* eslint-disable obsidianmd/ui/sentence-case -- This is all valid sentence case */

import { App, Modal } from 'obsidian';

export class ConfirmNoteModal extends Modal {
	private noteName: string;
	private notePath: string;
	private noteText: string;
	private onConfirm: () => void;

	constructor(
		app: App,
		noteName: string,
		notePath: string,
		noteText: string,
		onConfirm: () => void,
	) {
		super(app);
		this.noteName = noteName;
		this.notePath = notePath;
		this.noteText = noteText;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h2', { text: 'Confirm Entity import' });

		contentEl.createEl('p', {
			text: `The Entity below will be imported to your Obsidian as a note to ${this.notePath}`,
		});

		const notePreview = contentEl.createDiv({
			cls: 'openaleph-note-preview-container',
		});

		notePreview.createEl('h3', { text: this.noteName });

		const preview =
			this.noteText.length > 300
				? this.noteText.slice(0, 300) + '…'
				: this.noteText;

		notePreview.createEl('pre', {
			text: preview,
			cls: 'openaleph-note-preview',
		});

		const buttonContainer = contentEl.createDiv({
			cls: 'modal-button-container',
		});

		const confirmButton = buttonContainer.createEl('button', {
			text: 'Confirm',
			cls: 'mod-cta',
		});
		confirmButton.addEventListener('click', () => {
			this.close();
			this.onConfirm();
		});

		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
		});
		cancelButton.addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
