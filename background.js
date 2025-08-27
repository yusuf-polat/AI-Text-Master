// Background script for AI Assistant Extension

// Extension yüklendiğinde context menu oluştur
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "aiAssistant",
        title: "AI ile Analiz Et",
        contexts: ["selection"]
    });
});

// Context menu tıklandığında
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "aiAssistant" && info.selectionText) {
        // Seçili metni AI'ya gönder
        await processWithAI(info.selectionText, tab.id);
    }
});

// Popup ve content script'lerden gelen mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processText") {
        processWithAI(request.text, sender.tab?.id)
            .then(response => sendResponse({success: true, response}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true; // Asenkron yanıt için
    }
    
    if (request.action === "saveApiKey") {
        chrome.storage.sync.set({geminiApiKey: request.apiKey}, () => {
            sendResponse({success: true});
        });
        return true;
    }
    
    if (request.action === "getApiKey") {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            sendResponse({apiKey: result.geminiApiKey});
        });
        return true;
    }
    
    if (request.action === "testApiKey") {
        testApiKey(request.apiKey)
            .then(isValid => sendResponse({isValid}))
            .catch(() => sendResponse({isValid: false}));
        return true;
    }
    
    if (request.action === "saveToolSettings") {
        chrome.storage.sync.set({
            toolPurpose: request.toolPurpose,
            customPrompt: request.customPrompt,
            targetLanguage: request.targetLanguage
        }, () => {
            sendResponse({success: true});
        });
        return true;
    }
    
    if (request.action === "getToolSettings") {
        chrome.storage.sync.get(['toolPurpose', 'customPrompt', 'targetLanguage'], (result) => {
            sendResponse({
                toolPurpose: result.toolPurpose || 'text_editing',
                customPrompt: result.customPrompt || '',
                targetLanguage: result.targetLanguage || 'turkish'
            });
        });
        return true;
    }
});

// Gemini API ile metin işleme
async function processWithAI(text, tabId) {
    try {
        // API anahtarını al
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        const apiKey = result.geminiApiKey;
        
        if (!apiKey) {
            throw new Error('Gemini API anahtarı bulunamadı. Lütfen popup\'tan API anahtarınızı girin.');
        }

        // Tool ayarlarını al
        const toolSettings = await chrome.storage.sync.get(['toolPurpose', 'customPrompt', 'targetLanguage']);
        const toolPurpose = toolSettings.toolPurpose || 'text_editing';
        const customPrompt = toolSettings.customPrompt || '';
        const targetLanguage = toolSettings.targetLanguage || 'turkish';

        // Rate limiting kontrolü
        await checkRateLimit();

        // Tool purpose'a göre prompt oluştur
        const prompt = generatePrompt(text, toolPurpose, customPrompt, targetLanguage);

        // Gemma API çağrısı
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e2b-it:streamGenerateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API Hatası: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        // Stream response'u işle (array formatında geliyor)
        let aiResponse = '';
        console.log('API Response:', data); // Debug için
        
        // Data bir array ise, tüm parçaları birleştir
        if (Array.isArray(data)) {
            const fullText = data
                .map(item => {
                    if (item.candidates && item.candidates[0] && item.candidates[0].content && item.candidates[0].content.parts) {
                        return item.candidates[0].content.parts[0].text;
                    }
                    return '';
                })
                .join('');
            
            console.log('Full Text:', fullText); // Debug için
            aiResponse = fullText.trim();
        } else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            // Tek obje formatında gelirse
            const rawText = data.candidates[0].content.parts[0].text;
            console.log('Raw Text:', rawText); // Debug için
            aiResponse = rawText.trim();
        } else if (data.error) {
            throw new Error(`Gemma Hatası: ${data.error.message || 'Bilinmeyen hata'}`);
        } else {
            console.error('Beklenmeyen API yanıt formatı:', data);
            throw new Error('API yanıt formatı tanınmıyor');
        }

        // Eğer tabId varsa, content script'e sonucu gönder
        if (tabId) {
            console.log('Sending response to content script:', {
                action: "showAIResponse",
                response: aiResponse,
                originalText: text,
                tabId: tabId
            });
            
            try {
                await chrome.tabs.sendMessage(tabId, {
                    action: "showAIResponse",
                    response: aiResponse,
                    originalText: text
                });
                console.log('Message sent successfully to content script');
            } catch (error) {
                console.error('Error sending message to content script:', error);
            }
        }

        return aiResponse;

    } catch (error) {
        console.error('AI işleme hatası:', error);

        // Hata durumunda content script'e bilgi gönder
        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: "showAIError",
                error: error.message
            });
        }

        throw error;
    }
}

// Tool purpose'a göre prompt oluştur
function generatePrompt(text, toolPurpose, customPrompt, targetLanguage) {
    const languageNames = {
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
    
    const basePrompts = {
        text_editing: `Sen bir metin düzenleme uzmanısın. Aşağıdaki metni al, noktalama işaretlerini düzelt, yazım hatalarını gider ve daha okunabilir hale getir. Sadece düzeltilmiş metni ver, başka açıklama ekleme.

Metin: "${text}"`,
        
        translation: `Sen bir çeviri uzmanısın. Aşağıdaki metni ${languageNames[targetLanguage] || 'Türkçe'} diline çevir. Sadece çevrilmiş metni ver, başka açıklama ekleme.

Metin: "${text}"`,
        
        summarization: `Sen bir özetleme uzmanısın. Aşağıdaki metni kısa ve öz bir şekilde özetle. Ana fikirleri ve önemli noktaları koruyarak metni %50 oranında kısalt. Sadece özeti ver, başka açıklama ekleme.

Metin: "${text}"`,
        
        grammar_check: `Sen bir dilbilgisi kontrol uzmanısın. Aşağıdaki metni dilbilgisi açısından kontrol et ve hataları düzelt. Sadece düzeltilmiş metni ver, başka açıklama ekleme.

Metin: "${text}"`,
        
        style_improvement: `Sen bir yazım stili uzmanısın. Aşağıdaki metni daha akıcı, profesyonel ve etkili bir yazım stiliyle yeniden yaz. Anlamı koruyarak metni iyileştir. Sadece iyileştirilmiş metni ver, başka açıklama ekleme.

Metin: "${text}"`,
        
        custom: customPrompt ? `${customPrompt}

Metin: "${text}"` : `Aşağıdaki metni işle:

Metin: "${text}"`
    };
    
    return basePrompts[toolPurpose] || basePrompts.text_editing;
}



// Rate limiting için değişkenler
let lastRequestTime = 0;
let requestCount = 0;
const RATE_LIMIT_DELAY = 2000; // 2 saniye
const MAX_REQUESTS_PER_MINUTE = 10;

// Rate limiting kontrolü
async function checkRateLimit() {
    const now = Date.now();
    
    // Son istekten bu yana geçen süreyi kontrol et
    if (now - lastRequestTime < RATE_LIMIT_DELAY) {
        const waitTime = RATE_LIMIT_DELAY - (now - lastRequestTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Dakikada maksimum istek sayısını kontrol et
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        throw new Error('Çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.');
    }
    
    lastRequestTime = Date.now();
    requestCount++;
    
    // Her dakika request count'u sıfırla
    setTimeout(() => {
        requestCount = Math.max(0, requestCount - 1);
    }, 60000);
}

// Benzersiz ID oluştur
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// API anahtarını test etme fonksiyonu
async function testApiKey(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e2b-it:streamGenerateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: "Merhaba"
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 100
                }
            })
        });
        
        if (!response.ok) {
            return false;
        }
        
        const data = await response.json();
        console.log('Test API Response:', data); // Debug için
        
        // Yanıtın geçerli olup olmadığını kontrol et
        if (Array.isArray(data)) {
            return data.length > 0 && data[0].candidates && data[0].candidates.length > 0;
        } else {
            return data.candidates && data.candidates.length > 0;
        }
    } catch (error) {
        console.error('API test hatası:', error);
        return false;
    }
}



