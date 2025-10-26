import { WebsimSocket } from "websim";

const LOCAL_STORAGE_KEY = 'lemonade_tycoon_presets';
const PRESET_COLLECTION = 'character_preset_v1';

export class PresetsManager {
    constructor({ galleryContainer, onApplyPreset }) {
        this.galleryContainer = galleryContainer;
        this.onApplyPreset = onApplyPreset;
        this.room = new WebsimSocket();
        this.localPresets = this.loadLocalPresets();

        this.room.collection(PRESET_COLLECTION).subscribe(publicPresets => {
            this.publicPresets = publicPresets.reverse(); // Newest first
            // If the public gallery is currently visible, re-render it
            const activeTab = document.querySelector('.preset-tab-btn.active');
            if (activeTab && activeTab.dataset.source === 'public') {
                this.renderPresets('public');
            }
        });
    }

    loadLocalPresets() {
        try {
            const presets = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
            return presets;
        } catch (e) {
            console.error("Could not load local presets", e);
            return [];
        }
    }

    saveLocalPreset(presetData) {
        // Limit to 20 most recent local presets to avoid filling storage
        const MAX_LOCAL_PRESETS = 20;
        this.localPresets.unshift(presetData); // Add to beginning
        this.localPresets = this.localPresets.slice(0, MAX_LOCAL_PRESETS);
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.localPresets));
        } catch (e) {
            console.error("Could not save local preset", e);
        }
    }

    async savePublicPreset(presetData) {
        // Prevent duplicate sharing
        const existing = this.room.collection(PRESET_COLLECTION)
            .filter({ compositeImageUrl: presetData.compositeImageUrl })
            .getList();

        if (existing.length > 0) {
            console.log("This preset has already been shared.");
            return;
        }
        
        return await this.room.collection(PRESET_COLLECTION).create(presetData);
    }

    renderPresets(source = 'local') {
        this.galleryContainer.innerHTML = '';
        const presetsToRender = source === 'public' ? this.publicPresets : this.localPresets;

        if (!presetsToRender || presetsToRender.length === 0) {
            this.galleryContainer.innerHTML = `<p style="text-align: center; width: 100%;">${source === 'public' ? 'No public presets yet. Share one!' : 'Generate a character to save a preset!'}</p>`;
            return;
        }

        presetsToRender.forEach(preset => {
            const presetElement = document.createElement('div');
            presetElement.classList.add('preset-item');
            
            const img = document.createElement('img');
            img.src = preset.generatedImageUrl;
            img.alt = `Character preset by ${preset.username || 'you'}`;
            presetElement.appendChild(img);
            
            presetElement.addEventListener('click', () => {
                this.onApplyPreset(preset);
            });
            this.galleryContainer.appendChild(presetElement);
        });
    }
}