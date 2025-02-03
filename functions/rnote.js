const fs = require('fs').promises;
const path = require('path');
const uuid = require('uuid');

/**
 * Note management system for GLaDOS bot
 */
class NoteManager {
    /**
     * Creates a new note with the given text
     * @param {string} text - Content of the note
     * @returns {Promise<string>} The ID of the created note
     */
    static async saveNote(text) {
        try {
            const id = uuid.v4();
            const fileName = `note-${id}.txt`;

            await fs.writeFile(fileName, text);
            console.log(`Note saved successfully: ${fileName}`);
            return id;
        } catch (error) {
            console.error('Error saving note:', error);
            throw new Error('Failed to save note');
        }
    }

    /**
     * Reads a note by its ID
     * @param {string} id - Note identifier
     * @returns {Promise<string>} The content of the note
     */
    static async readNote(id) {
        try {
            const fileName = `note-${id}.txt`;
            const content = await fs.readFile(fileName, 'utf8');
            console.log(`Note read successfully: ${fileName}`);
            return content;
        } catch (error) {
            console.error('Error reading note:', error);
            throw new Error('Failed to read note');
        }
    }

    /**
     * Lists all saved notes
     * @returns {Promise<Array<string>>} Array of note IDs
     */
    static async listNotes() {
        try {
            const files = await fs.readdir(process.cwd());
            const noteFiles = files.filter(file => file.startsWith('note-') && file.endsWith('.txt'));
            const noteIds = noteFiles.map(file => file.replace('note-', '').replace('.txt', ''));
            console.log('Notes listed successfully');
            return noteIds;
        } catch (error) {
            console.error('Error listing notes:', error);
            throw new Error('Failed to list notes');
        }
    }

    /**
     * Deletes a note by its ID
     * @param {string} id - Note identifier
     * @returns {Promise<void>}
     */
    static async deleteNote(id) {
        try {
            const fileName = `note-${id}.txt`;
            await fs.unlink(fileName);
            console.log(`Note deleted successfully: ${fileName}`);
        } catch (error) {
            console.error('Error deleting note:', error);
            throw new Error('Failed to delete note');
        }
    }
}

module.exports = NoteManager;