# Climbing-hold detection and segmentation for on-device, offline use

Scope: datasets, pretrained models, open-source projects and approaches for detecting and segmenting climbing holds in wall photos and grouping them into routes by colour, with licences and phone suitability. Researched 2026-11-25. Several Roboflow Universe pages return HTTP 403 to automated fetches, so some dataset facts come from GitHub repos that cite those datasets rather than from the dataset pages themselves. Those cases are flagged.

## Datasets: what exists, sizes, classes, masks vs boxes, licences

### Takeaway
No large, clearly licensed academic hold-segmentation benchmark exists. The usable data is on Roboflow Universe, mostly CC BY 4.0 and mostly boxes. The biggest mask set is ClimbInst on Hugging Face (about 1.2-1.5k images, 89k masks, one class), but it has no clear licence. The only clearly licensed academic mask set (Sláma, CC BY-SA 4.0) is tiny. Hold-type labels (crimp, jug, sloper) appear only in small or noisy sets, and no public dataset carries route-colour labels at scale.

### Cited Findings
**Roboflow Universe**
- "Climbing Holds and Volumes" (Blackcreed, 2024): 1,717 images of indoor walls, holds and volumes, from various angles and lighting — [Roboflow search summary](https://universe.roboflow.com/blackcreed-xpgxh/climbing-holds-and-volumes). The climbML repo describes v12 as 1,650 images with YOLO-format **boxes** for two classes (hold, volume), 60,804 boxes, a 13.9:1 hold-to-volume imbalance, licensed CC BY 4.0 — [kianjfeiz/climbml](https://github.com/kianjfeiz/climbml). Boulderscanner also lists it as boxes, CC BY 4.0 — [TimHarri/DAV_OG_Boulderscanner](https://github.com/TimHarri/DAV_OG_Boulderscanner). CruxCoach credits v14 (CC BY 4.0) and got its masks from a separate "mask teacher" model, which implies v14 has no masks — [CruxCoach PR #49](https://github.com/CruxCoach/CruxCoach/pull/49).
- Several Universe projects share the name "Climbing Holds and Volumes", and one is box-only. Universe returns 403 to scripted reads, so the climb-beta project plans to have a person confirm in a browser whether the copy it uses has masks and is CC BY 4.0 — [climb-beta issue #12](https://github.com/aakash-tir/climb-beta/issues/12). Another copy (robworkspace) is CC BY 4.0 with boxes — [robworkspace copy](https://universe.roboflow.com/robworkspace-xfv3r/climbing-holds-and-volumes-c91sa).
- Rock-Climbing-Hold-Detection (GDSCMoonless): 4,282 images, object detection (boxes); it appears to derive from Climbing Holds and Volumes v14 — [Roboflow](https://universe.roboflow.com/gdscmoonless/rock-climbing-hold-detection).
- Climbing Replica Test (Loboflow): 3,106 images, boxes, hold-type classes (climbing-holds, crimp, edge, foothold, hold, jug, pinch, pocket, positive, sloper) — [Roboflow](https://universe.roboflow.com/loboflow-go1lj/climbing-replica-test).
- Climb AI "Hold Detector": instance segmentation, CC BY 4.0, gym photos of holds and volumes — [Roboflow](https://universe.roboflow.com/climb-ai/hold-detector-rnvkl). The image count was not retrieved.
- climbtag/climbing-hold-detection: Boulderscanner recommends it as a polygon (mask) dataset with 4,926 images in v22, classes hold and volume, mAP@50 91.3%. Its licence is not stated in that source — [Boulderscanner](https://github.com/TimHarri/DAV_OG_Boulderscanner).
- Small sets: Roboflow's own "Climbing" (instance segmentation, 43 images, classes climbing-holds, floor, person); Gabriel Murry "Climbing Holds Detector" (86 images, one class); Brage "Climbing Holds" (42 images, CC BY 4.0); Pwals "Bouldering holds" (instance segmentation v4) — [Roboflow climbing-y56wy](https://universe.roboflow.com/roboflow-4rfmv/climbing-y56wy), [Murry](https://universe.roboflow.com/gabriel-murry-hbznu/climbing-holds-detector), [Brage](https://universe.roboflow.com/brage-drnsc/climbing-holds-mavv2), [Pwals](https://universe.roboflow.com/pwals/bouldering-holds-9wavr/dataset/4).

**Hugging Face / Kaggle**
- ClimbInst (ClimbVision): 1,509 images (1,169 / 290 / 50 splits), 89,020 instance masks, **one class** covering holds and volumes. The masks were generated with SAM 3 and corrected by hand in Labelme. No licence is named; the card says terms follow the sources (the Sláma Kaggle set and Roboflow "Climbing Holds and Volumes") plus newly collected images. No paper and no metrics — [HF dataset card](https://huggingface.co/datasets/ClimbVision/ClimbInst).
- An independent check found only 1,219 of the 1,509 claimed images present. The data is Labelme polygon JSON, about 4.2 GB, and that repo ships a `prepare.py` converting it to YOLO-seg format — [1SS28/climbing-beta](https://github.com/1SS28/climbing-beta). climb-beta calls ClimbInst the largest labelled outline source it found, about 4x anything they could label themselves — [climb-beta issue #72](https://github.com/aakash-tir/climb-beta/issues/72).
- Indoor Climbing Gym Hold and Route Segmentation (Tomáš Sláma, Kaggle, 2023): images from two gyms (Smíchoff, Boulderhaus). Few are labelled (15 bh, 2 bh-phone, 2 sm), as hand-drawn VIA polygons with a hold-type label; 8 images also have **route IDs**. Licence CC BY-SA 4.0 — [Kaggle](https://www.kaggle.com/datasets/tomasslama/indoor-climbing-gym-hold-segmentation), code at [xiaoxiae/Indoor-Climbing-Hold-and-Route-Segmentation](https://github.com/xiaoxiae/Indoor-Climbing-Hold-and-Route-Segmentation).
- Indoor Climbing Gym Hold Classification Dataset (Diego Spaziani, Kaggle): a hold-type classification set (crops). Details were not retrieved — [Kaggle](https://www.kaggle.com/datasets/diegospaziani/indoor-climbing-gym-hold-classification-dataset).

**Academic**
- The Way Up (Maschek & Schedl, CVPRW 2025): 22 annotated videos (11 recordings, 10 athletes, two routes graded 4c and 5a) with hold locations (boxes) and usage timing. It is for hold *usage*, not segmentation — [arXiv 2505.12854](https://arxiv.org/html/2505.12854v1), [CVF PDF](https://openaccess.thecvf.com/content/CVPR2025W/CVSPORTS/papers/Maschek_The_Way_Up_A_Dataset_for_Hold_Usage_Detection_in_CVPRW_2025_paper.pdf).
- Training-Free Hold-Usage Detection (arXiv 2609.30026, 2026) assumes the hold boxes are given and lists zero-shot hold detection as future work — [arXiv](https://arxiv.org/html/2609.30026v1).
- Vrzáková et al., Sensors 24(19):6479 (2024): YOLOv5 on frames from Tobii eye-tracking glasses, classes hold / grasp / foot grasp, mAP@0.5 0.8131 and mAP@0.5:0.95 0.473 — [Sensors / PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11479384/).
- CIMI4D (CVPR 2023) is a climbing *motion* dataset (RGB, LiDAR, IMU, scene meshes of 13 walls), not hold labels — [arXiv 2303.17948](https://arxiv.org/pdf/2303.17948).

**Board datasets**
- I found no public image dataset of photographed MoonBoard, Kilter or Tension boards with hold annotations. Commercial apps (Boardsesh, the official MoonBoard app) do hold recognition on their own data — [Boardsesh](https://www.boardsesh.com/apps/moonboard), [MoonBoard app](https://play.google.com/store/apps/details?id=com.trainingboard.moon&hl=en).

### Inferences
- The only clearly redistributable training data for a free app is CC BY 4.0 Roboflow sets (attribution required). These are mostly boxes, so masks would have to come from SAM-style pseudo-labelling, as CruxCoach and ClimbInst both did.
- CC BY-SA 4.0 (Sláma) applies share-alike to the data and arguably to derived datasets. Whether trained weights count as derivatives is unsettled. It is small enough to use only for evaluation.
- ClimbInst is the best mask data technically, but "no licence plus mixed sources" is a distribution risk. It is safest kept to internal evaluation unless the maintainers clarify.

### Gaps
- Exact image counts and licences of the Climb AI and climbtag mask sets could not be verified, because Roboflow returns 403 to the fetcher.
- The full Spaziani Kaggle dataset details were not retrieved.
- The "Deep Neural Strategies for Uncovering Climbing Elements and Mapping Route Patterns" paper (ubplj.org) cites the Sláma set, but its page is behind a login, so its methods and metrics are unknown.
- No dataset with per-hold route-colour labels at scale was found.

## Models and open-source projects, weights and licences (AGPL issue and permissive alternatives)

### Takeaway
Almost every open hold detector on GitHub is Ultralytics YOLO (v8, 11 or 26) and therefore AGPL-3.0. That is a real obligation for a distributed app, though a free open-source app could comply by releasing its source. Permissive detector families are viable: RF-DETR-Seg (Apache-2.0, but 33.6M params at its smallest size), RTMDet-Ins, YOLOX, D-FINE, DEIM and RT-DETR (all Apache-2.0). Hardly any project publishes accuracy numbers.

### Cited Findings
**Projects**
- aakash-tir/climb-beta: YOLO11-seg (likely nano) with classes hold, volume and tape; colour-blind detection followed by a separate colour step; one gym (Basecamp Toronto). It is pretrained on Roboflow Climbing Holds and Volumes (CC BY 4.0). The code is AGPL-3.0-or-later *because* Ultralytics is AGPL. No metrics, only targets: hold recall ≥95% at mask IoU ≥0.5, mask mAP50 ≥0.85, colour accuracy ≥95%, pink-vs-red ≥90% — [repo](https://github.com/aakash-tir/climb-beta). A later PR colours the tape diamonds as the grade — [PR #85](https://github.com/aakash-tir/climb-beta/pull/85).
- seesaw-earth/ClimbColor: an open-source iPhone app running a custom YOLO26-seg Core ML model (`ClimbHoldSeg.mlpackage`) at 640 px on the full photo, without tiling. A 1024 px test gave 84 vs 82 detections, no real gain. Masks are turned into vector outlines with marching squares and Chaikin smoothing. Code is AGPL-3.0 and it bundles the UltralyticsYOLO package (AGPL). Fully on-device. Long-pressing empty wall re-detects on a close-up crop; long-pressing a hold removes it — [repo](https://github.com/seesaw-earth/ClimbColor).
- mmarci778/Spricc (Holdroute) has four backends: classical (edges plus watershed; about 8 s on one CPU core for a 361-hold wall, which over-splits against a visual estimate of 250-300 real holds), SAM, SAM 2 and fine-tuned YOLO-seg (tiled). The author says the SAM, SAM 2 and YOLO backends have **never been run**. No weights, no licence stated, no metrics. Recommended workflow: SAM proposals, then correct them in the UI, then fine-tune YOLO on the corrections — [repo](https://github.com/mmarci778/Spricc).
- 1SS28/climbing-beta fine-tunes YOLO11-seg on ClimbInst — [repo](https://github.com/1SS28/climbing-beta).
- kianjfeiz/climbml: YOLO26n detection, then colour clustering, then VLM plus Set-of-Mark beta, trained on Climbing Holds and Volumes v12 — [repo](https://github.com/kianjfeiz/climbml).
- ryanwiddop: Mask R-CNN hold detection, then CIELab colour binning, then DBSCAN spatial clustering plus DFS route tracing, plus grade classification — [repo](https://github.com/ryanwiddop/Indoor-Climbing-Route-Segmentation-and-Grade-Classification).
- mac-edmondson/zero-shot-route-segmentation (ROUTNet) has pluggable detectors (YOLOv8, SAM 3, Mask R-CNN, ground truth) and groupers (DINOv3 clustering, a DINO pair head, a colour-only baseline). It reports mAP, P and R for detection and pairwise F1, ARI and NMI for grouping, and has a robustness suite (per-hold chalking, recolouring, lighting shifts). No numbers appear in the README (they are in `report/report.pdf`) and no licence file was found — [repo](https://github.com/mac-edmondson/zero-shot-route-segmentation).
- CurrenWong/climb-color finds the route colour from video, prompting EdgeSAM with the climber's body position and voting on pixel colour — [repo](https://github.com/CurrenWong/climb-color).
- scsukas8/NeuralClimb is an older, paused project using keypoints and k-means in HLS — [repo](https://github.com/scsukas8/NeuralClimb).
- Boardsesh (commercial) detects holds on spray-wall photos and traces lit holds' shapes from the board art — [Google Play](https://play.google.com/store/apps/details?id=com.boardsesh.app&hl=en).

**Licences**
- Ultralytics YOLOv5 (since April 2023), YOLOv8, YOLO11, YOLO26 and YOLOv10 are all AGPL-3.0. Ultralytics says AGPL covers "the training code and the models produced by that training code". Whether weights you train yourself are derivatives is untested in court. YOLOv7 and YOLOv9 originals are GPL-3.0, with MIT rewrites by MultimediaTechLab. LibreYOLO is MIT, but its checkpoints carry their own source terms (some are cc-by-nc) — [LibreYOLO licence guide](https://www.libreyolo.com/articles/yolo-licenses-explained).
- Apache-2.0 with no carve-outs: YOLOX, RTMDet (MMDetection, not the GPL MMYOLO), D-FINE, DEIM, RT-DETR (lyuwenyu) and PP-YOLOE (PaddleDetection only). DEIMv2's larger sizes fall under Meta's DINOv3 terms — [LibreYOLO guide](https://www.libreyolo.com/articles/yolo-licenses-explained).
- RF-DETR: the package, detection N/S/M/L and **every RF-DETR-Seg size (Nano to 2XL)** are Apache-2.0. The tiny Atto/Femto/Pico detection sizes and XL/2XL detection are under Roboflow's Platform Model License 1.0, which is not permissive for self-hosting. RF-DETR-Seg-N: COCO AP50 63.0, mask AP 40.3, 3.4 ms on a T4 with TensorRT FP16, **33.6M params**, 312x312 input. For comparison, YOLO26-N-Seg has 2.7M params (AGPL) — [rf-detr GitHub](https://github.com/roboflow/rf-detr), [Roboflow licence page](https://roboflow.com/model-licenses/rf-detr), [seg blog](https://blog.roboflow.com/rf-detr-segmentation/).
- YOLO-NAS: SuperGradients code is Apache-2.0, but the pretrained weights (and, per LICENSE.YOLONAS.md, the architecture) are for research and non-commercial use only. Deci was dissolved after NVIDIA acquired it in May 2024, and weight URLs are 404ing — [NVIDIA forum](https://forums.developer.nvidia.com/t/licensing-and-usage-terms-for-yolo-nas-model/326342), [LibreYOLO guide](https://www.libreyolo.com/articles/yolo-licenses-explained).
- YOLO-World (Tencent) is GPL-3.0; the Ultralytics-packaged version is AGPL — [Roboflow YOLO-World licence](https://roboflow.com/model-licenses/yolo-world), [LibreYOLO guide](https://www.libreyolo.com/articles/yolo-licenses-explained).

### Inferences
- Rivet is free and local-only, so AGPL does not forbid shipping. It does oblige making the complete corresponding source of the app available under AGPL-compatible terms, which is a project-level licence decision. If the app is not going to be AGPL, avoid Ultralytics training and runtime entirely.
- The cleanest permissive mobile path is probably an Apache-2.0 instance-segmentation model (RTMDet-Ins-tiny, or an RF-DETR-Seg-N export) fine-tuned on CC BY 4.0 data with SAM-generated masks. RF-DETR-Seg-N is about 12x the parameters of YOLO26n-seg, so phone latency must be measured. RTMDet-Ins-tiny is the lighter Apache-2.0 option (its size and mobile figures were not verified here).
- No permissively licensed, pretrained hold-segmentation *weights* were found. Every published hold model is either AGPL (Ultralytics) or hosted on Roboflow under platform terms, so a fine-tune would be needed.

### Gaps
- LW-DETR's licence was not verified (not covered by the sources fetched).
- RTMDet-Ins and RF-DETR-Seg latency on phones (Core ML or TFLite/LiteRT) was not found.
- Licence terms for Roboflow-hosted pretrained hold models (for example Climb AI) were not verified.
- No project reports a held-out mask AP for holds except Boulderscanner's quoted mAP@50 of 91.3% for climbtag, which comes second-hand.

## Promptable / zero-shot segmentation (SAM family, open-vocabulary detectors)

### Takeaway
Tap-to-segment works on phones today. EdgeSAM is the fastest (about 26 ms image encode on an iPhone 14) but is under the S-Lab licence, which needs checking and is likely non-commercial. MobileSAM and EfficientSAM are about 7x slower on iPhone and believed to be Apache-2.0. SAM and SAM 2 are Apache-2.0; SAM 3 uses Meta's custom but commercial-friendly SAM License. Open-vocabulary detectors are either GPL (YOLO-World) or heavy.

### Cited Findings
- EdgeSAM: the first SAM variant over 30 FPS on an iPhone 14, with a 26 ms image encode (Core ML). Throughput on iPhone 14 / RTX 2080 Ti: MobileSAM 4.9 / 103.5 FPS, EfficientSAM-Ti 4.9 / 103.5, EdgeSAM 38.7 / 164.3. EdgeSAM needs 22.1 GFLOPs against MobileSAM's 38.2. EfficientSAM uses the same encoder as MobileSAM — [EdgeSAM arXiv 2312.06660v2](https://arxiv.org/pdf/2312.06660v2).
- EdgeSAM licence: "NTU S-Lab License 1.0" — [EdgeSAM GitHub](https://github.com/chongzhou96/EdgeSAM). (The restriction to non-commercial use is from prior knowledge and was not verified against the LICENSE text.)
- Survey latencies on CPU / GPU: MobileSAM 424 / 44 ms, EdgeSAM 259 / 49 ms, EfficientSAM-S 2605 / 86 ms — [arXiv 2410.04960](https://arxiv.org/html/2410.04960v1).
- SAM and SAM 2 are Apache-2.0. SAM 3 (19 November 2025) is under the custom "SAM License": royalty-free and allows commercial use and redistribution, but bans military, weapons, ITAR and sanctioned uses, and ends if you sue Meta over IP — [Roboflow SAM 3 licence](https://roboflow.com/model-licenses/segment-anything-3).
- SAM 3 was used to pre-label ClimbInst's 89k masks before hand correction, which shows it is practical as a labelling teacher — [ClimbInst card](https://huggingface.co/datasets/ClimbVision/ClimbInst).
- Spricc's assessment: SAM and SAM 2 cut along real boundaries regardless of colour but "don't know what a hold is", so they need selection rules or a classifier — [Spricc](https://github.com/mmarci778/Spricc).

### Inferences
- For the UX, "tap a hold to outline it" with MobileSAM (Apache-2.0, assuming that is verified) costs about 200 ms per image encode on an iPhone 14, judging by 4.9 FPS. Each tap then only runs the small decoder, so it feels instant. That fits Rivet's rule that nothing runs on the launch path: load the model only on the scan or edit screen.
- Avoid YOLO-World (GPL) in an app that is not GPL. Grounding DINO and OWLv2 are believed to be Apache-2.0 but are too heavy for real-time phone use; they are better as offline labelling tools (unverified here).

### Gaps
- MobileSAM, EfficientSAM and NanoSAM licences and SAM 2-tiny phone latency were not verified with primary sources in this pass.
- Grounding DINO and OWLv2 licences and sizes were not fetched.
- No benchmark of SAM variants specifically on climbing holds was found (ROUTNet's report.pdf may contain one).

## Classical approaches and known-board (MoonBoard) registration

### Takeaway
Colour thresholding and k-means alone fail on real gym walls (overlap, two-tone holds, chalk, holds the same colour as the wall), though edges plus watershed works as a weak CPU baseline. For MoonBoard and other fixed boards, hold detection is not needed at all. The app already knows each hold set's layout (`src/lib/moonboard/boards.ts`), so registering the board with a homography and reading the known grid positions is the sensible approach. No public implementation was found.

### Cited Findings
- Spricc rejected colour thresholding and k-means because they over-split chalky and multi-colour holds and fail on overlap and on holds matching the wall colour. It kept edges plus watershed as a no-GPU baseline: about 8 s per wall on one core, still over-splitting. Its listed failure modes:
  - touching and overlapping holds
  - chips on volumes, which need nested masks
  - two-tone holds
  - chalk and gloss that look like white holds
  - white, cream and yellow holds against plywood
  - hold areas spanning about two orders of magnitude
  - wall seams creating false edges

  — [Spricc](https://github.com/mmarci778/Spricc)
- Bounding-box detectors were rejected for this task because dense boxes overlap badly; the task needs masks — [Spricc](https://github.com/mmarci778/Spricc).
- MoonBoard LEDs sit at each t-nut position. Start holds light green, intermediate holds blue, the finish hold red — [MoonBoard guide PDF](https://static1.squarespace.com/static/5b680ff22714e5a2859144bf/t/5e4422a70c7e7311c6a60ecc/1581523625176/How+to+use+The+MoonBoard.pdf).
- The official MoonBoard app now offers custom boards with "automated hold recognition" — [Google Play](https://play.google.com/store/apps/details?id=com.trainingboard.moon&hl=en). Boardsesh traces lit-hold shapes from the board art (a reference image), not from user photos — [Boardsesh](https://play.google.com/store/apps/details?id=com.boardsesh.app&hl=en).
- No open-source "photograph a MoonBoard, warp it to the grid, read the holds" implementation was found. Chessboard-detection techniques (Harris corners, Hough lines, handling occlusion) are the closest documented method — [Wikipedia: Chessboard detection](https://en.wikipedia.org/wiki/Chessboard_detection).

### Inferences
- MoonBoard path: detect the board's outer frame or 4 corners, either by a tap from the user (most robust) or by line and quad detection, then compute a homography with OpenCV `findHomography` (or a pure-TS DLT). Map the known A-K × 1-18 hold grid into the photo. For lit-LED reading, sample hue and brightness at each projected position. For "which holds are on this wall", the hold set is already known per board. This needs no ML, no dataset, and no licence risk.
- The same idea extends to Kilter and Tension boards if their layouts are known; detection only matters for spray walls and gym walls.

### Gaps
- No measured accuracy for homography-based board registration from phone photos was found.
- No source covers LED colour reading under gym lighting or camera auto-exposure saturation of LEDs.

## Route grouping by colour, white balance, tape-marked routes

### Takeaway
Every working project separates "is it a hold" (a detector that ignores colour, trained with heavy hue augmentation) from "what colour is it" (colour statistics in CIELAB over the mask). Matching uses CIEDE2000 with lightness down-weighted, chalk pixels are rejected by low saturation and high lightness, and grey-world white balance is computed on wall pixels. Pink versus red, orange-yellow-pink continua, white holds and chalk are the recurring failures. Tape-marked routes need a separate "tape" class.

### Cited Findings
- ClimbColor matches with CIEDE2000 in CIELAB, threshold ΔE00 = 10 (adjustable), with lightness weighted at half (kL = 2) so uneven lighting keeps a colour together. Glare is removed only when it is a minority of the mask. No explicit white-balance step. v1.3 fixed mirrored colour sampling, masks too small to cover footholds, and white holds getting no colour — [ClimbColor](https://github.com/seesaw-earth/ClimbColor).
- climb-beta votes per pixel in HSV/Lab over each mask and removes chalk pixels (low saturation, high value). It tells pink from red by saturation and lightness rather than hue, handles white holds with an edge-ring rule, and applies grey-world white balance on wall pixels. It also trains a MobileNetV3 or ResNet18 crop classifier to compare against the rules. The detector uses heavy hue and saturation augmentation so it learns shape, texture and shadow. A `tape` class supports routes marked by tape and grade tape diamonds — [climb-beta](https://github.com/aakash-tir/climb-beta), [PR #85](https://github.com/aakash-tir/climb-beta/pull/85).
- ryanwiddop treats a hold as coloured if its 75th-percentile chroma is ≥12 or its 95th-percentile chroma is ≥25 (to beat chalk), then bins in CIELab, then applies DBSCAN spatial clustering and DFS route tracing — [repo](https://github.com/ryanwiddop/Indoor-Climbing-Route-Segmentation-and-Grade-Classification).
- 1SS28 takes the median CIELAB of each mask and clusters them. Single-linkage clustering failed because hold colours form a continuum from orange through yellow to pink — [1SS28/climbing-beta](https://github.com/1SS28/climbing-beta).
- ROUTNet compares DINOv3-feature clustering and a learned pair head against a colour-only baseline under synthetic chalk, recolouring and lighting shifts. Numbers are only in its report — [ROUTNet](https://github.com/mac-edmondson/zero-shot-route-segmentation).
- Spricc deliberately uses aggressive hue augmentation because "colour is not what makes something a hold" — [Spricc](https://github.com/mmarci778/Spricc).

### Inferences
- The most robust UX is "tap one hold, highlight every hold within ΔE00 of it", as ClimbColor does. It avoids a global clustering choice (and the continuum problem) and lets the user adjust the threshold. Showing colour names helps colour-blind users.
- Per-photo white balance (grey-world on wall pixels) is cheap and worth doing before the Lab conversion.

### Gaps
- No project publishes measured colour-grouping accuracy (for example pairwise F1) on real photos.
- No source quantifies how much white balance helps under LED or sodium gym lighting.

## Reported metrics and failure modes

### Takeaway
Published hold-detection numbers are scarce and not comparable. The mAP figures found are: Sensors 2024 YOLOv5 boxes, mAP50 0.81 / mAP50-95 0.47 (egocentric frames); climbtag masks, mAP50 91.3% (second-hand); ClimbColor, 82-84 detections on a test wall, recall unknown. The failure modes are consistent across sources.

### Cited Findings
- YOLOv5 (Sensors 2024): mAP@0.5 0.8131, mAP@0.5:0.95 0.473 — [PMC11479384](https://pmc.ncbi.nlm.nih.gov/articles/PMC11479384/).
- climbtag v22 mask dataset: mAP@50 91.3% (quoted by Boulderscanner) — [Boulderscanner](https://github.com/TimHarri/DAV_OG_Boulderscanner).
- RF-DETR-Seg-N on COCO: mask AP 40.3, and the paper claims it beats YOLOv8 and YOLO11 seg at all sizes — [rf-detr](https://github.com/roboflow/rf-detr), [arXiv 2511.09554](https://arxiv.org/pdf/2511.09554).
- Failure modes reported across sources:
  - Small holds and footholds: ClimbColor notes missed small holds; tiling was proposed — [ClimbColor](https://github.com/seesaw-earth/ClimbColor), [Spricc](https://github.com/mmarci778/Spricc).
  - Overlap and nesting (chips on volumes) — [Spricc](https://github.com/mmarci778/Spricc).
  - Chalk mistaken for white, and white holds discarded as chalk — [climb-beta](https://github.com/aakash-tir/climb-beta), [ryanwiddop](https://github.com/ryanwiddop/Indoor-Climbing-Route-Segmentation-and-Grade-Classification).
  - Glare and clipped pixels — [ClimbColor](https://github.com/seesaw-earth/ClimbColor).
  - Pink versus red, and the orange-yellow-pink continuum — [climb-beta](https://github.com/aakash-tir/climb-beta), [1SS28](https://github.com/1SS28/climbing-beta).
  - Hold-to-volume class imbalance (13.9:1) — [climbml](https://github.com/kianjfeiz/climbml).
  - Wall seams and two-tone holds — [Spricc](https://github.com/mmarci778/Spricc).

### Inferences
- Plan on tiling, or on re-running detection on a crop the user picks, to catch footholds, as ClimbColor's long-press does.

### Gaps
- No independent benchmark compares architectures on the same hold dataset.

## Recommendation: (a) MoonBoard / known boards, (b) arbitrary walls

### Takeaway
(a) Use no ML for known boards: a homography from 4 corners (tap or auto-detect) onto the layouts the app already knows. (b) For arbitrary walls, start with tap-to-segment using an Apache-2.0 SAM variant, then a ΔE00 colour match. If automatic detection is wanted later, fine-tune a small Apache-2.0 instance-segmentation model (RTMDet-Ins-tiny or RF-DETR-Seg-N) on CC BY 4.0 Roboflow data with SAM 2/3-generated masks. Avoid Ultralytics unless the app goes AGPL.

### Cited Findings
- The patterns used here are: board grids at known LED or t-nut positions — [MoonBoard guide](https://static1.squarespace.com/static/5b680ff22714e5a2859144bf/t/5e4422a70c7e7311c6a60ecc/1581523625176/How+to+use+The+MoonBoard.pdf); SAM as a labelling teacher — [ClimbInst](https://huggingface.co/datasets/ClimbVision/ClimbInst), [CruxCoach PR #49](https://github.com/CruxCoach/CruxCoach/pull/49); detection separated from colour — [climb-beta](https://github.com/aakash-tir/climb-beta); permissive model licences — [LibreYOLO guide](https://www.libreyolo.com/articles/yolo-licenses-explained), [rf-detr](https://github.com/roboflow/rf-detr).

### Inferences
- (a) MoonBoard and other fixed boards: four corner taps (or auto quad detection) give a homography. Project the known hold grid from `src/lib/moonboard/boards.ts` and optionally sample LED colour at each point. Pure TS plus a camera frame, fully testable in `src/lib`, nothing on the launch path, no licence concerns.
- (b) Arbitrary walls, in phases:
  1. Tap-to-segment: MobileSAM or EfficientSAM-Ti (Apache-2.0 once verified), or EdgeSAM only if the S-Lab licence allows it. Then ΔE00 ≤ 10 grouping in CIELAB with kL = 2, chalk rejection and grey-world white balance.
  2. Automatic detection: fine-tune RTMDet-Ins-tiny or RF-DETR-Seg-N (Apache-2.0) on CC BY 4.0 data (Roboflow Climbing Holds and Volumes, confirmed in a browser; Climb AI Hold Detector), with masks pseudo-labelled by SAM 2 (Apache) or SAM 3 (SAM License). Train with heavy hue augmentation and evaluate on the Sláma CC BY-SA set and ClimbInst (internal only). Export to Core ML and LiteRT and check phone latency before committing.
  3. Credit the CC BY 4.0 sources in the app.
- Alternative if the project accepts AGPL for the whole app: YOLO26n-seg (2.7M params) is the smallest proven on-device hold segmenter (ClimbColor ships it in Core ML), but this binds the app's source licence.

### Gaps
- No measured phone latency exists for permissive segmenters on hold images.
- The licence of fine-tuned weights trained on CC BY-SA data, and of Ultralytics-trained weights, is legally untested.
