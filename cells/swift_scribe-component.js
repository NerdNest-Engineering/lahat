import { WidgetComponent  } from '../../components/core/widget-component.js';

export class SwiftScribeWidget extends WidgetComponent {
  constructor() {
    super();
    this.notes = [];
    this.currentNoteIndex = -1;
    this.searchQuery = '';
    this.tags = new Set();
    this.filterTag = null;
    
    this.initialize();
  }
  
  initialize() {
    const html = `
      <div class="swift-scribe">
        <div class="sidebar">
          <div class="app-title">
            <h1>Swift Scribe</h1>
          </div>
          <div class="search-container">
            <input type="text" id="search-input" placeholder="Search notes...">
          </div>
          <div class="tags-container">
            <h3>Tags</h3>
            <div class="tags-list"></div>
          </div>
          <button id="new-note-btn">+ New Note</button>
        </div>
        <div class="notes-list">
          <h2>My Notes <span id="notes-count"></span></h2>
          <div class="notes-container"></div>
        </div>
        <div class="note-editor">
          <div class="note-header">
            <input type="text" id="note-title" placeholder="Note Title">
            <div class="note-tags">
              <input type="text" id="note-tags" placeholder="Add tags (comma separated)">
            </div>
            <div class="toolbar">
              <button id="bold-btn" title="Bold"><b>B</b></button>
              <button id="italic-btn" title="Italic"><i>I</i></button>
              <button id="underline-btn" title="Underline"><u>U</u></button>
              <button id="delete-note-btn" title="Delete Note">🗑️</button>
            </div>
          </div>
          <div class="editor-container">
            <div id="note-content" contenteditable="true" placeholder="Start typing here..."></div>
          </div>
        </div>
      </div>
    `;
    
    const styles = `
      :host {
        display: block;
        height: 100%;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .swift-scribe {
        display: grid;
        grid-template-columns: 200px 250px 1fr;
        height: 100%;
        background-color: #f9f9f9;
        color: #333;
      }
      
      .sidebar {
        background-color: #2c3e50;
        color: white;
        padding: 15px;
        display: flex;
        flex-direction: column;
      }
      
      .app-title h1 {
        font-size: 1.5rem;
        margin: 0 0 20px 0;
      }
      
      .search-container {
        margin-bottom: 20px;
      }
      
      #search-input {
        width: 100%;
        padding: 8px;
        border: none;
        border-radius: 4px;
        background-color: #34495e;
        color: white;
      }
      
      #search-input::placeholder {
        color: #bdc3c7;
      }
      
      .tags-container {
        flex-grow: 1;
        overflow-y: auto;
      }
      
      .tags-container h3 {
        font-size: 1rem;
        margin: 0 0 10px 0;
      }
      
      .tag-item {
        padding: 5px 10px;
        margin: 5px 0;
        background-color: #34495e;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .tag-item:hover {
        background-color: #3d566e;
      }
      
      .tag-item.active {
        background-color: #3498db;
      }
      
      #new-note-btn {
        padding: 10px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 15px;
      }
      
      #new-note-btn:hover {
        background-color: #2980b9;
      }
      
      .notes-list {
        background-color: #ecf0f1;
        border-right: 1px solid #ddd;
        display: flex;
        flex-direction: column;
      }
      
      .notes-list h2 {
        padding: 15px;
        margin: 0;
        font-size: 1.2rem;
        border-bottom: 1px solid #ddd;
      }
      
      .notes-container {
        overflow-y: auto;
        flex-grow: 1;
      }
      
      .note-item {
        padding: 15px;
        border-bottom: 1px solid #ddd;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .note-item:hover {
        background-color: #dde4e6;
      }
      
      .note-item.active {
        background-color: #d6eaf8;
        border-left: 4px solid #3498db;
      }
      
      .note-item h3 {
        margin: 0 0 5px 0;
        font-size: 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .note-item p {
        margin: 0;
        font-size: 0.85rem;
        color: #7f8c8d;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .note-item .note-date {
        font-size: 0.75rem;
        color: #95a5a6;
        margin-top: 5px;
      }
      
      .note-editor {
        display: flex;
        flex-direction: column;
        background-color: white;
      }
      
      .note-header {
        padding: 15px;
        border-bottom: 1px solid #ddd;
      }
      
      #note-title {
        width: 100%;
        padding: 8px 0;
        font-size: 1.5rem;
        border: none;
        outline: none;
        margin-bottom: 10px;
      }
      
      .note-tags {
        margin-bottom: 10px;
      }
      
      #note-tags {
        width: 100%;
        padding: 8px 0;
        border: none;
        border-bottom: 1px solid #eee;
        outline: none;
        font-size: 0.9rem;
      }
      
      .toolbar {
        display: flex;
        gap: 10px;
        padding: 10px 0;
      }
      
      .toolbar button {
        background-color: #f1f1f1;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 0.9rem;
      }
      
      .toolbar button:hover {
        background-color: #e1e1e1;
      }
      
      #delete-note-btn {
        margin-left: auto;
        background-color: #e74c3c;
        color: white;
      }
      
      #delete-note-btn:hover {
        background-color: #c0392b;
      }
      
      .editor-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 15px;
      }
      
      #note-content {
        outline: none;
        min-height: 100%;
        padding: 10px;
        line-height: 1.6;
      }
      
      #note-content[placeholder]:empty:before {
        content: attr(placeholder);
        color: #aaa;
      }
      
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #95a5a6;
      }
      
      .empty-state p {
        margin: 10px 0;
      }
      
      @media (max-width: 768px) {
        .swift-scribe {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }
        
        .sidebar, .notes-list {
          display: none;
        }
      }
    `;
    
    super.render(`<style>${styles}</style>${html}`);
    this.attachEventListeners();
  }
  
  async onDataStoreReady() {
    const savedNotes = await this.loadData('notes');
    if (savedNotes) {
      this.notes = savedNotes;
      this.updateNotesList();
      this.extractTags();
      this.renderTags();
      
      // Load the last edited note if available
      const lastNoteIndex = await this.loadData('lastNoteIndex');
      if (lastNoteIndex !== null && this.notes.length > 0) {
        this.openNote(lastNoteIndex);
      }
    }
  }
  
  attachEventListeners() {
    // New note button
    this.$('#new-note-btn').addEventListener('click', () => this.createNewNote());
    
    // Search functionality
    this.$('#search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.updateNotesList();
    });
    
    // Note editor events
    this.$('#note-title').addEventListener('input', () => this.saveCurrentNote());
    this.$('#note-tags').addEventListener('input', () => this.saveCurrentNote());
    this.$('#note-content').addEventListener('input', () => this.saveCurrentNote());
    
    // Formatting buttons
    this.$('#bold-btn').addEventListener('click', () => this.formatText('bold'));
    this.$('#italic-btn').addEventListener('click', () => this.formatText('italic'));
    this.$('#underline-btn').addEventListener('click', () => this.formatText('underline'));
    
    // Delete note button
    this.$('#delete-note-btn').addEventListener('click', () => this.deleteCurrentNote());
  }
  
  createNewNote() {
    const newNote = {
      id: Date.now(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.notes.unshift(newNote);
    this.saveNotes();
    this.updateNotesList();
    this.openNote(0);
  }
  
  openNote(index) {
    if (index < 0 || index >= this.notes.length) return;
    
    this.currentNoteIndex = index;
    const note = this.notes[index];
    
    this.$('#note-title').value = note.title;
    this.$('#note-tags').value = note.tags.join(', ');
    this.$('#note-content').innerHTML = note.content;
    
    // Update active note in the list
    this.$$('.note-item').forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    this.saveData('lastNoteIndex', index);
  }
  
  saveCurrentNote() {
    if (this.currentNoteIndex < 0) return;
    
    const note = this.notes[this.currentNoteIndex];
    note.title = this.$('#note-title').value;
    note.content = this.$('#note-content').innerHTML;
    
    // Process tags
    const tagsInput = this.$('#note-tags').value;
    note.tags = tagsInput.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    note.updatedAt = new Date().toISOString();
    
    this.saveNotes();
    this.updateNotesList();
    this.extractTags();
    this.renderTags();
  }
  
  deleteCurrentNote() {
    if (this.currentNoteIndex < 0) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      this.notes.splice(this.currentNoteIndex, 1);
      this.saveNotes();
      this.currentNoteIndex = -1;
      this.updateNotesList();
      this.extractTags();
      this.renderTags();
      
      if (this.notes.length > 0) {
        this.openNote(0);
      } else {
        this.$('#note-title').value = '';
        this.$('#note-tags').value = '';
        this.$('#note-content').innerHTML = '';
      }
    }
  }
  
  formatText(format) {
    document.execCommand(format, false, null);
    this.$('#note-content').focus();
    this.saveCurrentNote();
  }
  
  updateNotesList() {
    const notesContainer = this.$('.notes-container');
    const notesCount = this.$('#notes-count');
    
    // Filter notes based on search query and tag filter
    let filteredNotes = this.notes;
    
    if (this.searchQuery) {
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(this.searchQuery) || 
        this.stripHtml(note.content).toLowerCase().includes(this.searchQuery)
      );
    }
    
    if (this.filterTag) {
      filteredNotes = filteredNotes.filter(note => 
        note.tags.includes(this.filterTag)
      );
    }
    
    // Update notes count
    notesCount.textContent = `(${filteredNotes.length})`;
    
    // Clear the container
    notesContainer.innerHTML = '';
    
    if (filteredNotes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>No notes found</p>
        <p>Create a new note or change your search</p>
      `;
      notesContainer.appendChild(emptyState);
      return;
    }
    
    // Create note items
    filteredNotes.forEach((note, index) => {
      const noteItem = document.createElement('div');
      noteItem.className = 'note-item';
      if (index === this.currentNoteIndex) {
        noteItem.classList.add('active');
      }
      
      const date = new Date(note.updatedAt);
      const formattedDate = date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      noteItem.innerHTML = `
        <h3>${note.title}</h3>
        <p>${this.stripHtml(note.content).substring(0, 50)}${note.content.length > 50 ? '...' : ''}</p>
        <div class="note-date">${formattedDate}</div>
      `;
      
      noteItem.addEventListener('click', () => {
        const originalIndex = this.notes.findIndex(n => n.id === note.id);
        this.openNote(originalIndex);
      });
      
      notesContainer.appendChild(noteItem);
    });
  }
  
  stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }
  
  extractTags() {
    this.tags.clear();
    this.notes.forEach(note => {
      note.tags.forEach(tag => {
        if (tag) this.tags.add(tag);
      });
    });
  }
  
  renderTags() {
    const tagsContainer = this.$('.tags-list');
    tagsContainer.innerHTML = '';
    
    if (this.tags.size === 0) {
      const emptyTags = document.createElement('div');
      emptyTags.textContent = 'No tags yet';
      emptyTags.style.color = '#95a5a6';
      emptyTags.style.fontSize = '0.9rem';
      emptyTags.style.padding = '5px 0';
      tagsContainer.appendChild(emptyTags);
      return;
    }
    
    // Add "All" tag
    const allTag = document.createElement('div');
    allTag.className = 'tag-item';
    if (!this.filterTag) allTag.classList.add('active');
    allTag.textContent = 'All Notes';
    allTag.addEventListener('click', () => {
      this.filterTag = null;
      this.updateNotesList();
      this.renderTags();
    });
    tagsContainer.appendChild(allTag);
    
    // Add all other tags
    Array.from(this.tags).sort().forEach(tag => {
      const tagItem = document.createElement('div');
      tagItem.className = 'tag-item';
      if (this.filterTag === tag) tagItem.classList.add('active');
      tagItem.textContent = tag;
      tagItem.addEventListener('click', () => {
        this.filterTag = tag;
        this.updateNotesList();
        this.renderTags();
      });
      tagsContainer.appendChild(tagItem);
    });
  }
  
  async saveNotes() {
    await this.saveData('notes', this.notes);
    this.publishEvent('notes-updated', { count: this.notes.length });
  }
  
  onResize(width, height) {
    // Adjust layout based on available space
    const swiftScribe = this.$('.swift-scribe');
    
    if (width < 700) {
      swiftScribe.style.gridTemplateColumns = '0 0 1fr';
    } else if (width < 900) {
      swiftScribe.style.gridTemplateColumns = '200px 0 1fr';
    } else {
      swiftScribe.style.gridTemplateColumns = '200px 250px 1fr';
    }
  }
}

// Register the component
customElements.define('swift-scribe-widget', SwiftScribeWidget);