# Folder File Produk

Folder ini buat nyimpen file produk digital yang otomatis bisa di-download
pembeli setelah pembayaran via Pakasir (QRIS) berhasil terverifikasi otomatis.

## Cara pakai

1. Taruh file produk kamu di sini (zip, rar, pdf, dll), contoh:
   - file/script-bot-wa-premium.zip
   - file/script-bot-jpm-puskontak.zip

2. Buka `esce.js`, cari array `products`, lalu tambahkan/atur field `file`
   di produk yang mau auto-download, harus PERSIS sama nama file-nya:

   {
     id: 'bot-001',
     name: 'Script Bot WA Premium',
     ...
     file: 'file/script-bot-wa-premium.zip',
   }

3. Kalau sebuah produk TIDAK punya field `file` (misal produk jasa seperti
   "Jasa Design" atau "Jasa Rename"), tombol download otomatis tidak akan
   muncul — alurnya tetap manual lewat konfirmasi WhatsApp seperti biasa.
   Ini wajar karena jasa tidak punya file untuk dikirim otomatis.

## Catatan penting (keamanan)

- File di folder ini bisa diakses lewat URL langsung
  (contoh: https://domainmu.com/file/script-bot-wa-premium.zip)
  oleh SIAPA SAJA yang tahu/menebak link-nya, bukan cuma yang sudah bayar.
- Ini trade-off wajar untuk situs statis tanpa database/login proteksi file.
- Kalau produk kamu sensitif/mahal dan butuh perlindungan ketat (link
  expired, sekali pakai, dsb), itu perlu sistem token/database di server
  — bisa dikembangkan lebih lanjut kalau diperlukan.
