# On-device vision ML runtimes for an Expo SDK 57 app (depth + segmentation), late 2026

## Runtimes: which ones fit Expo SDK 57 / New Architecture, what they ship, maintenance, licences

### Takeaway
Two React Native runtimes are viable on a New-Architecture-only Expo app in late 2026: **react-native-executorch** (Software Mansion), which already ships depth estimation, instance and semantic segmentation hooks with VisionCamera v5 frame support, and **react-native-fast-tflite** (Nitro, MIT), a thin LiteRT runner with CoreML/GPU/NNAPI delegates. onnxruntime-react-native has unresolved JSI install problems on the New Architecture. The platform-native APIs (Apple Vision subject lift, ML Kit subject segmentation, MediaPipe) fit only if wrapped in a custom Expo module, and ML Kit subject segmentation breaks the no-network rule.

### Cited Findings
**react-native-executorch (Software Mansion)**
- Requirements: New Architecture enabled, "React Native 0.83+ or Expo SDK 55+ with Development Builds", Expo Go not supported, react-native-worklets ">=0.10.0 <0.14.0", iOS 17.0+, Android 8.0+ (minSdk 26), and the worklets Babel plugin last — [GitHub README](https://github.com/software-mansion/react-native-executorch)
- v0.8.0 (3 Apr 2026) added `useInstanceSegmentation` (YOLO nano to xlarge, plus RF-DETR). Each instance has a label, score, bbox and a binary Uint8Array mask. It also renamed ImageSegmentation to `useSemanticSegmentation`, and all CV hooks now expose a `runOnFrame` worklet for VisionCamera v5 — [SWM blog v0.8.0](https://swmansion.com/blog/react-native-executorch-v0.8.0-a-library-milestone/), [newreleases v0.8.0](https://newreleases.io/project/github/software-mansion/react-native-executorch/release/v0.8.0), [useInstanceSegmentation API (0.10 legacy)](https://docs.swmansion.com/react-native-executorch/docs/0.10.0-legacy/api-reference/functions/useInstanceSegmentation)
- Instance segmentation example: `forward(image, { confidenceThreshold: 0.5, inputSize: 640 })` with `yolo26n-seg`. The current docs also cover choosing an instance by point, box or text prompt — [search summary of SWM docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useInstanceSegmentation)
- Depth estimation (PR #1552, merged 20 Oct 2026) is listed under Extensions. `useDepthEstimator`/`createDepthEstimator`, with `estimateDepth(imageBuffer)` returning a row-major `data` array with width/height. Models:
  - Depth Anything V2 Small: 35.5–99.0 MB, 518×518, relative inverse depth
  - Depth Anything 3 Small: 40.7–106.5 MB, 518×518, relative depth
  - ZipDepth Base: 12.8–24.9 MB, 384×384

  Backends: XNNPACK (CPU), Core ML (Apple), Vulkan (Android). Custom `.pte` loads via `modelPath` — [Depth Estimation docs](https://docs.swmansion.com/react-native-executorch/docs/extensions/depth-estimation), [PR #1552](https://github.com/software-mansion/react-native-executorch/pull/1552)
- The depth docs give no latency or memory numbers; they point to the example app's latency tracking — [Depth Estimation docs](https://docs.swmansion.com/react-native-executorch/docs/extensions/depth-estimation)
- Since v0.8 you must call `initExecutorch()` with a resource-fetcher adapter (expo or bare) before any hook — [SWM blog v0.8.0](https://swmansion.com/blog/react-native-executorch-v0.8.0-a-library-milestone/)
- I found no SAM / MobileSAM / EdgeSAM hook. Promptable selection is offered only as point/box/text selection among the instance-segmentation outputs (see above).

**react-native-fast-tflite (mrousavy / Margelo)**
- Built on Nitro Modules, MIT licence.
  - Delegates: CoreML on iOS; Android GPU and NNAPI, with GPU preferred because NNAPI is deprecated on Android 15.
  - The Expo config plugin takes `enableCoreMLDelegate` and `enableAndroidGpuLibraries` (adds `libOpenCL.so` to the manifest).
  - Models load from `require(...)` bundled assets or from `file://`/`http(s)://` URLs; add `tflite` to Metro `assetExts`.
  - VisionCamera v5 worklets can call HybridObjects directly, and `react-native-vision-camera-resizer` resizes frames to the model input.
  - The author calls it "as-is", maintained in his free time, with paid enterprise support. 1.2k stars, 32 open issues, v2→v3 migration guide.
  - [GitHub](https://github.com/mrousavy/react-native-fast-tflite)
- It is a generic interpreter: no pre/post-processing (NMS, mask decoding, depth normalisation) is included — [GitHub](https://github.com/mrousavy/react-native-fast-tflite) (inferred from feature list; nothing task-specific is listed)

**onnxruntime-react-native (Microsoft)**
- A 2026 field report on RN 0.88 (New Architecture): the package throws at module load unless its JSI API was installed first. RN treats that as fatal even inside try/catch. Workaround: check `globalThis.OrtApi`, call `NativeModules.Onnxruntime.install()`, then `require('onnxruntime-react-native')`. The authors say the root problem is still open — [dev.to, SigLIP 2 on-device](https://dev.to/vdrosatos/phone-first-cloud-when-unsure-on-device-siglip-2-vs-gemini-on-3170-waste-photos-1kkd)
- The same report: `ConvInteger` int8 ONNX models do not load on onnxruntime's CPU EP — [dev.to](https://dev.to/vdrosatos/phone-first-cloud-when-unsure-on-device-siglip-2-vs-gemini-on-3170-waste-photos-1kkd)
- Expo SDK 55+ cannot fall back to the legacy architecture — [Expo on X](https://x.com/expo/status/2026811977990025364), [dainemawer.com](https://www.dainemawer.com/react-native-new-architecture-expo-sdk-55)

**Apple Vision framework (iOS, needs a Swift Expo module)**
- `VNGenerateForegroundInstanceMaskRequest` (iOS 17+) is class-agnostic subject lifting. It returns a `VNInstanceMaskObservation`: a UInt8 instance-label `CVPixelBuffer`, `allInstances`, `instanceAtPoint(_:)` for tap-to-select, and soft masks at image resolution. There are no class labels, it does not work in the iOS Simulator, and nothing is downloaded or bundled — [WWDC23 notes](https://wwdcnotes.com/documentation/wwdc23-10176-lift-subjects-from-images-in-your-app/), [axiom-vision-ref](https://lobehub.com/skills/charleswiltgen-axiom-axiom-vision-ref), [artemnovichkov.com](https://artemnovichkov.com/blog/remove-background-from-image-in-swiftui)
- An existing Expo module pairs Vision (iOS) with ML Kit subject segmentation (Android) for on-device subject lift — [critterpass PR #104](https://github.com/critterpass/critterpass/pull/104)

**ML Kit subject segmentation (Android)**
- Unbundled only: `play-services-mlkit-subject-segmentation:16.0.0-beta1` (still beta as of the 26 Oct 2026 release notes). The model comes through Google Play services, either at install (manifest `com.google.mlkit.vision.DEPENDENCIES=subject_segment`), via `ModuleInstallClient`, or on first use. No bundled artifact exists, and there is no iOS version — [ML Kit docs](https://developers.google.com/ml-kit/vision/subject-segmentation/android), [installation paths](https://developers.google.com/ml-kit/tips/installation-paths), [release notes](https://developers.google.com/ml-kit/release-notes), [laybell PR #2](https://github.com/3ddies/laybell/pull/2)

**MediaPipe Tasks (Interactive Segmenter / Image Segmenter)**
- Runs on Web, Android, iOS, Python and Flutter. Packages: `com.google.mediapipe:tasks-vision` and `MediaPipeTasksVision` (SwiftPM) — [Interactive Segmenter guide](https://ai.google.dev/edge/mediapipe/solutions/vision/interactive_segmenter)
- MagicTouch v1:
  - MobileNetV3-like CNN, 512×512×4 float32
  - Pixel 6: 130 ms CPU, 67 ms GPU

  MagicTouch v2:
  - INT8, 768×768, `interactive_segmentation.task` of 30,525,312 bytes
  - Encodes the image once, then refines with positive and negative strokes
  - Pixel 10: 208 ms CPU, 581 ms GPU (GPU is slower)

  [HF litert-community](https://huggingface.co/litert-community/MediaPipe-InteractiveSegmenter-MagicTouch), [MediaPipe issue #6400](https://github.com/google-ai-edge/mediapipe/issues/6400), [developers.google.com Interactive Segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/interactive_segmenter)
- Licence uncertainty: the model card's Apache-2.0 describes the 2023 512×512 model, and it is unclear whether it covers v2 — [MediaPipe issue #6400](https://github.com/google-ai-edge/mediapipe/issues/6400)
- Web `@mediapipe/tasks-vision` loads models from `storage.googleapis.com` URLs by default. A local `.task` file must be supplied instead to stay offline — [npmx tasks-vision](https://npmx.dev/package/@mediapipe/tasks-vision)

**Model licences (relevant to what gets bundled)**
- Ultralytics YOLO (v8/11/26, including trained weights) is AGPL-3.0. A closed-source product needs the paid Enterprise Licence or must open-source the whole app — [Ultralytics licence](https://www.ultralytics.com/license), [Ultralytics blog](https://www.ultralytics.com/blog/is-yolo-free-for-commercial-use)
- RF-DETR: the package and the Apache-designated weights (roughly Nano–Large) are Apache-2.0. XL/2XL and some others are PML 1.0. RT-DETR (Baidu original), D-FINE and YOLOX are Apache-2.0 — [eurthtech](https://www.eurthtech.com/post/is-yolo-free-for-commercial-use-agpl-apache-alternatives), [savant-ai](https://savant-ai.io/blog/yolo-commercial-licensing/)
- Apple's Core ML Depth Anything V2 Small is Apache-2.0 — [HF apple/coreml-depth-anything-v2-small](https://huggingface.co/apple/coreml-depth-anything-v2-small)

### Inferences
- react-native-executorch is the only RN library that already covers both tasks (depth plus instance segmentation) with tested pre/post-processing and Core ML/Vulkan/XNNPACK backends. Its depth feature is about a month old (merged Oct 2026), so expect churn.
- fast-tflite needs NMS, prototype-mask decoding and depth normalisation written by hand, in JS or worklets. That is more code but fewer moving parts, and models from LiteRT / Qualcomm AI Hub drop in directly.
- ML Kit subject segmentation should be ruled out under "no network ever": the model comes from Play services, even if Play does the fetching. Apple Vision is fine: it is part of the OS and has zero model weight.
- onnxruntime-react-native is the riskiest choice on SDK 57 (RN ≥0.83) given the JSI install issue.
- If the app is not open source, Ultralytics YOLO-seg weights are a licensing problem. RF-DETR-Seg (Apache sizes) or a DeepLab/MobileNet-style semantic model avoids it.

### Gaps
- Exact licence and current npm version of react-native-executorch (the README fetch did not state the licence; I believe it is MIT but did not verify).
- Whether onnxruntime-react-native has published a New-Architecture fix by late 2026 (npm page returned 403; no GitHub issue found).
- No official Expo SDK 57-specific compatibility statement for any of these libraries; the stated requirements are SDK 55+ (executorch) or none (fast-tflite).
- Whether react-native-executorch's instance segmentation includes non-Ultralytics weights for all sizes, and their licences.

## VisionCamera frame processors vs a still photo; preprocessing and drawing masks

### Takeaway
For wall-angle and hold segmentation, a single still photo (expo-camera or expo-image-picker) run once through the model is enough and much simpler. VisionCamera v5 (Nitro, April 2026) is mature if live preview is wanted later, and executorch hooks plug into it via `runOnFrame`.

### Cited Findings
- VisionCamera v5 (April 2026) is a full rewrite on Nitro Modules:
  - Frame processor plugins are Nitro HybridObjects, the engine is decoupled from any one worklets implementation, and it adds a GPU-accelerated resizer, depth streaming and in-memory Photo objects.
  - Requires `react-native-nitro-modules`, `react-native-nitro-image`, `react-native-vision-camera-worklets` and SWM `react-native-worklets`.
  - 5.1.0 (1 Jul 2026) renamed Frame Output to Frame Processors; 5.2.3 (20 Aug 2026) moved to Nitro 0.37; v5.2.4 came out on 29 Oct 2026.
  - [Margelo blog](https://margelo.com/blog/whats-new-in-visioncamera-v5), [releases](https://github.com/margelo/react-native-vision-camera/releases), [lobehub skill summary](https://lobehub.com/skills/margelo-react-native-skills-react-native-vision-camera)
- Third-party v5 plugins list RN 0.81+, iOS 15.1+, minSdk 26 and Expo 54+ as minimums — [vision-camera-ocr-plus discussion](https://github.com/jamenamcinteer/react-native-vision-camera-ocr-plus/discussions/131)
- fast-tflite's frame example uses `react-native-vision-camera-resizer` to produce e.g. 192×192 RGB uint8 input — [fast-tflite README](https://github.com/mrousavy/react-native-fast-tflite)
- executorch CV hooks take an `ImageBuffer` (from `react-native-executorch/cv`) or an image, and expose `runOnFrame` for VisionCamera v5 — [Depth docs](https://docs.swmansion.com/react-native-executorch/docs/extensions/depth-estimation), [SWM blog](https://swmansion.com/blog/react-native-executorch-v0.8.0-a-library-milestone/)
- executorch instance masks come back as `Uint8Array` binary masks with `maskWidth`/`maskHeight`, and depth as a row-major array. Both are ready to turn into an image or Skia texture — [SWM docs](https://docs.swmansion.com/react-native-executorch/docs/0.10.0-legacy/api-reference/functions/useInstanceSegmentation), [Depth docs](https://docs.swmansion.com/react-native-executorch/docs/extensions/depth-estimation)
- Apple Vision returns masks as `CVPixelBuffer`s at image resolution, with `instanceAtPoint` for tap-to-select — [axiom-vision-ref](https://lobehub.com/skills/charleswiltgen-axiom-axiom-vision-ref)

### Inferences
- With a still photo, preprocessing (resize to 518 or 640, normalise) costs one call per analysis. With executorch it happens natively inside the library; with fast-tflite, doing it in JS on a 518×518×3 float array is acceptable for a one-shot run, and Skia or the resizer plugin can do it natively.
- Drawing masks: the app already uses react-native-svg (the MoonBoard wall). Polygons or contours traced from masks are a good fit for SVG, and per-pixel overlays (depth heatmap, soft masks) fit `@shopify/react-native-skia` image or shader rendering. Skia would be a new dependency and must stay off the launch path.
- A still-photo flow avoids VisionCamera entirely. expo-camera is already a dependency (used by `scan.tsx`).

### Gaps
- I found no measurement comparing JS-side and native preprocessing cost for one-shot inference.
- Whether `react-native-vision-camera-resizer` works on still images (not frames) was not verified.

## Web (nice-to-have): onnxruntime-web / transformers.js / MediaPipe web with bundled models

### Takeaway
On web, Transformers.js (onnxruntime-web, WebGPU or WASM) can run Depth Anything fully offline if every model file and WASM binary is served from the static build. Set `env.allowRemoteModels = false` and `env.allowLocalModels = true` before creating any pipeline. MediaPipe web needs the local `.task` file passed in the same way.

### Cited Findings
- `device: 'webgpu'` selects the GPU; the browser default is CPU/WASM. `dtype` is one of fp32 (WebGPU default), fp16, q8 (WASM default) or q4, and fp16 is the fallback if fp32 fails on WebGPU — [transformers.js skill](https://github.com/huggingface/skills/blob/main/skills/transformers-js/SKILL.md), [CONFIGURATION.md](https://github.com/huggingface/skills/blob/main/skills/transformers-js/references/CONFIGURATION.md)
- Offline setup — [env docs](https://huggingface.co/docs/transformers.js/api/env), [custom usage](https://huggingface.co/docs/transformers.js/custom_usage), [CONFIGURATION.md](https://github.com/huggingface/skills/blob/main/skills/transformers-js/references/CONFIGURATION.md):
  - Set `env.allowRemoteModels = false` (it defaults to true).
  - `env.allowLocalModels` defaults to false in browsers, so set it to true.
  - `env.localModelPath` defaults to the `/models/` URL path.
  - `env.backends.onnx.wasm.wasmPaths` selects where the WASM files come from.
  - All of these must be set before the pipeline is created.
- Depth Anything is a supported Transformers.js architecture — [transformers.js GitHub](https://github.com/huggingface/transformers.js/)

### Inferences
- By default, Transformers.js fetches the ONNX Runtime WASM from a CDN and models from the HF Hub. Both must be overridden to satisfy "no network requests"; the app's own static origin then serves them. Loading a model from the app's own static host is a request to the same origin the app came from; whether that counts as acceptable is a product decision.
- A fp16 Depth Anything V2 Small file is roughly 50 MB, judging by Apple's Core ML fp16 size of 49.8 MB. Fetching it lazily on first use of the feature keeps web startup instant.

### Gaps
- No sizes found for onnx-community/depth-anything-v2-small `model_fp16`/`q4` files, and no WebGPU latency numbers on phones.
- Whether Expo web's Metro bundler serves `.onnx`/`.wasm` assets without extra config was not checked.

## Measured latency and memory on phones

### Takeaway
Depth Anything V2 Small runs in about 31–34 ms on iPhone 12 Pro Max and 15 Pro Max (Core ML fp16, Neural Engine), and about 21–67 ms on Snapdragon NPUs (8 Elite to 8 Gen 1, TFLite via QNN). Nano-size segmentation models run in single-digit ms on NPUs and about 15 ms end to end on iPhone. EdgeSAM is the only SAM variant that is near real time on phones (about 26 ms encoder on iPhone 14); MobileSAM runs at about 5 FPS. For a one-shot photo analysis, every option is well under a second on mid-range hardware, except CPU-only fallbacks.

### Cited Findings
**Depth**
- Apple's Core ML Depth Anything V2 Small (24.8M params) — [HF apple/coreml-depth-anything-v2-small](https://huggingface.co/apple/coreml-depth-anything-v2-small):
  - F32 is 99.2 MB; F16 is 49.8 MB (abs-rel 0.0089 against 0.0072 for F32).
  - F16 latency, Neural Engine: iPhone 12 Pro Max 31.1 ms, iPhone 15 Pro Max 33.9 ms, M1 Max 32.8 ms, M3 Max 24.6 ms.
  - Evaluation images were stretched to 518×396.
- Qualcomm AI Hub Depth-Anything-V2, TFLite float on NPU — [qualcomm/Depth-Anything-V2](https://huggingface.co/qualcomm/Depth-Anything-V2), [socket.dev mirror](https://socket.dev/huggingface/package/qualcomm/depth-anything-v2?type=model):
  - Snapdragon 8 Elite Gen 5: 16.0 ms; 8 Elite: 20.9 ms; 8 Gen 3: 30.7 ms; 8 Gen 1: 66.6 ms.
  - SA7255P on CPU: 1232 ms.
  - Peak memory is reported up to about 376 MB.
  - Older card versions showed very different numbers (e.g. QCS8550 at 329 ms, then 85 ms, then 42.9 ms), so treat them as version-dependent.
- Qualcomm, 8 Gen 3: Depth-Anything V1 small 39.1 ms, V3 small 47.8 ms — [qualcomm/Depth-Anything](https://huggingface.co/qualcomm/Depth-Anything), [qualcomm/Depth-Anything-V3](https://huggingface.co/qualcomm/Depth-Anything-V3/blob/main/README.md)

**Segmentation and detection**
- YOLO11n-seg on Qualcomm NPU, TFLite float, inference only: 8 Gen 1 9.4 ms, 8 Gen 3 3.2 ms, 8 Elite 2.4 ms, 8 Elite Gen 5 2.0 ms — [qualcomm/YOLOv11-Segmentation](https://huggingface.co/qualcomm/YOLOv11-Segmentation)
- YOLO11n-seg: 2.9M params, 9.7 GFLOPs, 65.9 ms on a server CPU — [YOLO26 paper summary](https://www.researchgate.net/publication/405852331_Ultralytics_YOLO26_Unified_Real-Time_End-to-End_Vision_Models)
- Ultralytics iOS app, segment at 640 (360×640): 15.8 ms against 13.2 ms (two variants; device not stated in the snippet) — [yolo-ios-app performance.md](https://github.com/ultralytics/yolo-ios-app/blob/main/docs/performance.md)
- EdgeSAM (9.6M params, 22.1 GFLOPs) runs at 38.7 FPS on iPhone 14 (Core ML), against 4.9 FPS for MobileSAM (9.8M params, 38.2 GFLOPs). The image encoder takes about 26 ms (v2 paper); the v1 summary splits it into a 14 ms encoder and a 12 ms decoder, so the sources disagree. Per the authors, MobileSAM and EfficientSAM are poorly optimised for the ANE — [EdgeSAM paper v2](https://arxiv.org/abs/2312.06660v2), [EdgeSAM GitHub](https://github.com/chongzhou96/EdgeSAM)
- MediaPipe MagicTouch v1: Pixel 6 130 ms CPU, 67 ms GPU. v2: Pixel 10 208 ms CPU, 581 ms GPU — [HF litert-community](https://huggingface.co/litert-community/MediaPipe-InteractiveSegmenter-MagicTouch), [Google docs](https://developers.google.com/edge/mediapipe/solutions/vision/interactive_segmenter)

### Inferences
- Qualcomm numbers come from QNN/NPU paths. Through fast-tflite's GPU delegate or executorch's Vulkan/XNNPACK backends on a mid-range phone (Snapdragon 7-series, Exynos, Tensor), expect several times slower: an estimated 100–500 ms for Depth Anything V2 Small, which is still fine for a one-shot photo. This is unmeasured.
- Peak memory for Depth Anything V2 Small is in the low hundreds of MB. Load it only when the feature screen opens and release it after.

### Gaps
- No published react-native-executorch latency or memory numbers for its depth or instance-segmentation models.
- No MiDaS-small mobile benchmark found in this pass.
- No mid-range (non-flagship) Android numbers for Depth Anything through LiteRT GPU or XNNPACK.
- Ultralytics' refreshed iPhone 17 Pro / LiteRT tables (PR #26874) were not retrieved — [PR #26874](https://github.com/ultralytics/ultralytics/pull/26874)

## Model delivery without network; quantisation; lazy loading

### Takeaway
Bundle the models in the app binary as plain assets (`require('./model.pte')` / `.tflite` / `.mlpackage`), fp16 or int8, roughly 15–50 MB for depth and a few MB for a nano segmenter. Load them only when the feature opens. Store size limits are not a constraint at this scale. Play Asset Delivery and Apple's Background Assets are store or OS downloads; install-time PAD packs are arguably acceptable, but they are unnecessary under about 200 MB and break sideloaded APKs, which matters because this app builds its release APK locally.

### Cited Findings
- executorch resource sources can be a remote URL, an absolute local path, or a bundled `require('./model.pte')` asset number. Bundled assets resolve through expo-asset in Expo, and local paths are used as-is with no download. The Expo guide recommends `require()` for assets under 512 MB, and downloaded files live in `{Documents}/react-native-executorch/` — [Mintlify Resource Fetching](https://www.mintlify.com/software-mansion/react-native-executorch/core-concepts/resource-fetching), [Expo setup](https://www.mintlify.com/software-mansion/react-native-executorch/guides/expo-setup)
- Offline gotcha: the fetcher sends a HEAD request for each remote source before noticing that the file is cached, with no timeout. Private Mind fixed this by passing local `file://` paths instead of URLs — [private-mind PR #447](https://github.com/software-mansion-labs/private-mind/pull/447)
- A custom `ResourceFetcherAdapter` (`fetch`, `readAsString`) can be supplied instead of the Expo one — [Custom Adapter docs](https://docs.swmansion.com/react-native-executorch/docs/resource-fetcher/custom-adapter)
- fast-tflite loads from `require()` bundled assets or `file://` paths (so a user-side-loaded model file works) — [fast-tflite README](https://github.com/mrousavy/react-native-fast-tflite)
- Quantisation: Depth Anything V2 Small Core ML is 99.2 MB in fp32 and 49.8 MB in fp16 — [HF apple](https://huggingface.co/apple/coreml-depth-anything-v2-small). executorch variants: DAv2 Small 35.5–99 MB, ZipDepth 12.8–24.9 MB — [executorch depth docs](https://docs.swmansion.com/react-native-executorch/docs/extensions/depth-estimation)
- Google Play limits (compressed download) — [Play size limits](https://support.google.com/googleplay/android-developer/answer/9859372):
  - Base module 500 MB; individual asset pack 1.5 GB.
  - Install-time total 4 GB; on-demand plus fast-follow 30 GB.
  - Legacy APK cap 100 MB.
- Play Asset Delivery — [PAD docs](https://developer.android.com/guide/playcore/asset-delivery):
  - Install-time packs are split APKs delivered with the install and usable at launch.
  - Fast-follow packs download automatically after install.
  - On-demand packs are downloaded while the app runs.
  - All packs are hosted and served by Google Play; the docs don't cover sideloaded builds.
- Apple: 200 MB over-the-air (cellular) threshold, a soft prompt since iOS 13 rather than a block; 4 GB maximum uncompressed IPA — [Newly guide](https://newly.app/guides/ios-app-size-limit-cellular), [MacRumors](https://www.macrumors.com/how-to/download-large-apps-over-cellular-iphone-ipad/), [adapty](https://adapty.io/glossary/app-size/)
- ML Kit unbundled models live in Play services storage and are updated by it — [installation paths](https://developers.google.com/ml-kit/tips/installation-paths)

### Inferences
- One ~25–50 MB depth model plus a ~3–12 MB segmenter keeps the app far under 200 MB on both stores. PAD and On-Demand Resources add complexity, and PAD fails for the locally built sideloaded APK this project produces (`npm run build:android`), so plain bundling is the robust choice.
- An install-time PAD pack is technically fetched by the Play Store, not the app. It is arguably within "the app makes no network requests", but fast-follow and on-demand packs, ML Kit unbundled models and Apple Background Assets are downloads after install, which goes against the spirit of the rule.
- Instant startup: `require()` of an asset only registers a module id. The file is not read until the runtime loads it. Load the model in the feature screen (e.g. on mount or on a "Analyse" tap) through a lazily imported module, so neither the native library init nor the model file sits on the Home path. With executorch, `initExecutorch()` is called "at the entry point" per its docs; check whether it can be deferred to the feature screen (unverified).
- On Android, large `.tflite`/`.pte` assets should be stored uncompressed (aapt `noCompress`) so they can be memory-mapped. This is unverified for Expo's asset pipeline, so check that after prebuild.
- User side-loading (expo-document-picker to file:// to `loadTensorflowModel({url})` or an executorch local path) is possible with both libraries, as an optional extra for larger models.

### Gaps
- Apple Background Assets and On-Demand Resources rules were not fetched in this pass.
- Whether Expo's asset pipeline compresses large binary assets in APKs, and whether that slows the first load.
- Whether `initExecutorch` does any I/O or network at init.

## Recommendation: simplest robust stack

### Takeaway
Use **react-native-executorch** with models bundled through `require()` (passed as local sources, never URLs). It gives depth (Depth Anything V2 Small, or ZipDepth for size) and instance segmentation through one dependency with Core ML / Vulkan / XNNPACK backends. Feed it a single still photo from the existing expo-camera, and draw the results with SVG or Skia. Keep **fast-tflite** as the fallback if executorch's young depth API or its worklets version pin conflicts with the app. On iOS, Apple Vision subject lift (a small Swift Expo module) is an optional zero-weight extra for tap-to-select masks.

### Cited Findings
- executorch supports Expo SDK 55+ dev builds and the New Architecture, ships depth and instance-segmentation hooks, and accepts bundled assets — [README](https://github.com/software-mansion/react-native-executorch), [Depth docs](https://docs.swmansion.com/react-native-executorch/docs/extensions/depth-estimation), [Resource fetching](https://www.mintlify.com/software-mansion/react-native-executorch/core-concepts/resource-fetching)
- fast-tflite is MIT, Nitro-based, has an Expo plugin and loads bundled models — [README](https://github.com/mrousavy/react-native-fast-tflite)
- Depth Anything V2 Small runs in about 31–34 ms on iPhone (Core ML fp16) — [HF apple](https://huggingface.co/apple/coreml-depth-anything-v2-small)
- onnxruntime-react-native has a JSI install crash on the New Architecture — [dev.to](https://dev.to/vdrosatos/phone-first-cloud-when-unsure-on-device-siglip-2-vs-gemini-on-3170-waste-photos-1kkd)
- ML Kit subject segmentation is Play-services-delivered only — [ML Kit docs](https://developers.google.com/ml-kit/vision/subject-segmentation/android)

### Inferences
- Constraints to verify on prototyping:
  - executorch pins react-native-worklets to `>=0.10 <0.14`, which must match the Reanimated / worklets version that Expo SDK 57 ships.
  - executorch requires iOS 17+.
  - Its resource fetcher sends HEAD requests for URL sources (avoid by passing only local and bundled sources).
- For holds on a climbing wall, a generic COCO instance segmenter will not recognise holds, so a custom fine-tuned model (exported to `.pte` or `.tflite`) is likely needed whichever runtime is chosen. Pick an Apache-licensed base model (RF-DETR-Seg Nano/Small, DeepLab/MobileNet), not Ultralytics, unless AGPL is acceptable.
- Web: Transformers.js depth with locally served files, loaded only on the feature route. Segmentation on web would need the same model exported to ONNX.

### Gaps
- No hands-on confirmation that executorch builds cleanly on Expo SDK 57 (released after the docs' stated SDK 55 minimum).
- Hold-specific segmentation model availability is outside this note's scope.
