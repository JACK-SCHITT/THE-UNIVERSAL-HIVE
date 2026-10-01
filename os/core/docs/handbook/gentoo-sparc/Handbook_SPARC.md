# Handbook:SPARC

> Official Gentoo Wiki mirror for HIVE-OS / KRACKERJACK AI knowledge base.
> Canonical: https://wiki.gentoo.org/wiki/Handbook:SPARC

---

{{DISPLAYTITLE:Gentoo SPARC Handbook|noerror}} 
<translate>
<!--T:2-->
<noinclude>{{Handbook:Parts}}
[[Article description::A handbook dedicated to installing and configuring the {{Keyword|sparc}} architecture.]]</noinclude>
</translate>
{{#set: architecture=sparc
|root-partition=/dev/sda1
|swap-partition=/dev/sda2
|has-efi=0
|boot-partition=
|boot-partition-mount-point=/boot
|boot-partition-format=
|root-partition-mount-point=/
|root-partition-live-env-mount-point=/mnt/gentoo
|root-partition-format=xfs
|stage3-tarball-file=stage3-*.tar.xz
|cflags=-O2 -mcpu{{=}}ultrasparc -pipe
|kernel-version=6.19.3-gentoo
|linux-kernel-short-version=6.19.3
|kernel-sources=gentoo-sources
|supports-systemd=true
|main-ebuild-repository-location=/var/db/repos/gentoo
|portage-distdir-location=/var/cache/distfiles
|portage-binpkg-location=/var/cache/binpkgs
|deprecated-main-ebuild-repository-location=/usr/portage
|portage-deprecated-distdir-location=/usr/portage/distfiles
|portage-deprecated-binpkg-location=/usr/portage/packages
|efibootmgr-efi-file=bzImage.efi
|efibootmgr-efi-directory=\EFI\Gentoo
|efi-stub-kernel-directory=/EFI/Gentoo
|default-efi-file=BOOTX64.EFI
|default-efi-directory=/EFI/BOOT
|portage-deprecated-profile=17.1
|portage-stable-profile=23.0
|portage-unstable-profile=23.0
}}
