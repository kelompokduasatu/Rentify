# Kelompokduasatu

## Anggota dan NIM

- Rakan Hendian Ramadhan — 24/540158/TK/59909
- Stella Florencia Doulim — 24/542739/TK/60285
- Rian Prasetya Munaji — 24/545573/TK/60702

## Project Senior Project TI

## Instansi

Departemen Teknologi Elektro dan Teknologi Informasi,  
Fakultas Teknik,  
Universitas Gadjah Mada

---

# Jawaban Modul 1

## 1. Nama Produk

**Rentify: Smart P2P Vehicle Sharing**

## 2. Jenis Produk

Rentify merupakan platform penyewaan kendaraan berbasis **peer-to-peer (P2P)** yang berperan sebagai perantara antara pemilik kendaraan (*host*) dan penyewa (*guest*).

## 3. Latar Belakang & Permasalahan

### Latar Belakang

Banyak kendaraan yang tidak dipakai selama berbulan-bulan, bisa jadi karena pemiliknya sedang pergi, sibuk, atau karena alasan lainnya. Alih-alih kendaraan tersebut tidak digunakan dan bahkan terkadang tidak dipelihara, kendaraan tersebut dapat digunakan oleh orang lain dalam bentuk sewa menyewa yang dapat menguntungkan kedua pihak.

Namun, implementasi penyewaan kendaraan dengan model peer-to-peer menghadirkan beberapa risiko keamanan serta krisis kepercayaan, sehingga diperlukan platform yang bertindak sebagai middleman dalam praktik sewa-menyewa.

### Rumusan Permasalahan

1. Bagaimana cara mengimplementasi sistem authentication bagi penyewa dan yang menyewakan, yang efisien dan aman, serta dapat meminimalisir risiko pemalsuan?
2. Bagaimana cara menjalin kepercayaan antara penyewa dan yang menyewakan?
3. Bagaimana cara membangun sistem penyewaan yang dinamis dan elastis yang dapat menghandle data dalam jumlah besar, serta menjamin ketersediaan layanan ketika trafik tinggi?

## 4. Ide Solusi

Rentify hadir sebagai platform penyewaan kendaraan berbasis peer-to-peer yang berperan sebagai perantara terpercaya antara pemilik kendaraan (*host*) dan penyewa (*guest*).

Untuk menjamin keamanan transaksi, Rentify dilengkapi verifikasi identitas otomatis melalui **e-KYC** dan **face liveness detection** guna memastikan setiap pengguna adalah pihak yang sah, serta fitur **deteksi kerusakan kendaraan berbasis analisis foto** untuk menjaga transparansi dan integritas setiap transaksi sewa.

Sistem **rating** dan **pelacakan lokasi (GPS)** turut disertakan untuk memperkuat rasa saling percaya antar pengguna. Keseluruhan platform dibangun di atas **arsitektur cloud yang elastis**, sehingga mampu beradaptasi terhadap lonjakan trafik maupun pertumbuhan jumlah pengguna secara dinamis.

### Rancangan Fitur Solusi

| Fitur | Keterangan |
|---|---|
| **e-KYC & Verifikasi Dokumen** | Validasi otomatis KTP, SIM, dan face liveness detection penyewa untuk mencegah penipuan/pencurian kendaraan. |
| **Face Liveness Detection** | Memastikan wajah penyewa sesuai foto KTP dan bukan foto/video hasil rekayasa (anti-spoofing). |
| **Deteksi Kerusakan Kendaraan** | Analisis foto kondisi fisik kendaraan sebelum (check-in) dan sesudah (check-out) masa sewa untuk mendeteksi baret/penyok secara otomatis. |
| **Chatbot Asisten Sewa** | Rekomendasi kendaraan dan bantuan syarat sewa interaktif. |
| **Payment** | Pengguna dapat melakukan pembayaran melalui aplikasi. |
| **Pelacakan GPS** | Aplikasi dapat melakukan pelacakan terhadap kendaraan yang disewakan. |
| **Rating dan Testimoni** | Rating dan testimoni untuk pemilik dan penyewa sebagai kredit kepercayaan dalam menyewakan kendaraan. |
| **Pencarian Kendaraan** | Fitur pencarian kendaraan yang diinginkan oleh penyewa atau user. |

---

# 5. Analisis Kompetitor

## Kompetitor 1 — TREVO

**Jenis Kompetitor:** Direct Competitor

**Jenis Produk:** Aplikasi P2P Car Sharing / Rental Mobil Pribadi

**Target Customer:** Pemilik mobil pribadi yang ingin monetisasi aset (*host*) dan penyewa mobil harian/liburan (*guest*).

### Kelebihan

- Pelopor konsep P2P car rental di pasar Indonesia.
- Dilengkapi asuransi rekanan dan pelacakan GPS terintegrasi.
- Pilihan mobil beragam langsung dari pemilik individu.

### Kekurangan

- Proses persetujuan dokumen manual terkadang memakan waktu lama.
- Ketersediaan armada masih terkonsentrasi di kota-kota besar (Jabodetabek, Bandung, Bali).
- Tarif dan respons pemilik kendaraan terkadang tidak konsisten.

### Key Competitive Advantage & Unique Value

Platform spesifik P2P dengan proteksi asuransi khusus dan fleksibilitas durasi sewa harian hingga bulanan.

---

## Kompetitor 2 — Traveloka (Layanan Rental Mobil)

**Jenis Kompetitor:** Indirect Competitor

**Jenis Produk:** Aggregator Rental Kendaraan B2C (Kemitraan dengan Rental Resmi)

**Target Customer:** Wisatawan domestik/mancanegara dan pelancong bisnis.

### Kelebihan

- Basis pengguna raksasa dan ekosistem pemesanan terpadu (tiket, hotel, rental).
- Standar armada terjamin karena bermitra dengan vendor rental komersial terdaftar.
- Dukungan layanan pelanggan 24/7 dan berbagai metode pembayaran.

### Kekurangan

- Biaya sewa cenderung lebih tinggi (ada margin vendor dan platform).
- Tidak membuka kesempatan bagi individu untuk menyewakan kendaraan pribadinya.
- Pilihan kendaraan terbatas pada tipe-tipe komersial populer.

### Key Competitive Advantage & Unique Value

Kepercayaan konsumen yang tinggi, ekosistem all-in-one travel, dan kepastian unit dari vendor rental resmi.

---

## Kompetitor 3 — Gojek (Layanan GoCar & GoCar Transporter)

**Jenis Kompetitor:** Tertiary Competitor

**Jenis Produk:** Layanan Transportasi On-Demand & Sewa Mobil dengan Pengemudi (Ride-hailing)

**Target Customer:** Komuter perkotaan yang membutuhkan mobilitas titik-ke-titik instan tanpa harus mengemudi sendiri.

### Kelebihan

- Penjemputan instan dalam hitungan menit tanpa proses administrasi sewa.
- Pengguna tidak menanggung risiko kerusakan atau perawatan kendaraan.
- Jangkauan operasional sangat luas hingga ke pelosok kota.

### Kekurangan

- Tidak menyediakan opsi lepas kunci (mengemudi sendiri).
- Biaya menjadi sangat mahal jika digunakan untuk perjalanan jarak jauh seharian penuh atau lintas kota.
- Kurang cocok untuk kebutuhan perjalanan keluarga multi-hari yang membutuhkan fleksibilitas barang bawaan.

### Key Competitive Advantage & Unique Value

Kecepatan akses (on-demand), ketersediaan pengemudi instan, dan integrasi pembayaran dompet digital (GoPay).

