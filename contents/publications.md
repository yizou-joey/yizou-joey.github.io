# -----------------------------------------------------------------------------
# Reference examples (commented out)
# These are templates only and are not rendered.
#
# Supported fields:
# - date: YYYY-MM-DD (required for sorting/year display)
# - type: C | J | W | P
# - isSelected: true | false (homepage selected publications section)
# - workshopLabel: optional, only used when type: W (renders as "Workshop | <label>")
# - venue: full venue name
# - venueAcronym: short venue label shown in list chip
# - venueColor: hex color used by card view venue badge
# - title: publication title
# - authors: supports corresponding author marker with * or \*
# - description: optional body line in list/card view
# - award: optional highlight chip in list view
# - youtubeUrl / arxivUrl / pdfUrl: optional resource buttons
#
# Notes:
# - publicationId (e.g., C1/W1/P1) is computed automatically in JS.
# - If type is W and workshopLabel exists, description is hidden in list view
#   to avoid duplicate workshop text.
# -----------------------------------------------------------------------------
#
# Example 1: Conference (all common fields)
# - date: 2025-10-15
#   type: C
#   isSelected: true
#   venue: ACM UIST 2025
#   venueAcronym: UIST
#   venueColor: #0f766e
#   title: Adaptive Cross-Device Interaction with Context-Aware Intent Models
#   authors: Yi ZOU, Alex DOE, Jane SMITH\*
#   description: Full Paper
#   award: Best Paper Honorable Mention
#   youtubeUrl: https://www.youtube.com/watch?v=example1
#   arxivUrl: https://arxiv.org/abs/2501.01234
#   pdfUrl: files/example-paper.pdf
#
# Example 2: Workshop (with optional workshopLabel note)
# - date: 2024-03-01
#   type: W
#   isSelected: false
#   workshopLabel: NaviXR
#   venue: IEEE VR 2024
#   venueAcronym: IEEE VR
#   venueColor: #262189
#   title: Lightweight Navigation Cues for Situational Awareness in AR
#   authors: Yi ZOU, John DOE\*, Jane DOE\*
#   description: NaviXR Workshop
#   pdfUrl: files/example-workshop.pdf
#
# Example 3: Journal (minimal resources)
# - date: 2023-07-20
#   type: J
#   isSelected: false
#   venue: IEEE Transactions on Visualization and Computer Graphics
#   venueAcronym: TVCG
#   venueColor: #7c2d12
#   title: A Survey of Attention Guidance Techniques in Mobile Mixed Reality
#   authors: Yi ZOU, Research Collaborator
#   description: Journal Article
#   arxivUrl: https://arxiv.org/abs/2307.00001


- date: 2026-01-01
  type: W
  isSelected: true
  workshopLabel: NIDIT
  venue: IEEE VR 2026
  venueAcronym: IEEE VR
  venueColor: #262189
  title: Contextual Recovery: Guiding Hand Tracking Failures Recovery in Mixed Reality via VLM Reasoning
  authors: Yi ZOU, Ziming LI, Hai-Ning LIANG\*, Zhiming HU\*
  description: NIDIT Workshop
  youtubeUrl: https://www.youtube.com/watch?v=ndLDvRxWMRg&t=1s
  <!-- arxivUrl: https://arxiv.org/ -->
  <!-- pdfUrl: files/CV_EN.pdf -->

- date: 2026-01-01
  type: P
  isSelected: true
  venue: IEEE VR 2026
  venueAcronym: IEEE VR
  venueColor: #262189
  title: DodgeUI: An Adaptive Interface for Mitigating Attentional Conflict via Implicit Motion Cues in Mobile AR
  authors: Yi ZOU, Ao YU, Ziming LI, Hai-Ning LIANG\*, Pan HUI\*
  description: Poster
  <!-- award: Honorable Mention (Candidate) -->
  youtubeUrl: https://www.youtube.com/watch?v=6GY7u8pQ9s8
