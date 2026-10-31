---
name: HRIS Jalur Komuter
description: Sistem informasi SDM berbasis web dan mobile dengan metafora rambu transit komuter yang terarah, cepat, dan tegas.
colors:
  primary: "oklch(0.5 0.17 258)"
  primary-foreground: "oklch(0.99 0.005 250)"
  background: "oklch(0.982 0.004 250)"
  foreground: "oklch(0.22 0.04 258)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.22 0.04 258)"
  sidebar: "oklch(0.24 0.06 258)"
  sidebar-foreground: "oklch(0.93 0.015 255)"
  sidebar-primary: "oklch(0.82 0.16 85)"
  sidebar-primary-foreground: "oklch(0.24 0.06 258)"
  border: "oklch(0.9 0.012 255)"
  input: "oklch(0.86 0.015 255)"
  ring: "oklch(0.6 0.15 258)"
  success: "oklch(0.52 0.14 152)"
  success-soft: "oklch(0.95 0.045 152)"
  warning: "oklch(0.82 0.16 85)"
  warning-soft: "oklch(0.96 0.07 90)"
  danger: "oklch(0.55 0.21 27)"
  danger-soft: "oklch(0.95 0.03 25)"
  info: "oklch(0.5 0.17 258)"
  info-soft: "oklch(0.94 0.03 255)"
typography:
  display:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.025em"
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
  xl: "0.875rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1.25rem"
  button-accent:
    backgroundColor: "{colors.sidebar-primary}"
    textColor: "{colors.sidebar-primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1.5rem"
  card-standard:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "1.25rem 1.25rem"
---

# Design System: HRIS Jalur Komuter

## Overview

**Creative North Star: "Peta Rambu Komuter yang Tegas dan Efisien"**

Sistem desain HRIS Jalur Komuter dirancang untuk operasional harian yang cepat dan tanpa hambatan. Karyawan membuka aplikasi dari perangkat ponsel di perjalanan atau komputer kantor untuk menyelesaikan tugas inti dalam hitungan detik: absensi harian, pengajuan izin/cuti, dan permohonan kasbon. Struktur visualnya mengambil disiplin dari sistem navigasi dan peta stasiun transit—kontras tinggi, informasi padat dan terbaca seketika, dengan navigasi yang langsung menuju tujuan tanpa dekorasi artifisial.

Warna shell aplikasi menggunakan Navy pekat (`--sidebar`) yang stabil dan berwibawa, dipadukan dengan Biru Jalur (`--primary`) untuk interaksi utama serta Kuning Sinyal Transit (`--sidebar-primary` / `--warning`) sebagai aksen status aksi penting. Semua angka operasional, jam kehadiran, dan nominal rupiah menggunakan angka tabular (`tabular-nums`) untuk keterbacaan data yang akurat.

**Key Characteristics:**
- **Operate Mode**: Setiap elemen dirancang untuk pemindaian instan dan penyelesaian tugas cepat; fungsi selalu mendahului ornamen.
- **Elevation Berbasis Border**: Tidak menggunakan bayangan buram (box-shadow) bertumpuk; hierarki dibangun lewat garis tepi tajam (`--border`) dan kontras warna bidang.
- **Rambu Status Berwarna**: Status persetujuan dan kehadiran selalu memiliki padanan warna semantik yang jelas (Hijau, Kuning, Merah, Biru).
- **Mobile-First dengan Bottom Rail**: Pengguna ponsel mendapatkan navigasi jempol bawah tetap (`MobileNav`), sementara desktop memiliki sidebar penuh.

## Colors

Palet Jalur Komuter menggunakan format OKLCH untuk rentang persepsi warna yang konsisten antara mode terang dan gelap.

### Primary
- **Biru Jalur Komuter** (`oklch(0.5 0.17 258)` / Dark: `oklch(0.68 0.15 258)`): Digunakan untuk tombol tindakan primer, link interaktif, dan penanda fokus aktif.

### Secondary
- **Kuning Sinyal Transit** (`oklch(0.82 0.16 85)`): Aksen identitas brand pada logo dan tombol sorotan khusus (seperti tombol aksi jam absensi di dasbor) serta status peringatan/menunggu.

### Neutral
- **Navy Pekat Shell** (`oklch(0.24 0.06 258)` / Dark: `oklch(0.15 0.04 258)`): Warna bidang latar untuk navigasi sidebar, panel sambutan, dan bottom nav ponsel.
- **Canvas Latar** (`oklch(0.982 0.004 250)` / Dark: `oklch(0.18 0.035 258)`): Latar belakang utama aplikasi dengan sedikit rona dingin agar tidak menyilaukan.
- **Permukaan Kartu** (`oklch(1 0 0)` / Dark: `oklch(0.22 0.04 258)`): Latar belakang kontainer konten dan formulir.
- **Garis Batas (Border)** (`oklch(0.9 0.012 255)` / Dark: `oklch(0.32 0.05 258)`): Pembatas antar modul, tabel, dan kartu.

### Status Semantik
- **Sukses / Disetujui / Hadir**: Teks `oklch(0.52 0.14 152)`, Latar Lembut `oklch(0.95 0.045 152)`.
- **Peringatan / Menunggu / Terlambat**: Teks `oklch(0.3 0.07 70)`, Latar Lembut `oklch(0.96 0.07 90)`.
- **Bahaya / Ditolak / Alpa**: Teks `oklch(0.55 0.21 27)`, Latar Lembut `oklch(0.95 0.03 25)`.
- **Info / Izin / Cuti**: Teks `oklch(0.5 0.17 258)`, Latar Lembut `oklch(0.94 0.03 255)`.

### Named Rules
**The Single Track Rule.** Warna aksen kuning sinyal hanya digunakan untuk satu tindakan utama paling penting per layar dan status berjalan; tidak disebar secara acak pada teks biasa.

## Typography

**Display & Headline:** Barlow (weights 600, 700)  
**Body & UI Text:** Barlow (weights 400, 500, 600)  
**Angka Data:** Barlow dengan kelas `.tabular` (`font-variant-numeric: tabular-nums`)

**Character:** Tipografi Barlow terinspirasi oleh papan rambu publik—ringkas, berjarak pas, proporsi vertikal seimbang, dan sangat jelas dibaca pada layar kecil maupun dari jarak baca cepat.

### Hierarchy
- **Display** (Bold 700, 2.25rem / 36px, line-height 1.15): Digunakan untuk headline hero welcome dan halaman otentikasi.
- **Headline (H1 / PageHeader)** (Bold 700, 1.5rem / 24px, line-height 1.25): Judul utama setiap layar aplikasi.
- **Title (H2)** (Semibold 600, 1.125rem / 18px, line-height 1.35): Judul seksi kartu atau pengelompokan modul.
- **Body** (Regular 400 / Medium 500, 0.875rem / 14px, line-height 1.5): Teks penjelasan, label input formulir, dan isi tabel.
- **Label & Badge** (Semibold 600, 0.75rem / 12px, tracking 0.025em): Label navigasi bawah, tag status, dan judul kolom tabel.

### Named Rules
**The Tabular Discipline Rule.** Semua data waktu (jam:menit), tanggal, nominal mata uang (Rp), dan kuantitas numerik wajib menggunakan kelas `.tabular` agar angka sejajar secara vertikal dan tidak bergetar saat diperbarui.

## Layout

Tata letak aplikasi menggunakan pola kontainer terstandarisasi:
- **Kontainer Halaman Utama**: `mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6`
- **Responsivitas Ponsel**: Ruang bawah halaman diberi penyesuaian padding (`pb-16 md:pb-0`) untuk mengakomodasi bilah navigasi bawah ponsel (`MobileNav`) yang menempel pada batas pandang aman (`safe-area-inset-bottom`).
- **Pemisahan Modul**: Jarak standar antar seksi adalah `gap-6` (24px) pada desktop dan `gap-4` (16px) pada perangkat kecil.

## Elevation & Depth

Sistem ini tidak menggunakan bayangan difus (drop shadow) untuk membedakan kedalaman. Seluruh kedalaman dan batas fisik elemen diatur melalui garis batas solid (1px border) dan kontras bidang warna.

### Depth Vocabulary
- **Permukaan Datar (Flat Surface)**: Kontainer `border border-border bg-card` tanpa bayangan.
- **Fokus Interaktif**: Pergantian ring fokus tajam berjarak 3px (`focus-visible:ring-[3px] focus-visible:ring-ring/50`).
- **Sorotan Kartu Aksi**: Penggunaan kontras penuh bidang Navy (`bg-sidebar text-sidebar-foreground`) untuk modul hero utama di dalam halaman.

## Shapes

- **Sudut Kartu & Panel**: Radius besar `rounded-xl` (12px / 0.75rem - 14px / 0.875rem).
- **Sudut Tombol & Input**: Radius sedang `rounded-lg` (8px - 10px) untuk memastikan target sentuh ramah jempol.
- **Sudut Badge & Pill**: Radius penuh `rounded-full` (9999px) untuk status pengajuan dan chip filter.

## Components

### Buttons
- **Shape:** `rounded-lg`, tinggi default 40px (`h-10`), ukuran besar 48px (`h-12`) untuk tombol kirim form dan aksi utama pada ponsel.
- **Primary:** Latar belakang Biru Jalur (`bg-primary text-primary-foreground font-semibold`), hover sedikit menggelap.
- **Aksen / Hero Action:** Kuning Sinyal (`bg-sidebar-primary text-sidebar-primary-foreground font-semibold`).
- **Outline / Ghost:** Garis batas transparan atau subtil dengan efek hover aksen netral.

### Status Badge (`StatusBadge`)
- **Pola:** Komponen terpusat yang menerima status sistem (`pending`, `approved`, `rejected`, `present`, `late`, dll).
- **Visual:** Pill `rounded-full` dengan titik penanda bulat (dot 6px) dan teks bahasa Indonesia yang terstandarisasi.

### Approval Line (`ApprovalLine`)
- **Signature Component:** Representasi alur persetujuan kasbon dan izin yang digambar seperti peta jalur stasiun transit satu arah.
- **Indikator Titik:** Lingkaran stasiun 24px dengan ikon centang jika selesai (`done`), cincin kuning jika sedang berjalan (`current`), abu-abu jika belum tercapai (`upcoming`), dan silang merah jika ditolak (`rejected`).
- **Jalur Penghubung:** Garis solid tebal 4px hijau bila tahapan terlewati dan netral bila menunggu.

### Page Header (`PageHeader`)
- **Struktur:** Judul H1 24px tebal, deskripsi penjelas di bawahnya, dan slot aksi di sisi kanan (responsif beralih ke bawah di layar sempit).

## Do's and Don'ts

### Do:
- **Do** gunakan bahasa Indonesia yang baku, ramah, dan ringkas pada seluruh teks UI, judul halaman, dan pesan validasi.
- **Do** gunakan `ApprovalLine` untuk setiap alur verifikasi atau persetujuan berjenjang.
- **Do** pastikan target sentuh tombol aksi utama minimal 48px (`h-12`) di ponsel.
- **Do** format seluruh nominal uang menggunakan format `Intl.NumberFormat('id-ID')` dan jam dengan format lokal `HH:mm`.

### Don't:
- **Don't** menambahkan bayangan blur dekoratif (`box-shadow: 0 10px 25px ...`) atau efek gradien warna pada teks.
- **Don't** menaruh label kicker/eyebrow kecil di atas judul utama (judul harus tegas berdiri sendiri).
- **Don't** menumpuk kartu di dalam kartu (nested cards); gunakan garis pembatas atau pengelompokan daftar bersih.
- **Don't** menggunakan ikon di luar pustaka Lucide yang sudah distandarisasi stroke dan ukurannya.

