# Estimating a climbing wall's overhang angle from one phone photo, on-device and offline

Notes as of 2026-11-25. Scope: MoonBoard (25°/40°), home spray walls, gym walls 0–60° past vertical. Target accuracy ±2–3°.

A geometric fact frames everything below. The overhang angle is the angle between the wall plane and **gravity** (overhang = 90° − angle between the wall normal and the vertical, or the angle between the wall's up-direction and true vertical). Every image-only method (depth, normals, vanishing points, homography) gives the wall's orientation **in the camera frame**. Turning that into an overhang angle needs the camera's orientation with respect to gravity, either from the phone's accelerometer at capture time or from a gravity cue in the image (floor plane, plumb vertical edges). So the IMU is needed in practice for every option, and the error budget is image-plane error plus IMU tilt error.

## Monocular depth / normal models: which output what, and does relative depth suffice?

### Takeaway
Affine-invariant (relative) depth or disparity, which is what Depth Anything V2 relative, MiDaS and Marigold output, does **not** preserve plane angles. You also need the depth shift and the focal length. Models that output metric point maps plus intrinsics (MoGe-2, Depth Pro, UniDepthV2, Metric3D v2, DA3-Metric) or normals directly (MoGe-2-normal, Metric3D v2, DSINE, Lotus, StableNormal) are the right family. Published normal errors are about 9–20° *mean per pixel* on NYUv2/ScanNet, far worse than ±2–3° per pixel. Fitting one plane over a large, textured, planar region averages much of that error away, but no benchmark reports whole-plane orientation error, so the ±2–3° target is unproven for this route. The best licence/size fit for an app is MoGe-2 ViT-S-normal (35M parameters; code MIT, weights reportedly MIT). Depth Anything V2-Small (24.8M, Apache-2.0) gives only relative depth and needs shift and focal recovery.

### Cited Findings
**Why relative depth is not enough**
- Yin et al. (CVPR 2021, LeReS): depth models trained on mixed data "cannot be used to recover accurate 3D scene shape" because of an unknown depth shift from shift-invariant losses and an unknown focal length. An unknown scale causes no shape distortion, but an unknown shift does. Focal length distorts shape because it scales x and y but not z. They add a Point Cloud Module that predicts the shift and the focal length, which "can fail" on some scenes. — [arXiv 2012.09365](https://arxiv.org/abs/2012.09365); [CVPR paper](https://openaccess.thecvf.com/content/CVPR2021/papers/Yin_Learning_To_Recover_3D_Scene_Shape_From_a_Single_Image_CVPR_2021_paper.pdf)
- Metric3D v2 stresses that accurate intrinsics are "imperative for metric estimation from a single image". Its canonical camera transform is "executed using camera intrinsics". — [arXiv 2404.15506](https://arxiv.org/html/2404.15506v4)

**Depth Anything V2 (June 2024)**
- Parameter counts: Small 24.8M, Base 97.5M, Large 335.3M, Giant 1.3B. Licence: "Depth-Anything-V2-Small model is under the Apache-2.0 license. Depth-Anything-V2-Base/Large/Giant models are under the CC-BY-NC-4.0 license." It uses a DPT head on a DINOv2 backbone. Metric variants (Hypersim indoor ≤20 m, VKITTI outdoor ≤80 m) were released 2024-06-22. — [GitHub DepthAnything/Depth-Anything-V2](https://github.com/DepthAnything/Depth-Anything-V2); [HF Small card](https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf)
- Qualcomm AI Hub ships DA-V2-Small at 518×518 input: 24.7M parameters, 94.3 MB in float. The page lists the licence as MIT, which conflicts with the upstream Apache-2.0; upstream is authoritative. No latency was shown on the page fetched. — [Qualcomm AI Hub](https://aihub.qualcomm.com/models/depth_anything_v2)

**Depth Anything 3 (ByteDance Seed, 14 Nov 2025)**
- Paper: "Depth Anything 3: Recovering the Visual Space from Any Views". It uses a custom architecture, not HF-Transformers compatible. Sizes: DA3-Small 80M, Base 220M, Large 350M, Giant 1.15B, Mono-Large 350M, Metric-Large 350M, Nested-Giant-Large 1.4B. — [ComfyUI-DepthAnythingV3](https://github.com/PozzettiAndrea/ComfyUI-DepthAnythingV3)
- Licences: Small, Base, Metric-Large and Mono-Large are Apache-2.0; Large, Giant and Nested are CC BY-NC 4.0. The HF card for DA3-LARGE confirms 0.35B parameters under CC BY-NC 4.0. Sources disagree on the details, so check each card. — [Ultralytics comparison](https://www.ultralytics.com/blog/best-depth-estimation-models); [HF DA3-LARGE](https://huggingface.co/depth-anything/DA3-LARGE)
- Qualcomm AI Hub has a DA3-Small export: 24.7M parameters, 94.3 MB, 518×518. This conflicts with the 80M figure above and may count only part of the model. — [Qualcomm AI Hub DA3](https://aihub.qualcomm.com/models/depth_anything_v3)

**Apple Depth Pro (Oct 2024) and Depth Pro 2 (19 Nov 2026)**
- Depth Pro gives metric depth with no intrinsics needed. It estimates the focal length itself (`focallength_px`). It makes a 2.25 MP map in 0.3 s on a V100 GPU (server class, not a phone). — [arXiv 2410.02073](https://arxiv.org/abs/2410.02073); [GitHub apple/ml-depth-pro](https://github.com/apple/ml-depth-pro/tree/main)
- The original Depth Pro licence is Apple's own and not OSI-approved, and commercial use is unclear. — [depthpro-mlx notes](https://github.com/toannd99/depthpro-mlx)
- Depth Pro 2 comes in sizes S/B/L/H (H+ 872M) with a shared 23.5M focal estimator. Its weights are under the Apple Machine Learning Research Model licence, which is research and non-commercial only. It was released without a paper or benchmarks. — [HF apple/DepthPro2-H](https://huggingface.co/apple/DepthPro2-H); [HF DepthPro2-focal](https://huggingface.co/apple/DepthPro2-focal); [emergent.sh](https://emergent.sh/news/apple-depth-pro-2-launches-without-research)

**MoGe / MoGe-2 (Microsoft; MoGe CVPR'25 oral, MoGe-2 NeurIPS 2025, arXiv 2507.02546)**
- MoGe-2 gives a metric point map, depth, normals and camera FOV/intrinsics from one image in one forward pass. Points and normals are in the OpenCV camera frame. MoGe v1 predicted affine-invariant point maps. — [GitHub microsoft/MoGe](https://github.com/microsoft/moge); [arXiv 2507.02546](https://arxiv.org/pdf/2507.02546)
- Checkpoints: moge-2-vitl 326M (no normals), vitl-normal 331M, vitb-normal 104M, vits-normal 35M. Code is MIT, apart from DINOv2 code under Apache-2.0. A third party lists the weights as MIT, so verify on the HF cards. A MoGe-3 with volumetric refinement is reported. — [GitHub microsoft/MoGe](https://github.com/microsoft/moge); [LibreYOLO docs](https://www.libreyolo.com/docs/models/moge-2)

**UniDepth V2 (2025, arXiv 2502.20110)**
- Predicts metric depth plus camera intrinsics, and accepts known intrinsics. Adds a confidence output. Backbones are ViT-S/B/L. Licence is CC BY-NC 4.0, so non-commercial. — [GitHub lpiccinelli-eth/UniDepth](https://github.com/lpiccinelli-eth/UniDepth); [arXiv 2502.20110](https://arxiv.org/pdf/2502.20110)

**Metric3D v2 (2024, arXiv 2404.15506)**
- Joint metric depth and surface normals. Backbones are about 22M (ViT-S), 306M (ViT-L) and 1011M (ViT-g). It needs intrinsics. The licence was not stated on the paper page. — [arXiv 2404.15506](https://arxiv.org/html/2404.15506v4)
- Normal accuracy (Table II), mean / median angular error: NYUv2 zero-shot ViT-L 13.1° / 7.1° (66.2% of pixels <11.25°); ScanNet ViT-g 9.2° / 5.0°; iBims-1 zero-shot ViT-L 19.4° / 5.7°. Omnidata zero-shot NYUv2: 16.7° / 9.6°. — [arXiv 2404.15506](https://arxiv.org/html/2404.15506v4)

**Normal-only models (DSINE CVPR 2024, Lotus, StableNormal)**
- DSINE "assumes known camera intrinsics, but providing approximate intrinsics still gives good results". Without them it assumes a 60° FOV. — [GitHub baegwangbin/DSINE](https://github.com/baegwangbin/DSINE)
- NYUv2 mean angular error under the DSINE protocol: Lotus-D 16.2°, DSINE 16.4°, Lotus-G 16.5°, StableNormal 18.6°. ScanNet: DSINE 16.2°, Lotus-D 14.7°. — [PINE arXiv 2611.29389](https://arxiv.org/pdf/2611.29389). Dens3R's own evaluation gives higher numbers (NYUv2 DSINE 18.6°, Lotus-G 17.5°, StableNormal 19.7°). — [Dens3R arXiv 2507.16290](https://arxiv.org/pdf/2507.16290)

**Marigold**
- v1/v1.1: code Apache-2.0, weights under CreativeML OpenRAIL++-M (use-based restrictions). It is diffusion-based and multi-step, so heavy on a phone. A Marigold V2 with Apache-2.0 weights is reported by one blog only, so it is unverified. — [orcarouter.ai blog](https://www.orcarouter.ai/blog/depth-pro-2-vs-marigold)

### Inferences
- Per-pixel mean normal error of about 13–17° is dominated by edges, clutter and fine structure. A climbing wall is a large plane covering much of the frame, and fitting one plane to thousands of points (or averaging normals over the wall mask) usually gets well below per-pixel error. What remains is *systematic* bias: wrong focal length or FOV, and the model "flattening" or "bending" an unusual-looking surface. A wrong FOV skews the fitted plane's tilt, especially when the wall is photographed obliquely. Expect perhaps 3–8° whole-plane error from a model alone. This is a guess; no benchmark found measures it.
- The phone can supply intrinsics: EXIF focal length plus sensor size, or a per-device lens lookup. That removes the FOV error source for MoGe-2, DSINE, Metric3D and UniDepth, which all accept known intrinsics.
- Commercial-licence-safe candidates: MoGe-2 (MIT, verify weights), DA-V2-Small (Apache), DA3-Small/Base/Metric-Large (Apache), DSINE (licence not confirmed). Ruled out for a commercial app: DA-V2-Base/Large, UniDepthV2, Depth Pro 2 (all non-commercial), and probably original Depth Pro (unclear terms).

### Gaps
- No published benchmark of *whole-plane* orientation error, as distinct from per-pixel normal error, for any of these models, and none on climbing walls.
- No phone latency figures found for MoGe-2-ViT-S or DA-V2-Small. The Qualcomm page showed none. A ViT-S at 518² is typically a few hundred ms on a mid-range NPU or GPU, but that is not sourced.
- DSINE's and Metric3D v2's code and weights licences were not confirmed from their LICENSE files.
- MoGe-2 weights licence is confirmed only by a third party.

## Plane fitting: RANSAC on back-projected points, robustness to holds and volumes

### Takeaway
Back-project the metric depth or point map with known intrinsics and RANSAC-fit one dominant plane. Holds stick out only a few cm and are outliers to a tight inlier threshold, so they barely matter. Volumes are large planar outliers and can capture the fit, so use the largest inlier set, a wall mask, or an angle-consistency check. No climbing-specific source was found.

### Cited Findings
- ARCore's Raw Depth is "more accurate" but sparse, and comes with a per-pixel confidence image. Google positions it for "3D reconstruction, measurement and shape detection". — [ARCore Raw Depth docs](https://developers.google.com/ar/develop/java/depth/raw-depth?hl=en)
- UniDepthV2 outputs a per-pixel uncertainty that "you can threshold on", which is useful for weighting a plane fit. — [GitHub UniDepth](https://github.com/lpiccinelli-eth/UniDepth)

### Inferences
- Pipeline: point map → keep high-confidence points → RANSAC plane (threshold about 1–2% of distance to the wall) → least-squares refine on inliers → normal n_cam → rotate by the IMU gravity at capture → overhang = asin of the normal's vertical component, sign-corrected. With an affine-invariant model you would first have to recover the shift and focal (LeReS-style), which adds failure modes.
- The board's frame edges and kicker can contaminate the fit. Cropping to the hold-grid region helps; it could come from the hold-segmentation work, which is a separate note.

### Gaps
- No published robustness numbers for plane fits on climbing walls with holds or volumes.

## Classical / sensor approaches: IMU gravity + image geometry, or phone-against-wall inclinometer

### Takeaway
The simplest way to hit ±1–2° is the inclinometer approach: lay the phone flat on the board (or on a straightedge across holds) and read the accelerometer. It works on every platform including web (DeviceMotion), needs no model, and dedicated climbing apps already do it. The best single-photo approach is IMU gravity plus geometry of the known board grid: for a MoonBoard, its hold grid gives a homography of a known rectangle, and with the phone's intrinsics that gives the plane normal in camera coordinates. Vanishing points with an IMU prior reach about 1–2.5° camera-rotation error in the literature.

### Cited Findings
**Phone tilt accuracy**
- Clinical validation of smartphone inclinometers in static placement: tibial alignment mean difference 0.7–1.1° against motion capture, SEM 0.7°, MDC95 1.8°, better than a manual inclinometer (SEM 1.0°, MDC95 2.6°). — [PubMed 33710269](https://pubmed.ncbi.nlm.nih.gov/33710269/)
- Huawei Mate 20 Pro built-in inclinometer precision: "one degree". — [PMC9130239](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9130239/)
- Less than 2° of variability attributable to the phone, app and examiner in elbow ROM. Errors grow to 2–7° when held against moving body parts, which is mainly a placement issue, not the sensor. — [Touro scholar PDF](https://touroscholar.touro.edu/cgi/viewcontent.cgi?article=1049&context=chhs_pubs)
- In engineering use the IMU roll is assumed accurate to better than 0.1° (an assumption in a single-VP orientation paper). — [Applied Sciences 12(16):8295](https://doi.org/10.3390/app12168295)
- During walking or localization traces, smartphone gravity estimates average about 5° error (SD 2.5°). This is dynamic, not a static photo. — [RGNet](https://www.researchgate.net/publication/357038307_RGNet_Robust_Gravity_Estimation_Neural_Network_for_IMU-based_Localization_Using_Smartphone). Full phone orientation including heading can be >20° off, but gravity alone is much better. — [CMU thesis](https://www.ri.cmu.edu/app/uploads/2020/08/Scott_MSR_Thesis.pdf)

**Vanishing points plus gravity**
- Pautrat et al. (ICCV 2023) estimate three orthogonal VPs and the unknown focal length using an IMU vertical prior. Example rotation error: 2.54° with the 2-line solver, 0.83° with hybrid RANSAC. It stays robust with a rough prior (3.9° average gravity error). Code: cvg/VP-Estimation-with-Prior-Gravity. — [arXiv 2308.10694](https://arxiv.org/pdf/2308.10694)
- Real-time VP detection on an iPhone 5S at 15 fps uses gravity as a constraint and gets camera-orientation error under 2°. — [Pattern Recognition Letters 2018](https://www.sciencedirect.com/science/article/abs/pii/S0167865518302800)
- Patent US 9098229: plane normals come from the cross product of a vanishing point and gravity. This assumes upright (vertical) faces, which is exactly the assumption an overhang breaks. — [US 9098229](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9098229)

### Inferences
- For a tilted wall, use the wall's own two in-plane vanishing directions: grid rows and grid columns. Their cross product is the wall normal in camera coordinates (needs K). A MoonBoard's regular hold grid, its panel seams or bolt-hole rows, and its rectangular outline make this well conditioned. Alternatively, fit the homography from the grid's four corners to a known-aspect rectangle and decompose it with K to get R and the normal. The aspect ratio also lets you self-calibrate the focal length when EXIF is missing.
- Error sources: lens distortion (undistort first), corner-picking error (let the user drag four corners, or detect the grid), a near-frontal view (a homography taken face-on is poorly conditioned for tilt; shoot from an angle, say 20–40° off-axis), and IMU tilt error (about 0.1–1° static). Expected total: plausibly 1–3°. No source measures this on climbing walls.
- Gravity must be sampled at the shutter instant, phone held still. Low-pass the accelerometer, or use the OS gravity vector (iOS CMDeviceMotion.gravity, Android TYPE_GRAVITY, Expo `DeviceMotion`). The image-to-device axis mapping must account for camera orientation.
- The inclinometer mode has no vision error at all. Its weaknesses are a camera bump (calibrate by flipping the phone), holds preventing flush contact (use a straightedge or the board's frame or kicker), and walls out of reach, such as high gym overhangs.

### Gaps
- No paper found on estimating slope or overhang tilt from a known-grid homography with IMU, with error measured on real walls.
- MoonBoard grid physical spacing and panel dimensions were not looked up. The aspect ratio would need confirming from Moon's spec.

## ARKit / ARCore plane detection and LiDAR

### Takeaway
iOS ARKit and ARCore classify planes only as horizontal or vertical. An overhanging wall will be missed, or force-snapped to vertical. Slanted plane anchors exist only on visionOS 2. On iOS the route is scene depth or scene-reconstruction mesh (LiDAR on Pro models) plus your own plane fit, and on Android ARCore Depth / Raw Depth plus your own fit. All of these require a live AR session, not a saved photo.

### Cited Findings
- An Apple engineer on the Developer Forums: "ARKit only detects planes that are either perpendicular or parallel to gravity, so an ARPlane's alignment will always either be .horizontal or .vertical". The engineer pointed to the scene reconstruction mesh for slanted surfaces such as ramps. — [Apple Dev Forums 723532](https://developer.apple.com/forums/thread/723532)
- visionOS 2 added `.slanted` alignment to `PlaneDetectionProvider`. — [WWDC24 session 10100](https://developer.apple.com/videos/play/wwdc2024/10100/); [stepinto.vision](https://stepinto.vision/example-code/arkit-planedetectionprovider-classification-and-alignment/)
- ARCore detects horizontal and vertical planes via SLAM feature clusters. — [ARCore fundamentals](https://developers.google.com/ar/develop/fundamentals)
- ARCore Depth API: per Google's device list, as of Nov 2026 over 85% of active devices support it. Not all ARCore devices do, and support must be checked at runtime. Raw Depth needs no ToF sensor but uses one if present, costs about half the compute of full depth, and comes with confidence. — [ARCore supported devices](https://developers.google.com/ar/devices); [Raw Depth docs](https://developers.google.com/ar/develop/java/depth/raw-depth?hl=en)
- Third-party claim: ARCore measurement error about ±1–2 cm indoors, with worse drift on angled or reflective, low-texture walls. — [Netguru blog](https://www.netguru.com/blog/augmented-reality-room-planning-technologies)

### Inferences
- Live AR does give gravity-aligned world coordinates for free, and a depth-based fit over a 3–4 m wall from LiDAR would likely be within about 1°. But it brings in a heavy native AR dependency: ViroReact or a custom Expo module, with ARKit and ARCore session management. That conflicts with the app's "no root-level SDKs, instant startup" principle unless it is isolated behind a lazily loaded screen, and it is out of proportion for a one-off angle reading.
- RN inference runtimes for the model route: react-native-fast-tflite (Nitro, CoreML/Metal/GPU delegates, Expo config plugin) — [GitHub mrousavy/react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite); onnxruntime-react-native (needs prebuild and a dev client, CPU/NNAPI/CoreML) — [Simplico guide](https://www.simplico.net/2026/01/21/how-to-use-an-onnx-model-in-react-native-and-other-mobile-app-frameworks/); React Native ExecuTorch (.pte) — [SWM blog](https://swmansion.com/blog/on-device-ai-ml-in-react-native-137918d0331b/). A roughly 35–100 MB model would also add significantly to APK/IPA size.

### Gaps
- No source quantifies ARKit LiDAR mesh plane-angle accuracy.
- Current ViroReact maintenance status and Expo SDK 57 compatibility were not checked.

## Existing climbing apps that measure wall angle

### Takeaway
No major board app (MoonBoard, Kilter, Tension; Stokt not found) measures the angle. The user selects it, or the board reports it. The one dedicated tool found, Climb Angle Meter (Android), is a phone-against-the-wall inclinometer. No camera-based wall-angle app was found.

### Cited Findings
- Climb Angle Meter: "place the back of your phone against the wall". It handles any phone orientation, calibrates for the camera bump, and reports angle past vertical, which generic inclinometers often get wrong (they measure from horizontal). It is ad-free. — [Google Play](https://play.google.com/store/apps/details?id=com.climbangletool.climbangletool&hl=en_US)
- Official MoonBoard app: the user selects the angle (25°/40°). — [climbingfacts guide](https://climbingfacts.com/how-to-use-the-moonboard/); [unlevel-edge](https://unlevel-edge.com/blogs/climbing-blog/moonboard-climbing-setup-angles-benchmarks-and-high-quality-sessions)
- Kilter: adjustable 0–70° in 5° steps, set from the app or an on-board controller. For custom setups the app asks "What is the wall angle? Choose the angle the wall is at currently". — [climbing.com](https://www.climbing.com/gear/6-best-climbing-apps/); [hawaiiclimb](https://www.hawaiiclimb.com/kilterboard); [boulderingai](https://boulderingai.com/blog/kilter-board/)
- Tension Board 2: choose the angle if the board is adjustable. — [Gripped](https://gripped.com/indoor-climbing/how-to-use-a-tension-board/)
- Generic clinometer apps such as Measure Angles Pro (iOS) measure along the phone's edges. — [App Store](https://apps.apple.com/py/app/measure-angles-pro-level-tool/id948840202?l=en-GB)

### Inferences
- Commercial board angles are discrete and known (MoonBoard 25/40; Kilter and Tension in 5° steps). For those, measurement only has to *snap* to the nearest preset, so ±2.5° is enough and an image method only needs to be right within half a step. Home spray walls are where a continuous measurement matters.

### Gaps
- No information found on Stokt, Lattice or Crimpd angle features. The searches returned nothing.

## Recommendation (inferred from the findings above)

### Takeaway
Ship a sensor-first hybrid. (1) The **primary mode is an inclinometer**: the phone is laid on the board, the gravity vector gives the angle past vertical, there is a flip-to-calibrate step for the camera bump, and the result snaps to the board's presets when the board is known. It is about ±1° (clinical static data 0.7–1.8°), runs on iOS, Android and web, and is a few dozen lines with expo-sensors. (2) The **photo mode** uses IMU gravity at the shutter plus board geometry: the user drags four corners of the board or grid (or a detector does it), then homography or VP decomposition with EXIF intrinsics gives the wall normal. It is plausibly ±1–3° when shot off-axis, has no ML, and also works for gym walls out of reach when they have a rectangular feature. (3) A **depth-model fallback** for featureless spray walls: MoGe-2 ViT-S-normal (35M, MIT) with known intrinsics, RANSAC plane, IMU rotation. It is shown with a confidence and labelled approximate, because ±2–3° is not demonstrated in the literature (per-pixel normal errors are 9–17° mean). Skip ARKit and ARCore: they don't detect slanted planes on iOS or Android, they need a live session, and they bring heavy native dependencies.

### Cited Findings
- Static phone inclinometry: 0.7–1.1° mean difference, MDC95 1.8°. — [PubMed 33710269](https://pubmed.ncbi.nlm.nih.gov/33710269/)
- An existing climbing tool uses exactly the inclinometer approach. — [Climb Angle Meter](https://play.google.com/store/apps/details?id=com.climbangletool.climbangletool&hl=en_US)
- VP plus gravity: 0.83–2.54° rotation error. — [Pautrat et al. ICCV 2023](https://arxiv.org/pdf/2308.10694)
- MoGe-2 checkpoints and licence. — [GitHub microsoft/MoGe](https://github.com/microsoft/moge)
- ARKit has horizontal and vertical planes only on iOS. — [Apple Dev Forums 723532](https://developer.apple.com/forums/thread/723532)

### Inferences
- Under the project's principles (local only, instant startup, no root-level SDKs), modes (1) and (2) add no model weights, no new native modules beyond expo-sensors (and the expo-camera already used for scanning), and nothing on the launch path. Mode (3) adds roughly a 35–100 MB asset and an inference runtime, so treat it as optional and later.
- Validate mode (2) cheaply: photograph a MoonBoard at the known 40° from several positions and compare.

### Gaps
- No empirical numbers for modes (2) or (3) on climbing walls. A small in-house test set is needed before promising ±2–3° in the UI.
