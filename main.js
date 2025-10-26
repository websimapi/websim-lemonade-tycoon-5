import { ReplayService } from './replay.js';
import { AudioManager } from './audio.js';
import { elements, showScreen, hideScreen, setupScreenTransitions } from './ui.js';
import { initializeInventory } from './inventory.js';
import { initializeEditor, applyCharacterData, getCharacterData, clearWornItems } from './character-editor.js';
import { generateCharacter } from './character-generator.js';
import { PresetsManager } from './presets.js';

document.addEventListener('DOMContentLoaded', () => {
    // Instantiate services
    const replayService = new ReplayService();
    const audioManager = new AudioManager();
    const presetsManager = new PresetsManager({
        galleryContainer: elements.presetGallery,
        onApplyPreset: (preset) => {
            applyCharacterData(preset, elements.dollContainer, elements.dollImage);
            hideScreen(elements.presetGalleryContainer);
        }
    });
    
    // Setup UI
    setupScreenTransitions(presetsManager);
    initializeInventory(elements);
    initializeEditor(elements);

    let lastGeneratedCharacterData = null;
    
    // Start ambient sounds on first user interaction
    const startAudio = () => {
        audioManager.playAmbientSound('ambient_birds.mp3');
        audioManager.playAmbientSound('ambient_wind.mp3');
        document.body.removeEventListener('click', startAudio);
        document.body.removeEventListener('touchstart', startAudio);
    };

    document.body.addEventListener('click', startAudio);
    document.body.addEventListener('touchstart', startAudio);

    elements.startGameBtn.addEventListener('click', async () => {
        console.log("Generating character...");
        showScreen(elements.loadingOverlay);
        hideScreen(elements.characterCreationScreen);

        try {
            const characterData = getCharacterData(elements.dollImage, elements.dollContainer);
            const { imageUrl, compositeImage } = await generateCharacter(elements.dollImage, elements.dollContainer, characterData);
            
            elements.generatedCharacterImage.src = imageUrl;
            
            lastGeneratedCharacterData = {
                ...characterData,
                generatedImageUrl: imageUrl,
                compositeImageUrl: compositeImage
            };
            
            presetsManager.saveLocalPreset(lastGeneratedCharacterData);

            showScreen(elements.generationResultScreen);
        } catch (error) {
            console.error('Error generating character:', error);
            alert('Sorry, there was an error generating your character. Please try again.');
            showScreen(elements.characterCreationScreen); // Go back to editor on error
        } finally {
            hideScreen(elements.loadingOverlay);
        }
    });

    elements.sharePresetBtn.addEventListener('click', async () => {
        if (lastGeneratedCharacterData) {
            try {
                elements.sharePresetBtn.disabled = true;
                elements.sharePresetBtn.textContent = 'Sharing...';
                await presetsManager.savePublicPreset(lastGeneratedCharacterData);
                alert('Character shared successfully!');
                elements.sharePresetBtn.textContent = 'Shared!';
            } catch (error) {
                console.error("Failed to share preset:", error);
                alert('There was an error sharing your character.');
                elements.sharePresetBtn.disabled = false;
                elements.sharePresetBtn.textContent = 'Share Publicly';
            }
        }
    });

    elements.confirmCharacterBtn.addEventListener('click', () => {
        console.log("Starting a new game with generated character...");
        const gender = elements.dollImage.src.includes('female') ? 'female' : 'male';
        const wornItems = Array.from(elements.dollContainer.querySelectorAll('.worn-item')).map(item => item.alt);
        replayService.recordEvent('new_game_started', {
            character: {
                gender,
                items: wornItems,
                generatedImage: elements.generatedCharacterImage.src
            },
            timestamp: Date.now()
        });
        
        // Reset for next creation
        hideScreen(elements.generationResultScreen);
        showScreen(elements.mainContainer);
        clearWornItems(elements.dollContainer);
        elements.sharePresetBtn.disabled = false;
        elements.sharePresetBtn.textContent = 'Share Publicly';
    });

    elements.continueGameBtn.addEventListener('click', () => {
        console.log("Continuing game...");
        replayService.recordEvent('game_continued', { timestamp: Date.now() });
        console.log('Current Replay Data:', replayService.getReplayData());
    });

    replayService.recordEvent('main_menu_loaded', { resolution: `${window.innerWidth}x${window.innerHeight}` });
});