function makeInteractive(element, dollContainer) {
    let activeTouches = new Map();
    let initialDist = 1;
    let initialWidth = element.offsetWidth;

    const pointerDown = (e) => {
        element.setPointerCapture(e.pointerId);
        activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activeTouches.size === 2) {
            const touches = Array.from(activeTouches.values());
            initialDist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
            initialWidth = element.offsetWidth;
        }
    };

    const pointerMove = (e) => {
        if (!activeTouches.has(e.pointerId)) return;

        activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const touches = Array.from(activeTouches.values());
        const dollRect = dollContainer.getBoundingClientRect();

        if (touches.length === 1) { // Move
            element.style.left = `${e.clientX - dollRect.left - element.offsetWidth / 2}px`;
            element.style.top = `${e.clientY - dollRect.top - element.offsetHeight / 2}px`;
        } else if (touches.length === 2) { // Scale
            const currentDist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
            const scale = currentDist / initialDist;
            const newWidth = initialWidth * scale;
            element.style.width = `${newWidth}px`;
            element.style.height = 'auto'; // Maintain aspect ratio
        }
    };

    const pointerUp = (e) => {
        activeTouches.delete(e.pointerId);
        if (activeTouches.size < 2) {
            initialDist = 1; // Reset for next interaction
        }
    };

    element.addEventListener('pointerdown', pointerDown);
    element.addEventListener('pointermove', pointerMove);
    element.addEventListener('pointerup', pointerUp);
    element.addEventListener('pointercancel', pointerUp);
    element.addEventListener('pointerleave', pointerUp);
}


function createWornItem(src, itemType, alt, x, y, dollContainer, width = null) {
    const existingItem = dollContainer.querySelector(`.worn-item[data-item-type="${itemType}"]`);
    if (existingItem) {
        existingItem.remove();
    }

    const wornItem = document.createElement('img');
    wornItem.src = src;
    wornItem.alt = alt;
    wornItem.classList.add('worn-item');
    wornItem.dataset.itemType = itemType;

    wornItem.onload = () => {
        dollContainer.appendChild(wornItem);

        const itemInitialWidth = wornItem.offsetWidth;
        const itemInitialHeight = wornItem.offsetHeight;

        wornItem.style.left = `${x - itemInitialWidth / 2}px`;
        wornItem.style.top = `${y - itemInitialHeight / 2}px`;
        if (width) {
            wornItem.style.width = width;
            wornItem.style.height = 'auto';
        }

        makeInteractive(wornItem, dollContainer);
    };
}


export function initializeEditor(elements) {
    const { dollContainer, clothingItems, genderBtns, dollImage } = elements;

    // Gender Selection
    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const gender = btn.dataset.gender;
            dollImage.src = `${gender}_doll.png`;
            dollContainer.querySelectorAll('.worn-item').forEach(item => item.remove());
        });
    });

    // --- Desktop Drag and Drop ---
    clothingItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.src);
            e.dataTransfer.setData('text/item-type', e.target.dataset.itemType);
            e.dataTransfer.setData('text/alt', e.target.alt);
        });
    });

    dollContainer.addEventListener('dragover', (e) => e.preventDefault());

    dollContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const src = e.dataTransfer.getData('text/plain');
        const itemType = e.dataTransfer.getData('text/item-type');
        const alt = e.dataTransfer.getData('text/alt');

        const dollRect = dollContainer.getBoundingClientRect();
        const x = e.clientX - dollRect.left;
        const y = e.clientY - dollRect.top;

        createWornItem(src, itemType, alt, x, y, dollContainer);
    });

    // --- Mobile Drag and Drop ---
    let draggedItem = null;
    let draggedItemClone = null;

    clothingItems.forEach(item => {
        item.addEventListener('touchstart', (e) => {
            e.preventDefault();
            draggedItem = e.target;
            draggedItemClone = draggedItem.cloneNode(true);
            draggedItemClone.classList.add('dragging-clone');
            document.body.appendChild(draggedItemClone);
            moveClone(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
    });

    document.addEventListener('touchmove', (e) => {
        if (!draggedItemClone) return;
        e.preventDefault();
        moveClone(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!draggedItem || !draggedItemClone) {
            if (draggedItemClone) draggedItemClone.remove();
            draggedItem = null;
            draggedItemClone = null;
            return;
        }

        const touch = e.changedTouches[0];
        draggedItemClone.style.display = 'none';
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        draggedItemClone.style.display = '';

        if (dollContainer.contains(dropTarget)) {
            const { src, dataset: { itemType }, alt } = draggedItem;
            const dollRect = dollContainer.getBoundingClientRect();
            const x = touch.clientX - dollRect.left;
            const y = touch.clientY - dollRect.top;
            createWornItem(src, itemType, alt, x, y, dollContainer);
        }

        draggedItemClone.remove();
        draggedItem = null;
        draggedItemClone = null;
    });

    function moveClone(x, y) {
        if (draggedItemClone) {
            draggedItemClone.style.left = `${x - draggedItemClone.width / 2}px`;
            draggedItemClone.style.top = `${y - draggedItemClone.height / 2}px`;
        }
    }
}

export function getCharacterData(dollImage, dollContainer) {
    const wornItems = Array.from(dollContainer.querySelectorAll('.worn-item')).map(item => ({
        src: item.getAttribute('src'), // Use getAttribute to get original src
        alt: item.alt,
        itemType: item.dataset.itemType,
        style: {
            left: item.style.left,
            top: item.style.top,
            width: item.style.width,
        }
    }));

    return {
        gender: dollImage.src.includes('female') ? 'female' : 'male',
        wornItems: wornItems
    };
}

export function clearWornItems(dollContainer) {
     dollContainer.querySelectorAll('.worn-item').forEach(item => item.remove());
}


export function applyCharacterData(preset, dollContainer, dollImage) {
    clearWornItems(dollContainer);

    const gender = preset.gender || 'female';
    dollImage.src = `${gender}_doll.png`;
    
    // Ensure gender buttons reflect the change
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gender === gender);
    });

    if (preset.wornItems) {
        preset.wornItems.forEach(itemData => {
            const dollRect = dollContainer.getBoundingClientRect();
            // We create the item at the center, then its onload function will position it.
            // This is simpler than trying to calculate relative positions here.
            
            const wornItem = document.createElement('img');
            wornItem.src = itemData.src;
            wornItem.alt = itemData.alt;
            wornItem.classList.add('worn-item');
            wornItem.dataset.itemType = itemData.itemType;
        
            wornItem.onload = () => {
                dollContainer.appendChild(wornItem);
                wornItem.style.left = itemData.style.left;
                wornItem.style.top = itemData.style.top;
                wornItem.style.width = itemData.style.width;
                wornItem.style.height = 'auto';
                makeInteractive(wornItem, dollContainer);
            };
        });
    }
}