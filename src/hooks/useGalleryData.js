import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

// Default images with orientation flags
export const INITIAL_GALLERY_IMAGES = [
  {"src":"/assets/images/-rFLwEVuvrqY9r9MVYrwQkiRZJRDHYec5khQcRuGw-o.webp","type":"square"},
  {"src":"/assets/images/0_YhdghPOiArrs3Tm8.jpg","type":"landscape"},
  {"src":"/assets/images/105133923.avif","type":"square"},
  {"src":"/assets/images/1235381259.webp","type":"square"},
  {"src":"/assets/images/13195935.jpg","type":"landscape"},
  {"src":"/assets/images/19.avif","type":"square"},
  {"src":"/assets/images/1_DYLBFpwrCtUU8j2KCp-Nyw.jpg","type":"landscape"},
  {"src":"/assets/images/20220610000507_0.jpg","type":"landscape"},
  {"src":"/assets/images/27d0af746d5d49db88cb10c27a7b1b86.jpg","type":"landscape"},
  {"src":"/assets/images/2cool4skool.jpg","type":"landscape"},
  {"src":"/assets/images/56226047_3118043461546531_233561884924575744_o-660x400.jpg","type":"landscape"},
  {"src":"/assets/images/71UyLaq3H2L.jpg","type":"landscape"},
  {"src":"/assets/images/8085e61793fe884af0e4210c76778653.500x426x1.jpg","type":"landscape"},
  {"src":"/assets/images/artworks-000247986233-hheknl-t500x500.jpg","type":"square"},
  {"src":"/assets/images/artworks-000526833525-hgo7xg-t500x500.jpg","type":"square"},
  {"src":"/assets/images/bts-01-2020-new-years-rockin-eve-dec-31-2019-billboard-1548.webp","type":"square"},
  {"src":"/assets/images/BTS-awaited-their-award-with-prepared-an-speech.jpg","type":"landscape"},
  {"src":"/assets/images/bts-concert-1920-x-1080-picture-quogqof06g4312p9.jpg","type":"landscape"},
  {"src":"/assets/images/bts-concert-2048-x-996-picture-tfd3xhce25af1gmq.jpg","type":"landscape"},
  {"src":"/assets/images/bts-concert-back-view-on-stage-88kmx221ce9dd6hr.jpg","type":"landscape"},
  {"src":"/assets/images/bts-jin-entrance-ceremony-2022-billboard-1548.webp","type":"square"},
  {"src":"/assets/images/bts-loveyourselfanswer-1.jpg","type":"landscape"},
  {"src":"/assets/images/BTS-map-of-the-soul-7-press-01-2020-billboard-1548.webp","type":"square"},
  {"src":"/assets/images/bts-members-v-and-rm-162822395-3x4.webp","type":"square"},
  {"src":"/assets/images/BTS-RM-V-south-korean-military-service-061025-5-d27c1e2e4b4540bfb39ef1dedf8c3ce0.jpg","type":"landscape"},
  {"src":"/assets/images/bts-un-photo-1.jpg","type":"landscape"},
  {"src":"/assets/images/bts61729141272.webp","type":"square"},
  {"src":"/assets/images/bts_1691685217487_1691685217659.webp","type":"square"},
  {"src":"/assets/images/BTS_at_the_31st_Golden_Disk_Awards.jpg","type":"landscape"},
  {"src":"/assets/images/bts_jin_1674030576911_1674030589722_1674030589722.avif","type":"square"},
  {"src":"/assets/images/BTS_Kpop2015e_650.webp","type":"square"},
  {"src":"/assets/images/BTS_SKOOL_LUV_AFFAIR_INFOGRAPHIC.webp","type":"square"},
  {"src":"/assets/images/Concert 1.jpg","type":"portrait"},
  {"src":"/assets/images/Ct2aO1RUIAEKnHK.jpg","type":"landscape"},
  {"src":"/assets/images/d-daytour.webp","type":"square"},
  {"src":"/assets/images/darkandwild.jpg","type":"landscape"},
  {"src":"/assets/images/Descendants The Rise Of Red Bts.jpg","type":"square"},
  {"src":"/assets/images/download.jpg","type":"square"},
  {"src":"/assets/images/EaARHEUU8AIpZRz.jpg","type":"portrait"},
  {"src":"/assets/images/EtlAQ3yR_400x400.jpg","type":"square"},
  {"src":"/assets/images/FpzoiAfXwAAjgI9.jpg","type":"portrait"},
  {"src":"/assets/images/HD-wallpaper-bts-bangtan-bangtan-sonyeondan-be-be-album-bts-jin-kim-seokjin-kpop-min-yoongi-seokjin-thumbnail.jpg","type":"portrait"},
  {"src":"/assets/images/hq720.jpg","type":"landscape"},
  {"src":"/assets/images/images (1).jpg","type":"portrait"},
  {"src":"/assets/images/images (2).jpg","type":"square"},
  {"src":"/assets/images/images (3).jpg","type":"landscape"},
  {"src":"/assets/images/images (4).jpg","type":"square"},
  {"src":"/assets/images/images (5).jpg","type":"square"},
  {"src":"/assets/images/images (6).jpg","type":"portrait"},
  {"src":"/assets/images/images (7).jpg","type":"square"},
  {"src":"/assets/images/images (8).jpg","type":"square"},
  {"src":"/assets/images/images.jpg","type":"portrait"},
  {"src":"/assets/images/IMG_4180-scaled.webp","type":"square"},
  {"src":"/assets/images/imrs.avif","type":"square"},
  {"src":"/assets/images/jhope-hope-world.jpg","type":"landscape"},
  {"src":"/assets/images/Jungkook-Jimin-BTS-Discharged.webp","type":"square"},
  {"src":"/assets/images/l80220230222100129.webp","type":"square"},
  {"src":"/assets/images/lede.webp","type":"landscape"},
  {"src":"/assets/images/main-qimg-b56d51b393ee550c44f90a998f86e1be-lq.jpg","type":"landscape"},
  {"src":"/assets/images/original.avif","type":"square"},
  {"src":"/assets/images/orul82.jpg","type":"landscape"},
  {"src":"/assets/images/photo01-01-m.jpg","type":"landscape"},
  {"src":"/assets/images/photo02-01-m.jpg","type":"landscape"},
  {"src":"/assets/images/suga-03-RS-1800.webp","type":"square"},
  {"src":"/assets/images/unnamed (1).jpg","type":"landscape"},
  {"src":"/assets/images/unnamed.jpg","type":"landscape"},
  {"src":"/assets/images/We-Purple-You-edit-1024x944.jpg","type":"square"},
  {"src":"/assets/images/_ j-hope of BTS_Jack In The Box_Album Cover Artwork.webp","type":"square"},
  {"src":"/assets/images/방탄소년단_월드투어_콘서트서_‘美_젊은_층_마음_사로잡는다’_43784972734.jpg","type":"landscape"}
];

export default function useGalleryData() {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (data.galleryImages && Array.isArray(data.galleryImages)) {
            setGalleryImages(data.galleryImages);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch gallery config:", error);
      }

      // Check localStorage
      const saved = localStorage.getItem("galleryImages");
      if (saved) {
        setGalleryImages(JSON.parse(saved));
      } else {
        setGalleryImages(INITIAL_GALLERY_IMAGES);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const resetGallery = () => {
    setGalleryImages(INITIAL_GALLERY_IMAGES);
    localStorage.removeItem("galleryImages");
  };

  const addGalleryImage = (newImg) => {
    setGalleryImages(prev => {
      const updated = [newImg, ...prev];
      localStorage.setItem("galleryImages", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteGalleryImage = (srcToRemove) => {
    setGalleryImages(prev => {
      const updated = prev.filter(img => img.src !== srcToRemove);
      localStorage.setItem("galleryImages", JSON.stringify(updated));
      return updated;
    });
  };

  const updateGalleryImage = (src, updatedImg) => {
    setGalleryImages(prev => {
      const updated = prev.map(img => img.src === src ? { ...img, ...updatedImg } : img);
      localStorage.setItem("galleryImages", JSON.stringify(updated));
      return updated;
    });
  };

  return { galleryImages, loading, resetGallery, addGalleryImage, deleteGalleryImage, updateGalleryImage };
}
