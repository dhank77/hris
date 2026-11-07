# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Karyawan sebagai pengguna utama, memakai HP maupun desktop untuk absen harian, mengajukan izin/cuti, dan mengajukan kasbon. Admin/HR, atasan, dan finance adalah peran sekunder yang menyetujui pengajuan dan mencairkan kasbon.

## Product Purpose

HRIS internal untuk mencatat kehadiran, mengelola pengajuan izin/cuti, dan mengelola kasbon (pengajuan, persetujuan berjenjang, pencairan, cicilan, potong payroll). Sukses berarti karyawan menyelesaikan tugas harian dengan cepat dan pemberi persetujuan melihat status dengan jelas.

## Operating Context

Absen dilakukan di jalan atau di kantor lewat HP. Persetujuan kasbon berjenjang: level 1, finance, lalu pencairan, dengan cicilan yang ditandai lunas atau dipotong dari payroll.

## Capabilities and Constraints

- Stack: Laravel, Inertia v3, React, Tailwind v4, shadcn-style UI components, Wayfinder.
- Halaman: welcome, auth (login, register, reset, 2FA, passkey), dashboard, absensi (index, riwayat, rekap), izin/cuti, kasbon, pengaturan (profil, keamanan, tampilan).
- Bahasa UI: Indonesia.
- Dashboard saat ini placeholder; akan diisi ringkasan karyawan dari data yang sudah ada.

## Brand Commitments

Nama produk tetap "HRIS". Logo bawaan Laravel diganti dengan logo baru.

## Product Principles

- Tugas harian (absen, ajukan, cek status) harus selesai dalam hitungan detik.
- Status pengajuan selalu terbaca jelas tanpa membuka detail.
- Mobile-first untuk karyawan, tetap padat dan efisien di desktop.
- Hanya tampilkan data yang benar-benar ada; jangan mengarang angka.

## Accessibility & Inclusion

Kontras terbaca di luar ruangan pada HP; target sentuh memadai; dukungan mode terang/gelap yang sudah ada dipertahankan.
