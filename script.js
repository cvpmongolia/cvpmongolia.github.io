// ============================================
// TRADING HELPER - MAIN SCRIPT
// ============================================

// Storage key for localStorage
const STORAGE_KEY = 'tradingHelperState';

// Unique ID counter for icons
let iconIdCounter = 0;

// Store expectation answers for each ticker
const tickerExpectations = {};

// Current ticker being questioned
let currentQuestionTicker = null;

// Configuration: Define your tickers here
const tickers = [
  { ticker: 'nq', fullName: 'Nasdaq (NQ)', color: '#87CEEB', checked: true }, // Sky blue
  { ticker: 'es', fullName: 'S&P 500 (ES)', color: '#7a5bb9ff', checked: false }, // Purple
  { ticker: 'gc', fullName: 'Gold (GC)', color: '#FFD700', checked: true }, // Golden yellow
  { ticker: '6e', fullName: 'Euro/USD (6E)', color: '#16a216ff', checked: true }, // Green
  { ticker: 'btc', fullName: 'Bitcoin (BTC)', color: '#e5830bff', checked: false }, // Orange
  { ticker: 'cl', fullName: 'Crude Oil (CL)', color: '#2F4F4F', checked: false } // Dark slate gray (darker than pure black for visibility)
];

// Initialize tables on page load
document.addEventListener('DOMContentLoaded', () => {
  loadState(); // Load saved state first
  initializeCheckboxes();
  initializeTables();
  setupDragAndDrop();
  setupHeaderToggle();
  setupClearMemoryButton();
  setupExpectationButtons();
  restoreIcons(); // Restore icons after tables are created
  restoreExpectationStates(); // Restore expectation UI states
  startSessionTimer(); // Start the trading session countdown
  setupBannerClose(); // Setup banner close button
  startTimestampUpdater(); // Start periodic timestamp updates
});

// ============================================
// HEADER TOGGLE FUNCTIONALITY
// ============================================

function setupHeaderToggle() {
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const headerSection = document.getElementById('header-section');
  
  minimizeBtn.addEventListener('click', () => {
    headerSection.classList.add('hidden');
    maximizeBtn.classList.remove('hidden');
  });
  
  maximizeBtn.addEventListener('click', () => {
    headerSection.classList.remove('hidden');
    maximizeBtn.classList.add('hidden');
  });
}

// ============================================
// CLEAR MEMORY FUNCTIONALITY
// ============================================

function setupClearMemoryButton() {
  const clearMemoryBtn = document.getElementById('clear-memory-btn');
  const confirmModal = document.getElementById('confirm-modal');
  const modalOkBtn = document.getElementById('modal-ok-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  
  // Show confirmation modal when clear button is clicked
  clearMemoryBtn.addEventListener('click', () => {
    confirmModal.classList.remove('hidden');
  });
  
  // Cancel - just close modal
  modalCancelBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
  });
  
  // OK - clear localStorage and reload
  modalOkBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
  
  // Close modal when clicking outside
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      confirmModal.classList.add('hidden');
    }
  });
}

// ============================================
// CHECKBOX INITIALIZATION
// ============================================

function initializeCheckboxes() {
  const checkboxContainer = document.getElementById('ticker-checkboxes');
  
  tickers.forEach(ticker => {
    const wrapper = document.createElement('label');
    wrapper.className = 'flex items-center gap-2 cursor-pointer';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = ticker.checked;
    checkbox.className = 'w-4 h-4 cursor-pointer';
    checkbox.setAttribute('data-ticker', ticker.ticker);
    
    checkbox.addEventListener('change', () => {
      ticker.checked = checkbox.checked;
      saveTickerStates(); // Save only ticker states, not icons
      initializeTables();
      restoreIcons(); // Restore icons after table recreation
      restoreExpectationStates(); // Restore expectation UI states after table recreation
    });
    
    const label = document.createElement('span');
    label.className = 'text-white font-semibold';
    label.style.color = ticker.color;
    label.textContent = ticker.ticker.toUpperCase();
    
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    checkboxContainer.appendChild(wrapper);
  });
}

// ============================================
// TABLE INITIALIZATION
// ============================================

function initializeTables() {
  const container = document.getElementById('tables-container');
  
  // Clear existing tables
  container.innerHTML = '';
  
  // Filter only checked tickers
  const checkedTickers = tickers.filter(t => t.checked);
  
  // Create and append tables for each checked ticker
  checkedTickers.forEach((config, index) => {
    const table = new TradingTable(config.ticker, config.fullName, config.color);
    const tableElement = table.render();
    
    // Remove bottom margin from last table
    if (index === checkedTickers.length - 1) {
      tableElement.classList.remove('mb-8');
    }
    
    container.appendChild(tableElement);
  });
}

// ============================================
// DRAG AND DROP FUNCTIONALITY
// ============================================

let draggedIconType = null;
let draggedElement = null;
let isDraggingFromCell = false;

function setupDragAndDrop() {
  // Setup drag listeners for icon items in panel
  document.querySelectorAll('.icon-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedIconType = e.target.getAttribute('data-icon');
      draggedElement = null;
      isDraggingFromCell = false;
      e.dataTransfer.effectAllowed = 'copy';
    });

    item.addEventListener('dragend', () => {
      draggedIconType = null;
      draggedElement = null;
      isDraggingFromCell = false;
    });
  });

  // Setup drop zones (using event delegation for dynamically created tables)
  document.addEventListener('dragover', (e) => {
    if (e.target.classList.contains('drop-zone')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = isDraggingFromCell ? 'move' : 'copy';
      e.target.classList.add('bg-white/40');
    }
  });

  document.addEventListener('dragleave', (e) => {
    if (e.target.classList.contains('drop-zone')) {
      e.target.classList.remove('bg-white/40');
    }
  });

  document.addEventListener('drop', (e) => {
    if (e.target.classList.contains('drop-zone')) {
      e.preventDefault();
      e.target.classList.remove('bg-white/40');
      
      if (draggedIconType) {
        // If dragging from another cell, move the element
        if (isDraggingFromCell && draggedElement) {
          e.target.appendChild(draggedElement);
          saveState(); // Save after moving
          
          // Update ticker timestamp
          const cellId = e.target.getAttribute('data-cell');
          if (cellId) {
            const ticker = cellId.split('-')[0];
            updateTickerTimestamp(ticker);
          }
        } else {
          // If dragging from panel, create new icon element
          createDroppedIcon(e.target, draggedIconType);
          saveState(); // Save after creating
          
          // Update ticker timestamp
          const cellId = e.target.getAttribute('data-cell');
          if (cellId) {
            const ticker = cellId.split('-')[0];
            updateTickerTimestamp(ticker);
          }
        }
      }
    }
  });
}

// Function to make dropped icons draggable
function makeIconDraggable(iconWrapper) {
  iconWrapper.setAttribute('draggable', 'true');
  
  iconWrapper.addEventListener('dragstart', (e) => {
    draggedIconType = iconWrapper.getAttribute('data-icon-type');
    draggedElement = iconWrapper;
    isDraggingFromCell = true;
    e.dataTransfer.effectAllowed = 'move';
    iconWrapper.style.opacity = '0.5';
  });
  
  iconWrapper.addEventListener('dragend', (e) => {
    iconWrapper.style.opacity = '1';
    draggedIconType = null;
    draggedElement = null;
    isDraggingFromCell = false;
  });
}

// Create a dropped icon in a cell
function createDroppedIcon(zone, iconType, iconId = null, tradeState = 'none') {
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'dropped-icon relative inline-block mr-1 mb-1 cursor-grab active:cursor-grabbing transition-all duration-300';
  iconWrapper.setAttribute('data-icon-type', iconType);
  iconWrapper.setAttribute('data-icon-id', iconId || `icon-${iconIdCounter++}`);
  iconWrapper.setAttribute('data-trade-state', tradeState);
  
  const img = document.createElement('img');
  img.src = `./assets/${iconType}.png`;
  img.className = 'w-12 h-12 transition-transform duration-200 hover:scale-110';
  img.alt = iconType;
  
  // Create delete button (initially hidden)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 transition-opacity flex items-center justify-center text-xs font-bold shadow-lg z-10';
  deleteBtn.innerHTML = '×';
  deleteBtn.style.fontSize = '18px';
  
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Get the cell ID before removing the icon
    const cellId = iconWrapper.closest('.drop-zone')?.getAttribute('data-cell');
    
    // Re-enable pointer events on all sibling icons before removing
    const parentCell = iconWrapper.parentElement;
    if (parentCell) {
      const siblings = parentCell.querySelectorAll('.dropped-icon');
      siblings.forEach(sibling => {
        sibling.style.pointerEvents = 'auto';
      });
    }
    
    iconWrapper.remove();
    saveState(); // Save after deletion
    
    // Update ticker timestamp
    if (cellId) {
      const ticker = cellId.split('-')[0];
      updateTickerTimestamp(ticker);
    }
  });

  // Create BUY/SELL buttons container
  const actionButtons = document.createElement('div');
  actionButtons.className = 'action-buttons absolute -bottom-7 left-0 right-0 flex gap-1 opacity-0 transition-opacity';
  
  // BUY button
  const buyBtn = document.createElement('button');
  buyBtn.className = 'flex-1 px-2 py-1 text-xs font-bold text-white rounded transition-all';
  buyBtn.textContent = 'BUY';
  buyBtn.style.backgroundColor = '#4CAF50'; // Bright green (inactive)
  
  buyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTradeState(iconWrapper, 'buy');
    updateActionButtonsAppearance(iconWrapper, buyBtn, sellBtn);
    
    // Update ticker timestamp
    const cellId = iconWrapper.closest('.drop-zone')?.getAttribute('data-cell');
    if (cellId) {
      const ticker = cellId.split('-')[0];
      updateTickerTimestamp(ticker);
    }
  });
  
  // SELL button
  const sellBtn = document.createElement('button');
  sellBtn.className = 'flex-1 px-2 py-1 text-xs font-bold text-white rounded transition-all';
  sellBtn.textContent = 'SELL';
  sellBtn.style.backgroundColor = '#EF5350'; // Bright red (inactive)
  
  sellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTradeState(iconWrapper, 'sell');
    updateActionButtonsAppearance(iconWrapper, buyBtn, sellBtn);
    
    // Update ticker timestamp
    const cellId = iconWrapper.closest('.drop-zone')?.getAttribute('data-cell');
    if (cellId) {
      const ticker = cellId.split('-')[0];
      updateTickerTimestamp(ticker);
    }
  });
  
  actionButtons.appendChild(buyBtn);
  actionButtons.appendChild(sellBtn);

  iconWrapper.appendChild(img);
  iconWrapper.appendChild(deleteBtn);
  iconWrapper.appendChild(actionButtons);
  zone.appendChild(iconWrapper);

  // Apply initial trade state
  if (tradeState !== 'none') {
    applyTradeStateVisual(iconWrapper, tradeState);
  }

  // Make the new icon draggable
  makeIconDraggable(iconWrapper);

  // Track if hovering over buttons
  let isHoveringButtons = false;

  // Show buttons on hover
  iconWrapper.addEventListener('mouseenter', () => {
    deleteBtn.classList.remove('opacity-0');
    deleteBtn.classList.add('opacity-100');
    actionButtons.classList.remove('opacity-0');
    actionButtons.classList.add('opacity-100');
    
    // Update button appearance based on state
    updateActionButtonsAppearance(iconWrapper, buyBtn, sellBtn);
  });

  iconWrapper.addEventListener('mouseleave', () => {
    // Only hide if not hovering over buttons
    if (!isHoveringButtons) {
      deleteBtn.classList.remove('opacity-100');
      deleteBtn.classList.add('opacity-0');
      actionButtons.classList.remove('opacity-100');
      actionButtons.classList.add('opacity-0');
    }
  });

  // Keep buttons visible when hovering over them
  const buttonElements = [deleteBtn, actionButtons];
  buttonElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      isHoveringButtons = true;
      
      // Disable pointer events on sibling icons to prevent accidental hover
      const parentCell = iconWrapper.parentElement;
      if (parentCell) {
        const siblings = parentCell.querySelectorAll('.dropped-icon');
        siblings.forEach(sibling => {
          if (sibling !== iconWrapper) {
            sibling.style.pointerEvents = 'none';
          }
        });
      }
    });

    element.addEventListener('mouseleave', () => {
      isHoveringButtons = false;
      
      // Re-enable pointer events on all sibling icons
      const parentCell = iconWrapper.parentElement;
      if (parentCell) {
        const siblings = parentCell.querySelectorAll('.dropped-icon');
        siblings.forEach(sibling => {
          sibling.style.pointerEvents = 'auto';
        });
      }
      
      // Hide buttons when leaving button area
      deleteBtn.classList.remove('opacity-100');
      deleteBtn.classList.add('opacity-0');
      actionButtons.classList.remove('opacity-100');
      actionButtons.classList.add('opacity-0');
    });
  });
}

// Toggle trade state (buy/sell/none)
function toggleTradeState(iconWrapper, newState) {
  const currentState = iconWrapper.getAttribute('data-trade-state');
  
  if (currentState === newState) {
    // Clicking same button - reset to none
    iconWrapper.setAttribute('data-trade-state', 'none');
    iconWrapper.style.boxShadow = 'none';
  } else {
    // Set new state
    iconWrapper.setAttribute('data-trade-state', newState);
    applyTradeStateVisual(iconWrapper, newState);
  }
  
  saveState(); // Save after state change
}

// Apply visual effect for trade state
function applyTradeStateVisual(iconWrapper, state) {
  if (state === 'buy') {
    // Green glow for BUY
    iconWrapper.style.boxShadow = '0 0 12px 3px rgba(66, 161, 71, 0.6)';
  } else if (state === 'sell') {
    // Red glow for SELL
    iconWrapper.style.boxShadow = '0 0 12px 3px rgba(229, 57, 53, 0.6)';
  } else {
    iconWrapper.style.boxShadow = 'none';
  }
}

// Update button appearance based on current state
function updateActionButtonsAppearance(iconWrapper, buyBtn, sellBtn) {
  const state = iconWrapper.getAttribute('data-trade-state');
  
  if (state === 'buy') {
    buyBtn.style.backgroundColor = '#1b5e20'; // Much darker green (active)
    buyBtn.style.transform = 'scale(1.05)';
    sellBtn.style.backgroundColor = '#EF5350'; // Bright red (inactive)
    sellBtn.style.transform = 'scale(1)';
  } else if (state === 'sell') {
    buyBtn.style.backgroundColor = '#4CAF50'; // Bright green (inactive)
    buyBtn.style.transform = 'scale(1)';
    sellBtn.style.backgroundColor = '#8c1515ff'; // Much darker red (active)
    sellBtn.style.transform = 'scale(1.05)';
  } else {
    buyBtn.style.backgroundColor = '#4CAF50'; // Bright green (inactive)
    buyBtn.style.transform = 'scale(1)';
    sellBtn.style.backgroundColor = '#EF5350'; // Bright red (inactive)
    sellBtn.style.transform = 'scale(1)';
  }
}

// ============================================
// LOCAL STORAGE PERSISTENCE
// ============================================

// Save only ticker states (used during checkbox changes)
function saveTickerStates() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  let state = savedState ? JSON.parse(savedState) : { icons: [], tickerStates: {} };
  
  // Update only ticker states, preserve existing icons
  tickers.forEach(ticker => {
    state.tickerStates[ticker.ticker] = ticker.checked;
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Save current state to localStorage
function saveState() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  let existingState = savedState ? JSON.parse(savedState) : {};
  
  const state = {
    icons: [],
    tickerStates: {},
    tickerExpectations: tickerExpectations,
    tickerLastUpdated: existingState.tickerLastUpdated || {}
  };
  
  // Save ticker checkbox states
  tickers.forEach(ticker => {
    state.tickerStates[ticker.ticker] = ticker.checked;
  });
  
  // Save all dropped icons
  document.querySelectorAll('.dropped-icon').forEach(icon => {
    const parentCell = icon.parentElement;
    if (parentCell && parentCell.hasAttribute('data-cell')) {
      state.icons.push({
        id: icon.getAttribute('data-icon-id'),
        iconType: icon.getAttribute('data-icon-type'),
        cellId: parentCell.getAttribute('data-cell'),
        tradeState: icon.getAttribute('data-trade-state')
      });
    }
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Update timestamp for a specific ticker
function updateTickerTimestamp(ticker) {
  const savedState = localStorage.getItem(STORAGE_KEY);
  let state = savedState ? JSON.parse(savedState) : { icons: [], tickerStates: {}, tickerExpectations: {}, tickerLastUpdated: {} };
  
  if (!state.tickerLastUpdated) {
    state.tickerLastUpdated = {};
  }
  
  state.tickerLastUpdated[ticker] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  // Update the display immediately
  updateTimestampDisplay(ticker);
}

// Load state from localStorage
function loadState() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) return;
  
  try {
    const state = JSON.parse(savedState);
    
    // Restore ticker checkbox states
    if (state.tickerStates) {
      tickers.forEach(ticker => {
        if (state.tickerStates.hasOwnProperty(ticker.ticker)) {
          ticker.checked = state.tickerStates[ticker.ticker];
        }
      });
    }
    
    // Restore ticker expectations
    if (state.tickerExpectations) {
      Object.assign(tickerExpectations, state.tickerExpectations);
    }
    
    // Update iconIdCounter to prevent ID conflicts
    if (state.icons && state.icons.length > 0) {
      const maxId = Math.max(...state.icons.map(icon => {
        const match = icon.id.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      }));
      iconIdCounter = maxId + 1;
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
}

// Restore icons to their saved positions
function restoreIcons() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) return;
  
  try {
    const state = JSON.parse(savedState);
    
    // Restore icons
    if (state.icons && state.icons.length > 0) {
      state.icons.forEach(iconData => {
        const cell = document.querySelector(`[data-cell="${iconData.cellId}"]`);
        if (cell) {
          createDroppedIcon(cell, iconData.iconType, iconData.id, iconData.tradeState);
        }
      });
    }
  } catch (error) {
    console.error('Error restoring icons:', error);
  }
}

// Restore expectation UI state for saved expectations
function restoreExpectationStates() {
  // For each ticker that has saved expectations, update the UI
  Object.keys(tickerExpectations).forEach(ticker => {
    const buttonContainer = document.querySelector(`[data-button-container="${ticker}"]`);
    if (!buttonContainer) return;
    const showAdviceBtn = buttonContainer.querySelector('.show-advice-btn');
    const generateBtn = buttonContainer.querySelector('.generate-expectation-btn');
    const container = document.querySelector(`.expectation-details[data-ticker="${ticker}"]`);
    
    // Generate and populate the advice content (but keep it hidden)
    if (container) {
      const answers = tickerExpectations[ticker];
      const advice = generateAdvice(answers);
      
      // Build HTML for advice with minimize button and trash icon
      let html = `
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-white">Ерөнхий хүлээлт</h3>
          <div class="flex gap-2">
            <button class="minimize-advice-btn bg-slate-500 hover:bg-slate-600 text-white font-semibold py-1 px-4 rounded-lg shadow-md transition-all text-sm" data-ticker="${ticker}">
              Хураах
            </button>
            <button class="delete-advice-btn bg-red-600 hover:bg-red-700 text-white font-semibold p-2 rounded-lg shadow-md transition-all" data-ticker="${ticker}" title="Хүлээлт устгах">
              <img src="./assets/trash-bin.svg" alt="Delete" class="w-5 h-5">
            </button>
          </div>
        </div>
      `;
      
      // Priority 1 - Blue boxes (Big TF advice)
      if (advice.priority1.length > 0) {
        advice.priority1.forEach(item => {
          html += `
            <div class="mb-4 p-4 bg-blue-100 border-l-4 border-blue-600 rounded-r-lg shadow-lg">
              <h4 class="text-base font-bold text-blue-900 mb-2">${colorizeTimeframes(item.title)}</h4>
              <div class="text-gray-900 text-sm leading-relaxed whitespace-pre-line">${colorizeTimeframes(item.content)}</div>
            </div>
          `;
        });
      }
      
      // Priority 2 - Yellow boxes (Main TF advice)
      if (advice.priority2.length > 0) {
        advice.priority2.forEach(item => {
          html += `
            <div class="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-600 rounded-r-lg shadow-lg">
              <h4 class="text-base font-bold text-yellow-900 mb-2">${colorizeTimeframes(item.title)}</h4>
              <div class="text-gray-900 text-sm leading-relaxed whitespace-pre-line">${colorizeTimeframes(item.content)}</div>
            </div>
          `;
        });
      }
      
      container.innerHTML = html;
      
      // Add event listener for minimize button
      const minimizeBtn = container.querySelector('.minimize-advice-btn');
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
          hideAdviceContainer(ticker);
        });
      }
      
      // Add event listener for delete button (trash icon)
      const deleteBtn = container.querySelector('.delete-advice-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          showDeleteExpectationModal(ticker);
        });
      }
    }
    
    // Update show advice button with summary and make it visible
    if (showAdviceBtn) {
      updateShowAdviceButtonText(ticker, showAdviceBtn);
      showAdviceBtn.classList.remove('hidden');
    }
  });
}

// Format time difference for display
function formatTimeDifference(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} өдрийн өмнө өөрчилсөн`;
  } else if (hours > 0) {
    return `${hours} цагийн өмнө өөрчилсөн`;
  } else if (minutes > 0) {
    return `${minutes} минутын өмнө өөрчилсөн`;
  } else if (seconds > 0) {
    return `${seconds} секундын өмнө өөрчилсөн`;
  } else {
    return 'Дөнгөж сая өөрчилсөн';
  }
}

// Update timestamp display for a ticker
function updateTimestampDisplay(ticker) {
  const timestampElement = document.querySelector(`.ticker-timestamp[data-ticker="${ticker}"]`);
  if (!timestampElement) return;
  
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) return;
  
  try {
    const state = JSON.parse(savedState);
    if (state.tickerLastUpdated && state.tickerLastUpdated[ticker]) {
      const formattedTime = formatTimeDifference(state.tickerLastUpdated[ticker]);
      timestampElement.textContent = formattedTime;
    } else {
      timestampElement.textContent = '';
    }
  } catch (error) {
    console.error('Error updating timestamp display:', error);
  }
}

// Update all timestamp displays
function updateAllTimestampDisplays() {
  tickers.forEach(ticker => {
    if (ticker.checked) {
      updateTimestampDisplay(ticker.ticker);
    }
  });
}

// Start periodic timestamp updates
function startTimestampUpdater() {
  // Update immediately
  updateAllTimestampDisplays();
  
  // Update every 10 seconds
  setInterval(updateAllTimestampDisplays, 10000);
}

// ============================================
// EXPECTATION GENERATION FUNCTIONALITY
// ============================================

function setupExpectationButtons() {
  const questionsModal = document.getElementById('questions-modal');
  const cancelBtn = document.getElementById('questions-cancel-btn');
  const submitBtn = document.getElementById('questions-submit-btn');
  
  // Event delegation for show advice button
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('show-advice-btn')) {
      const ticker = e.target.getAttribute('data-ticker');
      showAdviceContainer(ticker);
    }
  });
  
  // Event delegation for delete ticker button
  document.addEventListener('click', (e) => {
    if (e.target.closest('.delete-ticker-btn')) {
      const ticker = e.target.closest('.delete-ticker-btn').getAttribute('data-ticker');
      showDeleteTickerModal(ticker);
    }
  });
  
  // Event delegation for generate expectation buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('generate-expectation-btn')) {
      const ticker = e.target.getAttribute('data-ticker');
      currentQuestionTicker = ticker;
      
      // Set dynamic modal title
      const modalTitle = document.getElementById('questions-modal-title');
      const tickerConfig = tickers.find(t => t.ticker === ticker);
      const tickerName = tickerConfig ? tickerConfig.ticker.toUpperCase() : ticker.toUpperCase();
      const tickerColor = tickerConfig ? tickerConfig.color : '#FFFFFF';
      modalTitle.innerHTML = `<span style="color: ${tickerColor}; font-weight: bold;">${tickerName}</span> тикерийн Ерөнхий хүлээлт гаргах`;
      
      // Reset radio buttons
      questionsModal.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
      });
      
      // Load existing answers if available
      if (tickerExpectations[ticker]) {
        const answers = tickerExpectations[ticker];
        if (answers.q1 !== undefined) {
          questionsModal.querySelector(`input[name="q1"][value="${answers.q1 ? 'yes' : 'no'}"]`).checked = true;
        }
        if (answers.q2 !== undefined) {
          questionsModal.querySelector(`input[name="q2"][value="${answers.q2 ? 'yes' : 'no'}"]`).checked = true;
        }
        if (answers.q3 !== undefined) {
          questionsModal.querySelector(`input[name="q3"][value="${answers.q3 ? 'yes' : 'no'}"]`).checked = true;
        }
        if (answers.q4 !== undefined) {
          questionsModal.querySelector(`input[name="q4"][value="${answers.q4 ? 'yes' : 'no'}"]`).checked = true;
        }
      }
      
      questionsModal.classList.remove('hidden');
    }
  });
  
  // Cancel button
  cancelBtn.addEventListener('click', () => {
    questionsModal.classList.add('hidden');
    currentQuestionTicker = null;
  });
  
  // Close modal when clicking outside
  questionsModal.addEventListener('click', (e) => {
    if (e.target === questionsModal) {
      questionsModal.classList.add('hidden');
      currentQuestionTicker = null;
    }
  });
  
  // Submit button
  submitBtn.addEventListener('click', () => {
    if (!currentQuestionTicker) return;
    
    // Collect answers
    const answers = {
      q1: questionsModal.querySelector('input[name="q1"]:checked')?.value === 'yes',
      q2: questionsModal.querySelector('input[name="q2"]:checked')?.value === 'yes',
      q3: questionsModal.querySelector('input[name="q3"]:checked')?.value === 'yes',
      q4: questionsModal.querySelector('input[name="q4"]:checked')?.value === 'yes'
    };
    
    // Check if all questions are answered
    const allAnswered = ['q1', 'q2', 'q3', 'q4'].every(q => 
      questionsModal.querySelector(`input[name="${q}"]:checked`) !== null
    );
    
    if (!allAnswered) {
      alert('Бүх асуултад хариулна уу (Асуулт 1-4).');
      return;
    }
    
    // Store answers
    tickerExpectations[currentQuestionTicker] = answers;
    
    // Save to localStorage
    saveState();
    
    // Update ticker timestamp
    updateTickerTimestamp(currentQuestionTicker);
    
    // Update the expectation details container
    updateExpectationDetails(currentQuestionTicker, answers);
    
    // Close modal
    questionsModal.classList.add('hidden');
    currentQuestionTicker = null;
  });
}

function updateExpectationDetails(ticker, answers) {
  const container = document.querySelector(`.expectation-details[data-ticker="${ticker}"]`);
  if (!container) return;
  
  // Generate advice using the external function
  const advice = generateAdvice(answers);
  
  // Build HTML for advice with minimize button and trash icon
  let html = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-white">Ерөнхий хүлээлт</h3>
      <div class="flex gap-2">
        <button class="minimize-advice-btn bg-slate-500 hover:bg-slate-600 text-white font-semibold py-1 px-4 rounded-lg shadow-md transition-all text-sm" data-ticker="${ticker}">
          Хураах
        </button>
        <button class="delete-advice-btn bg-red-600 hover:bg-red-700 text-white font-semibold p-2 rounded-lg shadow-md transition-all" data-ticker="${ticker}" title="Хүлээлт устгах">
          <img src="./assets/trash-bin.svg" alt="Delete" class="w-5 h-5">
        </button>
      </div>
    </div>
  `;
  
  // Priority 1 - Blue boxes (Big TF advice)
  if (advice.priority1.length > 0) {
    advice.priority1.forEach(item => {
      html += `
        <div class="mb-4 p-4 bg-blue-100 border-l-4 border-blue-600 rounded-r-lg shadow-lg">
          <h4 class="text-base font-bold text-blue-900 mb-2">${colorizeTimeframes(item.title)}</h4>
          <div class="text-gray-900 text-sm leading-relaxed whitespace-pre-line">${colorizeTimeframes(item.content)}</div>
        </div>
      `;
    });
  }
  
  // Priority 2 - Yellow boxes (Main TF advice)
  if (advice.priority2.length > 0) {
    advice.priority2.forEach(item => {
      html += `
        <div class="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-600 rounded-r-lg shadow-lg">
          <h4 class="text-base font-bold text-yellow-900 mb-2">${colorizeTimeframes(item.title)}</h4>
          <div class="text-gray-900 text-sm leading-relaxed whitespace-pre-line">${colorizeTimeframes(item.content)}</div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html;
  
  // Show the container with animation
  showAdviceContainer(ticker);
  
  // Add event listener for minimize button
  const minimizeBtn = container.querySelector('.minimize-advice-btn');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      hideAdviceContainer(ticker);
    });
  }
  
  // Add event listener for delete button (trash icon)
  const deleteBtn = container.querySelector('.delete-advice-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      showDeleteExpectationModal(ticker);
    });
  }
}

function showAdviceContainer(ticker) {
  const container = document.querySelector(`.expectation-details[data-ticker="${ticker}"]`);
  const buttonContainer = document.querySelector(`[data-button-container="${ticker}"]`);
  const showAdviceBtn = buttonContainer?.querySelector('.show-advice-btn');
  const generateBtn = buttonContainer?.querySelector('.generate-expectation-btn');
  
  if (!container) return;
  
  // Show container and animate
  container.classList.remove('hidden');
  // Use setTimeout to allow the hidden class to be removed before setting maxHeight
  setTimeout(() => {
    container.style.maxHeight = container.scrollHeight + 'px';
  }, 10);
  
  // Hide show advice button
  if (showAdviceBtn) showAdviceBtn.classList.add('hidden');
  
  // Update generate button styling and text
  if (generateBtn) {
    generateBtn.textContent = 'Ерөнхий хүлээлт өөрчлөх';
    generateBtn.classList.remove('bg-white/20', 'hover:bg-white/30');
    generateBtn.classList.add('bg-sky-600', 'hover:bg-sky-700', 'shadow-md');
  }
}

function hideAdviceContainer(ticker) {
  const container = document.querySelector(`.expectation-details[data-ticker="${ticker}"]`);
  const buttonContainer = document.querySelector(`[data-button-container="${ticker}"]`);
  const showAdviceBtn = buttonContainer?.querySelector('.show-advice-btn');
  const generateBtn = buttonContainer?.querySelector('.generate-expectation-btn');
  
  if (!container) return;
  
  // Animate out
  container.style.maxHeight = '0';
  
  // After animation, hide container
  setTimeout(() => {
    container.classList.add('hidden');
  }, 300);
  
  // Update button text with answer summary
  updateShowAdviceButtonText(ticker, showAdviceBtn);
  
  // Reset generate button styling and text
  if (generateBtn) {
    generateBtn.textContent = 'Ерөнхий хүлээлт гаргах';
    generateBtn.classList.remove('bg-sky-600', 'hover:bg-sky-700', 'shadow-md');
    generateBtn.classList.add('bg-white/20', 'hover:bg-white/30');
  }
  
  // Show the green "show advice" button after animation completes
  setTimeout(() => {
    if (showAdviceBtn) showAdviceBtn.classList.remove('hidden');
  }, 300);
}

function updateShowAdviceButtonText(ticker, showAdviceBtn) {
  if (!showAdviceBtn) return;
  
  const answers = tickerExpectations[ticker];
  if (!answers) {
    showAdviceBtn.textContent = 'Ерөнхий хүлээлтийн зөвлөмж харах';
    return;
  }
  
  // Build answer summary (Q1=W, Q3=D, Q4=H4/H1)
  const q1Status = answers.q1 ? '✅' : '🚫';
  const q3Status = answers.q3 ? '✅' : '🚫';
  const q4Status = answers.q4 ? '✅' : '🚫';
  
  showAdviceBtn.textContent = `Хүлээлтийн зөвлөмж харах (W${q1Status}, D${q3Status}, H4/H1${q4Status})`;
}

function deleteExpectation(ticker) {
  // Remove answers from storage
  delete tickerExpectations[ticker];
  
  // Save to localStorage
  saveState();
  
  // Get UI elements
  const container = document.querySelector(`.expectation-details[data-ticker="${ticker}"]`);
  const buttonContainer = document.querySelector(`[data-button-container="${ticker}"]`);
  const showAdviceBtn = buttonContainer?.querySelector('.show-advice-btn');
  const generateBtn = buttonContainer?.querySelector('.generate-expectation-btn');
  
  if (!container) return;
  
  // Animate out
  container.style.maxHeight = '0';
  
  // After animation, hide container and reset UI
  setTimeout(() => {
    container.classList.add('hidden');
    container.innerHTML = ''; // Clear content
    
    // Hide show advice button
    if (showAdviceBtn) {
      showAdviceBtn.classList.add('hidden');
      showAdviceBtn.textContent = 'Ерөнхий хүлээлтийн зөвлөмж харах';
    }
    
    // Reset generate button styling and text
    if (generateBtn) {
      generateBtn.textContent = 'Ерөнхий хүлээлт гаргах';
      generateBtn.classList.remove('bg-sky-600', 'hover:bg-sky-700', 'shadow-md');
      generateBtn.classList.add('bg-white/20', 'hover:bg-white/30');
    }
  }, 300);
}

function showDeleteExpectationModal(ticker) {
  const modal = document.getElementById('delete-expectation-modal');
  const titleElement = document.getElementById('delete-expectation-title');
  const okBtn = document.getElementById('delete-expectation-ok-btn');
  const cancelBtn = document.getElementById('delete-expectation-cancel-btn');
  
  // Find ticker config to get full name and color
  const tickerConfig = tickers.find(t => t.ticker === ticker);
  const tickerName = tickerConfig ? tickerConfig.ticker.toUpperCase() : ticker.toUpperCase();
  const tickerColor = tickerConfig ? tickerConfig.color : '#FFFFFF';
  
  // Set dynamic title with colored ticker name
  titleElement.innerHTML = `Та <span style="color: ${tickerColor}; font-weight: bold;">${tickerName}</span> тикерийн ерөнхий хүлээлтийг устгах гэж байна.`;
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Remove old listeners by cloning buttons
  const newOkBtn = okBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // Add new listeners
  newOkBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    deleteExpectation(ticker);
  });
  
  newCancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  
  // Close on outside click
  const handleOutsideClick = (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.removeEventListener('click', handleOutsideClick);
    }
  };
  
  modal.addEventListener('click', handleOutsideClick);
}

function showDeleteTickerModal(ticker) {
  const modal = document.getElementById('delete-ticker-modal');
  const titleElement = document.getElementById('delete-ticker-title');
  const okBtn = document.getElementById('delete-ticker-ok-btn');
  const cancelBtn = document.getElementById('delete-ticker-cancel-btn');
  
  // Find ticker config to get full name and color
  const tickerConfig = tickers.find(t => t.ticker === ticker);
  const tickerName = tickerConfig ? tickerConfig.fullName : ticker.toUpperCase();
  const tickerColor = tickerConfig ? tickerConfig.color : '#FFFFFF';
  
  // Set dynamic title with colored ticker name
  titleElement.innerHTML = `<span style="color: ${tickerColor}; font-weight: bold;">${tickerName}</span> тикерийн ажлын талбарыг цэвэрлэх`;
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Remove old listeners by cloning buttons
  const newOkBtn = okBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // Add new listeners
  newOkBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    deleteTickerData(ticker);
  });
  
  newCancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  
  // Close on outside click
  const handleOutsideClick = (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.removeEventListener('click', handleOutsideClick);
    }
  };
  
  modal.addEventListener('click', handleOutsideClick);
}

function deleteTickerData(ticker) {
  // Get current state from localStorage
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) {
    location.reload();
    return;
  }
  
  try {
    const state = JSON.parse(savedState);
    
    // Remove ticker expectations
    if (state.tickerExpectations && state.tickerExpectations[ticker]) {
      delete state.tickerExpectations[ticker];
    }
    
    // Remove ticker timestamp
    if (state.tickerLastUpdated && state.tickerLastUpdated[ticker]) {
      delete state.tickerLastUpdated[ticker];
    }
    
    // Remove all icons associated with this ticker
    if (state.icons && state.icons.length > 0) {
      state.icons = state.icons.filter(icon => {
        // Check if the icon's cellId starts with this ticker
        return !icon.cellId.startsWith(`${ticker}-`);
      });
    }
    
    // Save updated state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Reload page to reflect changes
    location.reload();
  } catch (error) {
    console.error('Error deleting ticker data:', error);
    location.reload();
  }
}

// ============================================
// TRADING SESSION TIMER
// ============================================

function setupBannerClose() {
  const closeBtn = document.getElementById('close-banner-btn');
  const banner = document.getElementById('session-banner');
  const clearMemoryBtn = document.getElementById('clear-memory-btn');
  const leftPanel = document.querySelector('.left-icon-panel');
  
  if (closeBtn && banner) {
    closeBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      document.body.style.paddingTop = '0';
      
      // Adjust positions of other fixed elements
      if (clearMemoryBtn) {
        clearMemoryBtn.classList.remove('top-12');
        clearMemoryBtn.classList.add('top-4');
      }
      if (leftPanel) {
        leftPanel.classList.remove('top-8');
        leftPanel.classList.remove('h-[calc(100vh-32px)]');
        leftPanel.classList.add('top-0');
        leftPanel.classList.add('h-screen');
      }
    });
  }
}

function getChicagoTime() {
  // Get current time and convert to Chicago timezone properly
  const now = new Date();
  
  // Get Chicago time using proper timezone conversion
  // This creates a date formatter that outputs in Chicago timezone
  const chicagoTimeString = now.toLocaleString('en-US', { 
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse the Chicago time string components
  // Format: "MM/DD/YYYY, HH:mm:ss"
  const [datePart, timePart] = chicagoTimeString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  
  // Create a date object representing this exact time
  // We'll use this to get hours, minutes, seconds in Chicago time
  return {
    hours: parseInt(hours),
    minutes: parseInt(minutes),
    seconds: parseInt(seconds),
    date: parseInt(day),
    month: parseInt(month),
    year: parseInt(year)
  };
}

function formatTimeRemaining(hours, minutes, seconds) {
  let parts = [];
  if (hours > 0) parts.push(`${hours} цаг`);
  if (minutes > 0) parts.push(`${minutes} минут`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} секунд`);
  return parts.join(' ');
}

function getSessionStatus() {
  const chicagoTime = getChicagoTime();
  const hours = chicagoTime.hours;
  const minutes = chicagoTime.minutes;
  const seconds = chicagoTime.seconds;
  const currentTimeInMinutes = hours * 60 + minutes + seconds / 60;
  
  // Europe session: 2:00 AM - 6:00 AM (120 - 360 minutes)
  const euStart = 2 * 60; // 2:00 AM
  const euEnd = 6 * 60; // 6:00 AM
  
  // US session: 8:30 AM - 4:00 PM (510 - 960 minutes)
  const usStart = 8 * 60 + 30; // 8:30 AM
  const usEnd = 16 * 60; // 4:00 PM
  
  let message = '';
  
  if (currentTimeInMinutes >= euStart && currentTimeInMinutes < euEnd) {
    // During EU session
    const euOpenedMinutes = currentTimeInMinutes - euStart;
    const euOpenedHours = Math.floor(euOpenedMinutes / 60);
    const euOpenedMins = Math.floor(euOpenedMinutes % 60);
    
    const usStartMinutes = usStart - currentTimeInMinutes;
    const usStartHours = Math.floor(usStartMinutes / 60);
    const usStartMins = Math.floor(usStartMinutes % 60);
    const usStartSecs = Math.floor((usStartMinutes % 1) * 60);
    
    if (euOpenedHours > 0) {
      message = `Europe session ${euOpenedHours} цаг ${euOpenedMins} минутын өмнө нээгдсэн байна. `;
    } else {
      message = `Europe session ${euOpenedMins} минутын өмнө нээгдсэн байна. `;
    }
    message += `Америк session нээгдэхэд ${formatTimeRemaining(usStartHours, usStartMins, usStartSecs)} үлдлээ.`;
    
  } else if (currentTimeInMinutes >= usStart && currentTimeInMinutes < usEnd) {
    // During US session
    const usOpenedMinutes = currentTimeInMinutes - usStart;
    const usOpenedHours = Math.floor(usOpenedMinutes / 60);
    const usOpenedMins = Math.floor(usOpenedMinutes % 60);
    
    const usCloseMinutes = usEnd - currentTimeInMinutes;
    const usCloseHours = Math.floor(usCloseMinutes / 60);
    const usCloseMins = Math.floor(usCloseMinutes % 60);
    const usCloseSecs = Math.floor((usCloseMinutes % 1) * 60);
    
    // Calculate time until next EU session (tomorrow at 2 AM)
    let nextEuStart = euStart + (24 * 60); // Next day 2 AM
    const euNextMinutes = nextEuStart - currentTimeInMinutes;
    const euNextHours = Math.floor(euNextMinutes / 60);
    
    if (usOpenedHours > 0) {
      message = `Америк session ${usOpenedHours} цаг ${usOpenedMins} минутын өмнө нээгдсэн байна. `;
    } else {
      message = `Америк session ${usOpenedMins} минутын өмнө нээгдсэн байна. `;
    }
    message += `Хаагдахад ${formatTimeRemaining(usCloseHours, usCloseMins, usCloseSecs)} үлдлээ. `;
    message += `Europe session ${euNextHours} цагийн дараа нээгдэнэ.`;
    
  } else {
    // Before both sessions or between sessions or after US session
    let nextEuStart;
    
    if (currentTimeInMinutes < euStart) {
      // Before EU session (same day)
      nextEuStart = euStart - currentTimeInMinutes;
    } else if (currentTimeInMinutes >= euEnd && currentTimeInMinutes < usStart) {
      // Between EU and US session
      nextEuStart = (24 * 60) - currentTimeInMinutes + euStart; // Next day
    } else {
      // After US session
      nextEuStart = (24 * 60) - currentTimeInMinutes + euStart; // Next day
    }
    
    const euHours = Math.floor(nextEuStart / 60);
    const euMins = Math.floor(nextEuStart % 60);
    const euSecs = Math.floor((nextEuStart % 1) * 60);
    
    // Calculate time until US session start
    let nextUsStart;
    if (currentTimeInMinutes < usStart) {
      // Same day US session
      nextUsStart = usStart - currentTimeInMinutes;
    } else {
      // Next day US session
      nextUsStart = (24 * 60) - currentTimeInMinutes + usStart;
    }
    
    const usHours = Math.floor(nextUsStart / 60);
    const usMins = Math.floor(nextUsStart % 60);
    const usSecs = Math.floor((nextUsStart % 1) * 60);
    
    // Show closer session first
    if (nextUsStart < nextEuStart) {
      message = `Америк session нээгдэхэд ${formatTimeRemaining(usHours, usMins, usSecs)} үлдлээ. `;
      message += `Europe session нээгдэхэд ${formatTimeRemaining(euHours, euMins, euSecs)} үлдлээ.`;
    } else {
      message = `Europe session нээгдэхэд ${formatTimeRemaining(euHours, euMins, euSecs)} үлдлээ. `;
      message += `Америк session нээгдэхэд ${formatTimeRemaining(usHours, usMins, usSecs)} үлдлээ.`;
    }
  }
  
  return message;
}

function updateSessionBanner() {
  const bannerText = document.getElementById('session-banner-text');
  if (bannerText) {
    bannerText.textContent = getSessionStatus();
  }
}

function startSessionTimer() {
  updateSessionBanner(); // Initial update
  setInterval(updateSessionBanner, 1000); // Update every second
}
