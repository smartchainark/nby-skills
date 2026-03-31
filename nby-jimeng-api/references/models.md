# Jimeng AI Models & Resolution Reference

## Image Models

| User Model Name | Internal Model Name | Description |
|----------------|---------------------|-------------|
| `jimeng-5.0` | `high_aes_general_v50` | 5.0 (latest, highest quality) |
| `jimeng-5.0-preview` | `high_aes_general_v50` | 5.0 preview (alias, same as 5.0) |
| `jimeng-4.6` | `high_aes_general_v42` | Recommended stable model |
| `jimeng-4.5` | `high_aes_general_v40l` | High quality |
| `jimeng-4.1` | `high_aes_general_v41` | High quality |
| `jimeng-4.0` | `high_aes_general_v40` | Stable |
| `jimeng-3.1` | `high_aes_general_v30l_art_fangzhou` | Art style |
| `jimeng-3.0` | `high_aes_general_v30l` | General purpose |
| `jimeng-2.1` | - | Legacy |
| `jimeng-2.0-pro` | - | Legacy pro |
| `jimeng-2.0` | - | Legacy |
| `jimeng-1.4` | - | Early model |
| `jimeng-xl-pro` | - | XL pro |

**Recommendation:** Use `jimeng-4.6` for stable quality, `jimeng-5.0` for best quality.

## Video Models

| User Model Name | Internal Model Name | Description |
|----------------|---------------------|-------------|
| `jimeng-video-3.5-pro` | `dreamina_ic_generate_video_model_vgfm_3.5_pro` | Latest, recommended |
| `jimeng-video-3.0` | - | Video 3.0 |
| `jimeng-video-3.0-pro` | - | Video 3.0 pro |
| `jimeng-video-2.0` | - | Video 2.0 |
| `jimeng-video-2.0-pro` | - | Video 2.0 pro |
| `jimeng-video-seedance-2.0` | `dreamina_seedance_40_pro` | Seedance 2.0 (multimodal, recommended) |
| `seedance-2.0` | `dreamina_seedance_40_pro` | Alias for seedance-2.0 |
| `seedance-2.0-pro` | `dreamina_seedance_40_pro` | Alias for seedance-2.0 |
| `jimeng-video-seedance-2.0-fast` | `dreamina_seedance_40` | Seedance 2.0 fast |
| `seedance-2.0-fast` | `dreamina_seedance_40` | Alias for seedance-2.0-fast |

**Video duration:**
- Normal models (video-2.0/3.0/3.5): 5 or 10 seconds
- Seedance models: 4-15 seconds (continuous range)

**First/last frame support:**
- video-3.0, video-3.0-fast, video-3.0-pro: supported (via `file_paths`)
- video-2.0, video-s2.0: first frame only, no last frame

## Image Resolution

| Resolution | 1:1 | 4:3 | 3:4 | 16:9 | 9:16 | 3:2 | 2:3 | 21:9 |
|-----------|-----|-----|-----|------|------|-----|-----|------|
| 1k | 1024x1024 | 768x1024 | 1024x768 | 1024x576 | 576x1024 | 1024x682 | 682x1024 | 1195x512 |
| 2k | 2048x2048 | 2304x1728 | 1728x2304 | 2560x1440 | 1440x2560 | 2496x1664 | 1664x2496 | 3024x1296 |
| 4k | 4096x4096 | 4608x3456 | 3456x4608 | 5120x2880 | 2880x5120 | 4992x3328 | 3328x4992 | 6048x2592 |

## Video Resolution

| Resolution | 1:1 | 4:3 | 3:4 | 16:9 | 9:16 |
|-----------|-----|-----|-----|------|------|
| 480p | 480x480 | 640x480 | 480x640 | 854x480 | 480x854 |
| 720p | 720x720 | 960x720 | 720x960 | 1280x720 | 720x1280 |
| 1080p | 1080x1080 | 1440x1080 | 1080x1440 | 1920x1080 | 1080x1920 |
