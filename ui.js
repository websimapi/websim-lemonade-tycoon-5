export const elements = {
    mainContainer: document.querySelector('.main-container'),
    characterCreationScreen: document.getElementById('character-creation-screen'),
    loadingOverlay: document.getElementById('loading-overlay'),
    generationResultScreen: document.getElementById('generation-result-screen'),
    newGameBtn: document.getElementById('new-game-btn'),
    continueGameBtn: document.getElementById('continue-game-btn'),
    backToMenuBtn: document.getElementById('back-to-menu-btn'),
    startGameBtn: document.getElementById('start-game-btn'),
    presetsBtn: document.getElementById('presets-btn'),
    presetGalleryContainer: document.getElementById('preset-gallery-container'),
    closePresetsBtn: document.getElementById('close-presets-btn'),
    presetGallery: document.getElementById('preset-gallery'),
    presetTabs: document.querySelectorAll('.preset-tab-btn'),
    genderBtns: document.querySelectorAll('.gender-btn'),
    dollImage: document.getElementById('doll-image'),
    dollContainer: document.getElementById('doll-container'),
    clothingItems: document.querySelectorAll('.clothing-item'),
    backToEditorBtn: document.getElementById('back-to-editor-btn'),
    sharePresetBtn: document.getElementById('share-preset-btn'),
    confirmCharacterBtn: document.getElementById('confirm-character-btn'),
    generatedCharacterImage: document.getElementById('generated-character-image'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    prevItemBtn: document.getElementById('prev-item-btn'),
    nextItemBtn: document.getElementById('next-item-btn'),
    clothingPalette: document.getElementById('clothing-palette'),
};

export function showScreen(screen) {
    screen.classList.remove('hidden');
}

export function hideScreen(screen) {
    screen.classList.add('hidden');
}

export function setupScreenTransitions(presetsManager) {
    elements.newGameBtn.addEventListener('click', () => {
        hideScreen(elements.mainContainer);
        showScreen(elements.characterCreationScreen);
    });

    elements.backToMenuBtn.addEventListener('click', () => {
        hideScreen(elements.characterCreationScreen);
        hideScreen(elements.generationResultScreen);
        hideScreen(elements.presetGalleryContainer);
        showScreen(elements.mainContainer);
    });

    elements.backToEditorBtn.addEventListener('click', () => {
        hideScreen(elements.generationResultScreen);
        showScreen(elements.characterCreationScreen);
        elements.sharePresetBtn.disabled = false;
        elements.sharePresetBtn.textContent = 'Share Publicly';
    });

    elements.presetsBtn.addEventListener('click', () => {
        presetsManager.renderPresets('local');
        showScreen(elements.presetGalleryContainer);
    });

    elements.closePresetsBtn.addEventListener('click', () => {
        hideScreen(elements.presetGalleryContainer);
    });

    elements.presetTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.presetTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            presetsManager.renderPresets(tab.dataset.source);
        });
    });
}