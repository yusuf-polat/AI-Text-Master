// Popup JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const apiStatus = document.getElementById('apiStatus');
    const settingsSection = document.getElementById('settingsSection');
    const chatSection = document.getElementById('chatSection');
    const userInput = document.getElementById('userInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const response = document.getElementById('response');
    
    // Tool settings elements
    const toolPurposeSelect = document.getElementById('toolPurpose');
    const customPromptGroup = document.getElementById('customPromptGroup');
    const customPromptTextarea = document.getElementById('customPrompt');
    const translationSettings = document.getElementById('translationSettings');
    const targetLanguageSelect = document.getElementById('targetLanguage');
    const saveToolSettingsBtn = document.getElementById('saveToolSettings');
    const toolStatus = document.getElementById('toolStatus');
    const chatTitle = document.getElementById('chatTitle');
    const userInputLabel = document.getElementById('userInputLabel');
    
    // Navigation buttons
    const openSettingsBtn = document.getElementById('openSettings');
    const backToChatBtn = document.getElementById('backToChat');
    
    // Tool purpose configurations
    const toolConfigs = {
        text_editing: {
            title: 'Metin Düzenleyici',
            label: 'Düzeltilecek Metin:',
            placeholder: 'Düzeltmek istediğiniz metni buraya yazın...',
            buttonText: 'Düzelt'
        },
        translation: {
            title: 'Çeviri Aracı',
            label: 'Çevrilecek Metin:',
            placeholder: 'Çevirmek istediğiniz metni buraya yazın...',
            buttonText: 'Çevir'
        },
        summarization: {
            title: 'Özetleme Aracı',
            label: 'Özetlenecek Metin:',
            placeholder: 'Özetlemek istediğiniz metni buraya yazın...',
            buttonText: 'Özetle'
        },
        grammar_check: {
            title: 'Dilbilgisi Kontrolü',
            label: 'Kontrol Edilecek Metin:',
            placeholder: 'Dilbilgisi kontrolü yapılacak metni buraya yazın...',
            buttonText: 'Kontrol Et'
        },
        style_improvement: {
            title: 'Yazım Stili İyileştirme',
            label: 'İyileştirilecek Metin:',
            placeholder: 'Yazım stili iyileştirilecek metni buraya yazın...',
            buttonText: 'İyileştir'
        },
        custom: {
            title: 'Özel AI Aracı',
            label: 'İşlenecek Metin:',
            placeholder: 'İşlemek istediğiniz metni buraya yazın...',
            buttonText: 'İşle'
        }
    };
    
    // Language configurations
    const languageConfigs = {
        turkish: 'Türkçe',
        english: 'İngilizce',
        german: 'Almanca',
        french: 'Fransızca',
        spanish: 'İspanyolca',
        italian: 'İtalyanca',
        russian: 'Rusça',
        arabic: 'Arapça',
        chinese: 'Çince',
        japanese: 'Japonca',
        korean: 'Korece',
        portuguese: 'Portekizce',
        dutch: 'Hollandaca',
        swedish: 'İsveççe',
        norwegian: 'Norveççe',
        danish: 'Danca',
        finnish: 'Fince',
        polish: 'Lehçe',
        czech: 'Çekçe',
        hungarian: 'Macarca',
        romanian: 'Romence',
        bulgarian: 'Bulgarca',
        greek: 'Yunanca',
        hebrew: 'İbranice',
        hindi: 'Hintçe',
        thai: 'Tayca',
        vietnamese: 'Vietnamca',
        indonesian: 'Endonezce',
        malay: 'Malayca',
        filipino: 'Filipince'
    };
    
    // Sayfa yüklendiğinde API anahtarını ve tool ayarlarını kontrol et
    await checkApiKey();
    await loadToolSettings();
    
    // Navigation event listeners
    openSettingsBtn.addEventListener('click', () => {
        settingsSection.style.display = 'block';
        chatSection.style.display = 'none';
    });
    
    backToChatBtn.addEventListener('click', () => {
        settingsSection.style.display = 'none';
        chatSection.style.display = 'block';
        updateChatUI(toolPurposeSelect.value);
    });
    
    // Tool purpose değiştiğinde
    toolPurposeSelect.addEventListener('change', () => {
        const selectedPurpose = toolPurposeSelect.value;
        
        // Tüm özel ayar gruplarını gizle
        customPromptGroup.style.display = 'none';
        translationSettings.style.display = 'none';
        
        if (selectedPurpose === 'custom') {
            customPromptGroup.style.display = 'block';
        } else if (selectedPurpose === 'translation') {
            translationSettings.style.display = 'block';
        }
        
        // Chat bölümü görünürse UI'yi güncelle
        if (chatSection.style.display !== 'none') {
            updateChatUI(selectedPurpose);
        }
    });
    
    // Tool ayarlarını kaydet
    saveToolSettingsBtn.addEventListener('click', async () => {
        const toolPurpose = toolPurposeSelect.value;
        const customPrompt = customPromptTextarea.value.trim();
        const targetLanguage = targetLanguageSelect.value;
        
        if (toolPurpose === 'custom' && !customPrompt) {
            showToolStatus('Özel prompt için lütfen bir metin girin.', 'error');
            return;
        }
        
        try {
            await chrome.runtime.sendMessage({
                action: 'saveToolSettings',
                toolPurpose: toolPurpose,
                customPrompt: customPrompt,
                targetLanguage: targetLanguage
            });
            
            showToolStatus('Tool ayarları başarıyla kaydedildi!', 'success');
            
            // Chat bölümü görünürse UI'yi güncelle
            if (chatSection.style.display !== 'none') {
                updateChatUI(toolPurpose);
            }
        } catch (error) {
            showToolStatus('Tool ayarları kaydedilirken hata oluştu.', 'error');
        }
    });
    
    // API anahtarını kaydet
    saveApiKeyBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Lütfen API anahtarını girin.', 'error');
            return;
        }
        
        if (!apiKey.startsWith('AIza')) {
            showStatus('Geçersiz API anahtarı formatı. AIza... ile başlamalı.', 'error');
            return;
        }
        
        // API anahtarını test et
        showStatus('API anahtarı test ediliyor...', '');
        
        try {
            const result = await chrome.runtime.sendMessage({
                action: 'testApiKey',
                apiKey: apiKey
            });
            
            if (result.isValid) {
                // API anahtarını kaydet
                await chrome.runtime.sendMessage({
                    action: 'saveApiKey',
                    apiKey: apiKey
                });
                
                showStatus('API anahtarı başarıyla kaydedildi!', 'success');
                apiKeyInput.value = '';
                
                // Chat bölümünü göster
                setTimeout(() => {
                    settingsSection.style.display = 'none';
                    chatSection.style.display = 'block';
                    updateChatUI(toolPurposeSelect.value);
                }, 1000);
                
            } else {
                showStatus('Geçersiz API anahtarı. Lütfen kontrol edin.', 'error');
            }
        } catch (error) {
            showStatus('API anahtarı test edilirken hata oluştu.', 'error');
        }
    });
    
    // Mesaj gönder
    sendMessageBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    async function sendMessage() {
        const text = userInput.value.trim();
        
        if (!text) {
            return;
        }
        
        // UI'yi güncelle
        sendMessageBtn.disabled = true;
        sendMessageBtn.innerHTML = '<div class="loading"></div>';
        userInput.disabled = true;
        response.textContent = 'AI yanıtı hazırlanıyor...';
        
        try {
            const result = await chrome.runtime.sendMessage({
                action: 'processText',
                text: text
            });
            
            if (result.success) {
                response.innerHTML = `
                    <div style="background: #e8f5e8; padding: 10px; border-radius: 4px; border-left: 4px solid #4caf50;">
                        <strong>✅ Sonuç:</strong><br>
                        ${result.response}
                    </div>
                `;
            } else {
                response.innerHTML = `
                    <div style="background: #ffebee; padding: 10px; border-radius: 4px; border-left: 4px solid #f44336;">
                        <strong>❌ Hata:</strong> ${result.error}
                    </div>
                `;
            }
        } catch (error) {
            response.textContent = `Hata: ${error.message}`;
        } finally {
            // UI'yi sıfırla
            sendMessageBtn.disabled = false;
            sendMessageBtn.textContent = toolConfigs[toolPurposeSelect.value]?.buttonText || 'İşle';
            userInput.disabled = false;
            userInput.value = '';
            userInput.focus();
        }
    }
    
    async function checkApiKey() {
        try {
            const result = await chrome.runtime.sendMessage({action: 'getApiKey'});
            
            if (result.apiKey) {
                // API anahtarı mevcut, chat bölümünü göster
                settingsSection.style.display = 'none';
                chatSection.style.display = 'block';
                userInput.focus();
            } else {
                // API anahtarı yok, ayarlar bölümünü göster
                settingsSection.style.display = 'block';
                chatSection.style.display = 'none';
                apiKeyInput.focus();
            }
        } catch (error) {
            console.error('API anahtarı kontrol edilirken hata:', error);
        }
    }
    
    async function loadToolSettings() {
        try {
            const result = await chrome.runtime.sendMessage({action: 'getToolSettings'});
            
            if (result.toolPurpose) {
                toolPurposeSelect.value = result.toolPurpose;
                
                if (result.toolPurpose === 'custom' && result.customPrompt) {
                    customPromptTextarea.value = result.customPrompt;
                    customPromptGroup.style.display = 'block';
                } else if (result.toolPurpose === 'translation') {
                    translationSettings.style.display = 'block';
                    if (result.targetLanguage) {
                        targetLanguageSelect.value = result.targetLanguage;
                    }
                }
            }
        } catch (error) {
            console.error('Tool ayarları yüklenirken hata:', error);
        }
    }
    
    function updateChatUI(toolPurpose) {
        const config = toolConfigs[toolPurpose];
        if (config) {
            chatTitle.textContent = config.title;
            userInputLabel.textContent = config.label;
            userInput.placeholder = config.placeholder;
            sendMessageBtn.textContent = config.buttonText;
        }
    }
    
    function showStatus(message, type) {
        apiStatus.textContent = message;
        apiStatus.className = `status ${type}`;
        
        if (type === 'success') {
            setTimeout(() => {
                apiStatus.textContent = '';
                apiStatus.className = 'status';
            }, 3000);
        }
    }
    
    function showToolStatus(message, type) {
        toolStatus.textContent = message;
        toolStatus.className = `status ${type}`;
        
        if (type === 'success') {
            setTimeout(() => {
                toolStatus.textContent = '';
                toolStatus.className = 'status';
            }, 3000);
        }
    }
});

