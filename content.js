// Content Script for AI Assistant Extension

// AI popup elementi için değişkenler
let aiPopup = null;
let isPopupVisible = false;

// Sayfa yüklendiğinde çalışacak kod
(function() {
    'use strict';
    
    // Sayfa tamamen yüklendiğinde çalıştır
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        initializeExtension();
    }
    
    // Sayfa yüklendikten sonra da çalıştır (dinamik içerik için)
    window.addEventListener('load', () => {
        setTimeout(initializeExtension, 1000);
    });
    
    function initializeExtension() {
        // Metin seçimi event listener'ları kaldırıldı - sadece sağ tık menüsü kullanılacak
        
        // Background script'ten gelen mesajları dinle
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Content script received message:', request);
            
            if (request.action === 'showAIResponse') {
                console.log('Showing AI response popup');
                showAIPopup(request.response, request.originalText);
                sendResponse({success: true});
            } else if (request.action === 'showAIError') {
                console.log('Showing error popup');
                showErrorPopup(request.error);
                sendResponse({success: true});
            }
            
            return true; // Asenkron yanıt için
        });
        
        // Sayfa tıklandığında popup'ı gizle
        document.addEventListener('click', (e) => {
            if (aiPopup && !aiPopup.contains(e.target)) {
                hideAIPopup();
            }
        });
        
        // ESC tuşu ile popup'ı kapat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isPopupVisible) {
                hideAIPopup();
            }
        });
    }
})();

function handleTextSelection() {
    // AI butonunu kaldırdık, sadece sağ tık menüsü kullanılacak
    // Bu fonksiyon artık boş kalabilir
}

// AI buton fonksiyonları kaldırıldı - sadece sağ tık menüsü kullanılacak

function processSelectedText(text) {
    // Loading popup göster
    showLoadingPopup();
    
    // Background script'e mesaj gönder
    chrome.runtime.sendMessage({
        action: 'processText',
        text: text
    });
}

function showLoadingPopup() {
    hideAIPopup(); // Önceki popup'ı kaldır
    
    aiPopup = document.createElement('div');
    aiPopup.id = 'ai-assistant-popup';
    aiPopup.innerHTML = `
        <div class="ai-popup-header">
            <div class="ai-popup-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 3.94-3.04Z"/>
                </svg>
                AI Assistant
            </div>
            <button class="ai-popup-close">&times;</button>
        </div>
        <div class="ai-popup-content">
            <div class="ai-loading">
                <div class="loading-spinner"></div>
                <p>AI yanıtı hazırlanıyor...</p>
            </div>
        </div>
    `;
    
    // Popup stillerini ayarla
    aiPopup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 70vh;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: aiPopupSlideIn 0.3s ease-out;
    `;
    
    // Kapatma butonu olayı
    const closeBtn = aiPopup.querySelector('.ai-popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAIPopup);
    }
    
    document.body.appendChild(aiPopup);
    isPopupVisible = true;
    
    // Overlay ekle
    addOverlay();
}

function showAIPopup(response, originalText) {
    console.log('showAIPopup called with:', { response, originalText });
    
    hideAIPopup(); // Önceki popup'ı kaldır
    
    // Response'u güvenli hale getir
    const safeResponse = escapeHtml(response || '');
    const safeOriginalText = escapeHtml(originalText || '');
    
    aiPopup = document.createElement('div');
    aiPopup.id = 'ai-assistant-popup';
    aiPopup.innerHTML = `
        <div class="ai-popup-header">
            <div class="ai-popup-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 3.94-3.04Z"/>
                </svg>
                AI Assistant
            </div>
            <button class="ai-popup-close">&times;</button>
        </div>
        <div class="ai-popup-content">
            <div class="original-text">
                <strong>Seçili Metin:</strong>
                <p>"${safeOriginalText.length > 100 ? safeOriginalText.substring(0, 100) + '...' : safeOriginalText}"</p>
            </div>
            <div class="ai-response">
                <strong>AI Yanıtı:</strong>
                <div class="response-content">${safeResponse}</div>
            </div>
        </div>
    `;
    
    // Popup stillerini ayarla
    aiPopup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 70vh;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: aiPopupSlideIn 0.3s ease-out;
    `;
    
    // Kapatma butonu olayı
    const closeBtn = aiPopup.querySelector('.ai-popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAIPopup);
    }
    
    // Popup'ı body'ye ekle
    document.body.appendChild(aiPopup);
    isPopupVisible = true;
    
    console.log('Popup added to DOM, isPopupVisible:', isPopupVisible);
    
    // Overlay ekle
    addOverlay();
}

function showErrorPopup(error) {
    hideAIPopup(); // Önceki popup'ı kaldır

    let errorMessage = escapeHtml(error || 'Bilinmeyen hata');
    let helpMessage = 'Lütfen API anahtarınızı kontrol edin veya metni tekrar deneyin.';

    aiPopup = document.createElement('div');
    aiPopup.id = 'ai-assistant-popup';
    aiPopup.innerHTML = `
        <div class="ai-popup-header">
            <div class="ai-popup-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Hata
            </div>
            <button class="ai-popup-close">&times;</button>
        </div>
        <div class="ai-popup-content">
            <div class="error-message">
                <p>${errorMessage}</p>
                <p><small>${helpMessage}</small></p>
            </div>
        </div>
    `;
    
    // Popup stillerini ayarla (hata için kırmızı tema)
    aiPopup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 70vh;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: aiPopupSlideIn 0.3s ease-out;
        border-left: 4px solid #dc3545;
    `;
    
    // Kapatma butonu olayı
    const closeBtn = aiPopup.querySelector('.ai-popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAIPopup);
    }
    
    document.body.appendChild(aiPopup);
    isPopupVisible = true;
    
    // Overlay ekle
    addOverlay();
}

function hideAIPopup() {
    if (aiPopup) {
        aiPopup.remove();
        aiPopup = null;
    }
    isPopupVisible = false;
    removeOverlay();
}

function addOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ai-assistant-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        backdrop-filter: blur(2px);
    `;
    
    overlay.addEventListener('click', hideAIPopup);
    document.body.appendChild(overlay);
}

function removeOverlay() {
    const overlay = document.getElementById('ai-assistant-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// HTML karakterlerini escape et
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}



