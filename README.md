# Metin Düzenleyici Chrome Extension

Bu Chrome extension, herhangi bir web sayfasında seçtiğiniz metni Google Gemma AI ile düzeltmenizi ve noktalama işaretlerini eklemenizi sağlar.

## Özellikler

- ✏️ **Metin Düzeltme**: Yazım hatalarını otomatik düzeltme
- 🔤 **Noktalama İşaretleri**: Eksik noktalama işaretlerini ekleme
- 🚀 **Hızlı**: Herhangi bir web sayfasında metin seçip sağ tıklayarak düzeltme
- 💬 **Popup Düzenleyici**: Extension popup'ında doğrudan metin düzenleme
- 🎯 **Basit**: Tek tıkla metin düzeltme
- 🌐 **Evrensel**: Tüm web sitelerinde çalışır
- 🔒 **Güvenli**: API anahtarı güvenli şekilde saklanır
- 📝 **Hızlı Yanıt**: Stream API ile anında metin düzeltme

## Kurulum

1. Bu repository'yi bilgisayarınıza indirin
2. Chrome'da `chrome://extensions/` adresine gidin
3. "Developer mode"u açın
4. "Load unpacked" butonuna tıklayın
5. İndirdiğiniz klasörü seçin
6. Extension yüklendiğinde, popup'ı açın ve Gemini API anahtarınızı girin

## Gemma API Anahtarı Alma

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. API anahtarınızı kopyalayın (AIza... ile başlar)
5. Extension popup'ına yapıştırın ve "Kaydet" butonuna tıklayın

## Kullanım

### Metin Seçimi ile Düzeltme
1. Herhangi bir web sayfasında metin seçin
2. Seçili metne sağ tıklayıp "Metni Düzelt ve Noktalama Ekle" seçeneğini seçin
3. Düzeltilmiş metin popup olarak görünecektir

### Popup Düzenleyici
1. Extension popup'ını açın
2. Metin kutusuna düzeltmek istediğiniz metni yazın
3. "Düzelt" butonuna tıklayın
4. Düzeltilmiş metni alın

## Test Etme

Extension'ı test etmek için `test.html` dosyasını kullanabilirsiniz:
1. `test.html` dosyasını tarayıcıda açın
2. Farklı metin türlerini seçip AI ile düzeltmeyi test edin
3. Sağ tık menüsünü deneyin

## Sorun Giderme

### "Gemma API anahtarı bulunamadı" hatası
- Extension popup'ını açın
- API anahtarınızı girin ve kaydedin
- API anahtarının doğru formatta olduğundan emin olun (AIza... ile başlar)

### "Geçersiz API anahtarı" hatası
- [Google AI Studio](https://makersuite.google.com/app/apikey) adresinden yeni API anahtarı alın
- API anahtarınızın aktif olduğundan emin olun
- Extension popup'ından API anahtarını yeniden girin

### "API Hatası" mesajı
- İnternet bağlantınızı kontrol edin
- Gemma API servisinin çalışır durumda olduğundan emin olun
- Birkaç dakika bekleyip tekrar deneyin

### Sağ tık menüsü çalışmıyor
- Metin seçimi yaptığınızdan emin olun
- Sayfayı yenileyin
- Extension'ı yeniden yükleyin

### Extension çalışmıyor
- Extension'ı yeniden yükleyin
- Chrome'u yeniden başlatın
- API anahtarınızın doğru olduğundan emin olun

## Teknik Detaylar

### API
- Google Gemma 3N-E2B-IT modeli kullanılır
- Stream API çağrıları
- Anında metin düzeltme
- Rate limiting uygulanır

### Özellikler
- Metin seçimi algılama
- Sağ tık context menüsü
- Popup arayüzü
- Hata yönetimi

### İzinler
- `activeTab`: Aktif sekmede çalışma
- `contextMenus`: Sağ tık menüsü
- `scripting`: Content script enjeksiyonu
- `storage`: API anahtarı saklama

### Host İzinleri
- `https://generativelanguage.googleapis.com/*`: Gemini API erişimi

## Güvenlik

- API anahtarı Chrome'un güvenli storage'ında saklanır
- Tüm veriler yerel olarak işlenir
- Güvenli HTTPS bağlantıları
- API anahtarı şifrelenmiş olarak saklanır

## Dosya Yapısı

```
ai-assistant-extension/
├── manifest.json          # Extension yapılandırması
├── background.js          # Arka plan betiği
├── popup.html            # Popup arayüzü
├── popup.css             # Popup stilleri
├── popup.js              # Popup JavaScript
├── content.js            # İçerik betiği (metin seçimi)
├── content.css           # İçerik stilleri (popup ve butonlar)
├── ai-popup.html         # AI yanıt popup'ı
├── ai-popup.css          # AI popup stilleri
├── test.html             # Test sayfası
├── icons/                # Extension ikonları
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # Bu dosya
```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

